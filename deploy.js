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
                            type: 6, 
                            description: "The person who is becoming a client",
                            required: true
                        }
                    ]
                },
                {
                    name: 'support',
                    description: 'Send a ticket creation embed.',
                },
                {
                    name: 'sticker',
                    description: 'Send a sticker ticket creation embed.',
                },
                {
                    name: 'event',
                    description: 'Send a buy event win ticket creation embed.',
                },
                {
                    name: 'bar',
                    description: 'Send a bar completion ticket creation embed.',
                },
                {
                    name: 'dice',
                    description: 'Send a dice boosting ticket creation embed.',
                },
                {
                    name: 'addcompra',
                    description: 'Give points to user for a purchase.',
                    options: [
                        {
                            name: 'user',
                            type: 6, // USER
                            description: 'User',
                            required: true
                        },
                        {
                            name: 'purchase',
                            type: 3, // STRING
                            description: 'Type of product',
                            required: true,
                            choices: [
                                { name: 'Sticker', value: 'sticker' },
                                { name: 'Carry', value: 'carry' },
                                { name: 'Bar', value: 'bar' },
                                { name: 'Dice', value: 'dice' },
                            ]
                        }
                    ]
                },
                {
                    name: 'points',
                    description: 'View the points of a user.',
                    options: [
                        {
                            name: 'user',
                            type: 6, // USER
                            description: 'User to check points for',
                            required: false
                        }
                    ]
                },
                {
                    name: 'leaderboard',
                    description: 'View the top users based on points.'
                },
                {
                    name: 'addpoints',
                    description: 'Add points to a user.',
                    options: [
                        {
                            name: 'user',
                            type: 6,
                            description: 'User to add points to',
                            required: true
                        },
                        {
                            name: 'quantity',
                            type: 4,
                            description: 'Number of points to add',
                            required: true
                        }
                    ]
                },
                {
                    name: 'removepoints',
                    description: 'Remove points from a user.',
                    options: [
                        {
                            name: 'user',
                            type: 6, 
                            description: 'User to remove points from',
                            required: true
                        },
                        {
                            name: 'quantity',
                            type: 4, 
                            description: 'Number of points to remove',
                            required: true
                        }
                    ]
                },
                {
                    name: 'resetpoints',
                    description: 'Reset all users\' points.',
                }
            ]
        });
    } catch (err) {
        console.log(err);
    }
}

slashRegister();