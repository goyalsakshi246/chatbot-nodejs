const { ActivityHandler } = require('botbuilder')

class DialogBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState
        this.userState = userState
        this.dialog = dialog
        this.dialogState = this.conversationState.createProperty('dialogState')
        
        this.onMessage(async (context,next) => {
            console.log('Running dialog with Message Activity.');

            await this.dialog.run(context, this.dialogState)
            await next();
        }); 

        this.onMembersAdded(async(context) => {
            for (const k in context.activity.membersAdded) {
                if (context.activity.membersAdded[k].id !== context.activity.recipient.id) {
                    context.sendActivity('Hello and Welcome');
                }
            }           
        });
    }

    async run(context) {
        await super.run(context);
        
        await this.userState.saveChanges(context);
        await this.conversationState.saveChanges(context);
    }
}

module.exports.DialogBot = DialogBot;
