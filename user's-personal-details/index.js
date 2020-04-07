// Import required packages
const restify = require('restify')
const path = require('path')

// Import required bot services.
const { BotFrameworkAdapter, MemoryStorage, UserState, ConversationState } = require('botbuilder')
const { UserProfileDialog } = require('./dailog/userProfileDialog')
const { DialogBot } = require('./bots/dialogBot')

//Set path for .env file
const ENV_FILE = path.join(__dirname, '.env')
require('dotenv').config({ path: ENV_FILE })

// Create bot adapter.
const adapter = new BotFrameworkAdapter({
    appId : process.env.MicrosoftAppId,
    appPassword : process.env.MicrosoftAppPassword
})

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    console.error('[onTurnError] Unhandled Error', error)
    await context.sendActivity('The bot encountered an error or bug.')
    await context.sendActivity('To continue to run this bot, please fix the bot source code.')
}
adapter.onTurnError = onTurnErrorHandler


// A bot requires a state store to persist the dialog and user state between messages.
const memoryStorage = new MemoryStorage()
const userState = new UserState(memoryStorage)
const conversationState = new ConversationState(memoryStorage)

// Create the main dialog.
const dialog = new UserProfileDialog(userState)
const bot = new DialogBot(userState, conversationState, dialog)

// Create HTTP server
const server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`)
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator')
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"')
})

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req,res, async (context) => {
        await bot.run(context)
    })
})