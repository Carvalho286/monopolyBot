const { REST, Routes } = require('discord.js');
const fs = require('fs');

let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Erro ao carregar config.json:', error.message);
    process.exit(1);
}

const BotID = config.botId;
const ServerID = config.serverId;
const botToken = config.token;

const rest = new REST().setToken(botToken);

const slashRegister = async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(BotID, ServerID), {
            body: [
                {
                    name: "ping",
                    description: "Just a simple ping command, no less."
                },
                {
                    name: "developer",
                    description: "My developer",
                },
                {
                    name: "verify",
                    description: "Verify yourself as a member.",
                },
                {
                    name: "client",
                    description: "Turn a verified user into a Client.",
                    options: [
                        {
                            name: "user",
                            type: 6, // USER type
                            description: "The person who is becoming a client",
                            required: true
                        }
                    ]
                },
            ]
        });
    } catch (err) {
        console.log(err);
    }
}

slashRegister();