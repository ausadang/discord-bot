const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require("dotenv").config();
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const commandFiles = fs.readdirSync(path.join(__dirname, 'command')).filter(file => file.endsWith('.js'));

const commands = [];
commandFiles.forEach(file => {
    const command = require(`./command/${file}`);
    commands.push(command.data);
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands globally...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );        
        console.log('Successfully registered application commands globally!');
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
})();

require('./handler')(client);

client.login(process.env.TOKEN)
    .then(() => console.log('Bot logged in successfully!'))
    .catch(error => console.error('Error logging in:', error)); 
