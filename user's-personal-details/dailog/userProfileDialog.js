const { CardFactory } = require('botbuilder');

const {
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

const { UserProfile } = require('../userProfile');
const AdaptiveCard = require('../resources/adaptiveCard.json')

const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const EMAIL_PROMPT = 'EMAIL_PROMPT';
const AGE_PROMPT = 'AGE_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';

const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class UserProfileDialog extends ComponentDialog {
    constructor(userState) {
        super('userProfileDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new TextPrompt(EMAIL_PROMPT));
        this.addDialog(new NumberPrompt(AGE_PROMPT, this.agePromptValidator));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.numberStep.bind(this),
            this.mailStep.bind(this),
            this.ageChoiceStep.bind(this),
            this.ageStep.bind(this),
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }
    
    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, 'Please Enter your name.');
    }

    async numberStep(step) {
        step.values.name = step.result;
        await step.context.sendActivity(`Thanks ${ step.result }.`);

        return await step.prompt(NUMBER_PROMPT, 'Please Enter your Phone number.');
    }

    async mailStep(step) {
        step.values.phone_no = step.context.activity.text;
        return await step.prompt(EMAIL_PROMPT, 'Please Enter your mail-Id.');
    }

    async ageChoiceStep(step) {
        step.values.email = step.result;
        return await step.prompt(CHOICE_PROMPT, 'Do you want to give your age?', ['yes','no']);
    }

    async ageStep(step) {
        if (step.result.value === 'yes') {
            const promptOptions = { prompt: 'Please enter your age.', retryPrompt: 'The value entered must be greater than 0 and less than 150.' };
            return await step.prompt(AGE_PROMPT, promptOptions);
        }  else {
            return await step.next(-1);
        }
    }

    async confirmStep(step) {
        step.values.age = step.context.activity.text;
        return await step.prompt(CONFIRM_PROMPT, { prompt: 'Is this okay?' });
    }

    async summaryStep(step) {
        if (step.result) {
            await step.context.sendActivity('OK. Your profile is saved.');
            await this.detailCard(step);
        } else {
            await step.context.sendActivity('Thanks. Your profile will not be kept.');
        }
        return await step.endDialog();
    }
 

    async detailCard(step) {
        const userProfile = await this.userProfile.get(step.context, new UserProfile());

        userProfile.name = step.values.name;
        userProfile.phone_no = step.values.phone_no;
        userProfile.email = step.values.email;
        userProfile.age = step.values.age;

        const card = CardFactory.adaptiveCard(
            {
                "type": "AdaptiveCard",
                "version": "1.0",
                "body": [
                    {
                        "type": "TextBlock",
                        "text": "Personal Details:-",
                        "horizontalAlignment": "Left",
                        "size": "Medium",
                        "weight": "Bolder"
                    },
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "Name:",
                                "value": userProfile.name
                            },
                            {
                                "title": "Phone no.:",
                                "value": userProfile.phone_no
                            },
                            {
                                "title": "E-mail ID:",
                                "value": userProfile.email
                            },
                            {
                                "title": "Age:",
                                "value": userProfile.age
                            }
                        ]
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json"
            }
        );
        return await step.context.sendActivity({ attachments: [card] })
    }
     
    async agePromptValidator(promptContext) {
        return promptContext.recognized.succeeded && promptContext.recognized.value > 0 && promptContext.recognized.value < 150;
    }
}

module.exports.UserProfileDialog = UserProfileDialog;