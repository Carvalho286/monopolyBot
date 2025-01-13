const Discord = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,           
        Discord.GatewayIntentBits.GuildMessages,  
        Discord.GatewayIntentBits.DirectMessages,   
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers 
    ]
});

const colors = require("./colors.json");
const verificationCommand = require('./verification/verification.js');
const supportCommand = require('./ticketSystem/support.js');
const stickerCommand = require('./ticketSystem/sticker.js');
const eventCommand = require('./ticketSystem/event.js');
const barCommand = require('./ticketSystem/bar.js');
const diceCommand = require('./ticketSystem/dice.js');
let usersJoined = 0;
let usersLeft = 0;

let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Erro ao carregar config.json:', error.message);
    process.exit(1);
}

const eventFiles = fs.readdirSync('./ticketSystem').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./ticketSystem/${file}`);
    if (event.data && event.execute) {
        client.commands.set(event.name, event);
    }
}

const allowedUsers = [config.idKoback, config.idPiloto];

client.on('ready', async () => {
    console.log(`----------------------------------------------`);
    console.log(`${client.user.username} está online!`);
    console.log(`----------------------------------------------`);

    const kobackUser = await client.users.fetch(config.idKoback);
    const pilotoUser = await client.users.fetch(config.idPiloto);
    if (!kobackUser) {
        console.error('User with idKoback not found');
        return;
    }
    if (!pilotoUser) {
        console.error('User with idPiloto not found');
        return;
    }

    const reportMessage = "O bot acabou de ficar online, a cada 24h vais receber um report com quantos membros entraram e sairam do server."

    await kobackUser.send(reportMessage);
    await pilotoUser.send(reportMessage);
});

client.on('guildMemberAdd', async (member) => {
    usersJoined++;
    try {
        const roleId = config.unverifiedId;
        const tagsRoleId = config.tagsRole;
        const verificationRoleId = config.verificationRole
        const notificationsRoleId = config.notificationRole;
        const role = member.guild.roles.cache.get(roleId);
        const tagsRole = member.guild.roles.cache.get(tagsRoleId);
        const verificationRole = member.guild.roles.cache.get(verificationRoleId);
        const notificationsRole = member.guild.roles.cache.get(notificationsRoleId);

        if (!role) {
            console.error('Role not found.');
            return;
        }

        await member.roles.add(role);
        await member.roles.add(verificationRole);
        await member.roles.add(tagsRole);
        await member.roles.add(notificationsRole);
    } catch (error) {
        console.error('Error assigning role to new member:', error);
    }
});

client.on('guildMemberRemove', (member) => {
    usersLeft++;
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const targetChannelId = config.linkChatId;

    if (message.channel.id === targetChannelId) {
        const urlRegex = /\bhttps?:\/\/(www\.)?monopolygo\.com\b/;
        const links = message.content.match(urlRegex);
    
        if (!links) {
            if (!message.channel.permissionsFor(client.user).has("ManageMessages")) {
                console.error("O bot não tem permissão para apagar mensagens.");
                return;
            }
    
            try {
                // Fetch the log channel
                const logChannel = await client.channels.fetch(config.logChatId);
                if (!logChannel) {
                    console.error('Log channel not found.');
                    return;
                }
    
                // Log the deleted message details
                await logChannel.send(`Message deleted from ${message.author.tag} (ID: ${message.author.id}):\nContent: "${message.content}"`);
    
                // Delete the message
                await message.delete();
            } catch (error) {
                console.error(`Erro ao apagar mensagem: ${error.message}`);
            }
    
            if (message.channel.permissionsFor(client.user).has("SendMessages")) {
                await message.channel.send(`${message.author}, only monopoly friend link allowed in this chat.`);
            }
        }
    }
    

    if (message.content === '!verifytext') {
        // Create the embed
        await message.channel.send("Welcome to the Monopoly Services Lucky Roll! Press the buttons below to assign yourself roles for updates.");
        const embed = new EmbedBuilder()
            .setTitle('Self-Role Assignment')
            .setDescription('Press the corresponding button to assign yourself roles for updates.')
            .setColor(15466240)
            .addFields(
                {
                    name: '🎮 Game Updates',
                    value: 'Press the 🎮 button to receive notifications about game updates.'
                },
                {
                    name: '🔧 Service Updates',
                    value: 'Press the 🔧 button to receive notifications about service updates.'
                }
            )
            .setFooter({
                text: 'Lucky Roll Services'
            })
            .setThumbnail('https://i.imgur.com/shRl0WX.png');

        // Create the button
        const button1 = new ButtonBuilder()
            .setCustomId('gameUpdate') // Identifier for the button interaction
            .setLabel('🎮') // Text displayed on the button
            .setStyle(ButtonStyle.Success); // Button style (e.g., Primary, Success, Danger)

        const button2 = new ButtonBuilder()
            .setCustomId('serviceUpdate') // Identifier for the button interaction
            .setLabel('🔧') // Text displayed on the button
            .setStyle(ButtonStyle.Danger); // Button style (e.g., Primary, Success, Danger)

        // Create an action row to hold the button
        const actionRow = new ActionRowBuilder().addComponents(button1, button2);

        // Send the embed with the button
        await message.channel.send({ embeds: [embed], components: [actionRow] });
    }
});


client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'verify_button') {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member) {
                return interaction.reply({ content: 'Member not found!', ephemeral: true });
            }

            const unverifiedRoleId = config.unverifiedId; 

            if (!member.roles.cache.has(unverifiedRoleId)) {
                return interaction.reply({
                    content: 'You are already verified!',
                    ephemeral: true
                });
            }
            try {
                await verificationCommand.execute(interaction); 
            } catch (error) {
                await interaction.reply({ content: 'Error!', ephemeral: true });
            }
        }
        if (interaction.customId == 'gameUpdate') {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member) {
                return interaction.reply({ content: 'Member not found!', ephemeral: true });
            }
            const roleId = config.gameUpdateRole;
            const role = member.guild.roles.cache.get(roleId);
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                interaction.reply({ content: 'Game updates role removed!', ephemeral: true });
            } else {
                await member.roles.add(role);
                interaction.reply({ content: 'Game updates role added!', ephemeral: true });
            }
        }
        if (interaction.customId =='serviceUpdate') {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member) {
                return interaction.reply({ content: 'Member not found!', ephemeral: true });
            }
            const roleId = config.serviceUpdateRole;
            const role = member.guild.roles.cache.get(roleId);
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                interaction.reply({ content: 'Service updates role removed!', ephemeral: true });
            } else {
                await member.roles.add(role);
                interaction.reply({ content: 'Service updates role added!', ephemeral: true });
            }
        }
    }
    if (interaction.isCommand()) {

        if (interaction.commandName === "ping") {
            interaction.reply("pong");
        }
        if (interaction.commandName === "developer") {
            const url = 'https://cdn.discordapp.com/avatars/280990969460031488/a_ef71a6f5cbba50d6655dcf4ff40d03b0.gif';
            
            const embed = new Discord.EmbedBuilder()
                .setColor(colors.purple)
                .setTitle('About the developer')
                .setAuthor({ name: 'K0baCK', iconURL: url })
                .setDescription('Somethings about the developer')
                .setThumbnail(url)
                .addFields(
                    { name: '**Name:**', value: 'K0baCK' },
                    { name: '**Occupation:**', value: 'Web Developer / App Developer'},
                    { name: '**GitHub:**', value: 'https://github.com/Carvalho286', inline: true },
                    { name: '**Website:**', value: 'https://guthib.com', inline: true },
                    { name: '\u200B', value: '\u200B' }
                )
                .setTimestamp()
                .setFooter({ text: 'Lucky Roll Services' });

            await interaction.reply({ embeds: [embed] });
        }
        if (interaction.commandName === "verify") {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member) {
                return interaction.reply({ content: 'Member not found!', ephemeral: true });
            }

            const unverifiedRoleId = config.unverifiedId; 

            if (!member.roles.cache.has(unverifiedRoleId)) {
                return interaction.reply({
                    content: 'You are already verified!',
                    ephemeral: true
                });
            }
            try {
                await verificationCommand.execute(interaction); 
            } catch (error) {
                await interaction.reply({ content: 'Error!', ephemeral: true });
            }
        }
        if (interaction.commandName === "support") {
            try {
                await supportCommand.execute(interaction);
            } catch (error) {
                console.error('Error executing support command:', error);
                await interaction.reply({ content: 'There was an error while executing the command.', ephemeral: true });
            }
        }
        if (interaction.commandName === "sticker") {
            try {
                await stickerCommand.execute(interaction);
            } catch (error) {
                console.error('Error executing support command:', error);
                await interaction.reply({ content: 'There was an error while executing the command.', ephemeral: true });
            }
        }
        if (interaction.commandName === "event") {
            try {
                await eventCommand.execute(interaction);
            } catch (error) {
                console.error('Error executing support command:', error);
                await interaction.reply({ content: 'There was an error while executing the command.', ephemeral: true });
            }
        }
        if (interaction.commandName === "bar") {
            try {
                await barCommand.execute(interaction);
            } catch (error) {
                console.error('Error executing support command:', error);
                await interaction.reply({ content: 'There was an error while executing the command.', ephemeral: true });
            }
        }
        if (interaction.commandName === "dice") {
            try {
                await diceCommand.execute(interaction);
            } catch (error) {
                console.error('Error executing support command:', error);
                await interaction.reply({ content: 'There was an error while executing the command.', ephemeral: true });
            }
        }
        if (interaction.commandName === "client") {
            if (!allowedUsers.includes(interaction.user.id)) {
                return interaction.reply({
                    content: 'You do not have permission to do that lol.',
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser("user");
            if (!user) {
                return interaction.reply("User not found.");
            }

            const member = await interaction.guild.members.fetch(user.id);
            const role = interaction.guild.roles.cache.find(r => r.id === config.clientId);
            if (member) {
                await member.roles.add(role);
                interaction.reply(`${member.user.tag} has become a client`);
            } else {
                interaction.reply("Not found.");
            }
        }
    }
});

setInterval(async () => {
    try {
        const kobackUser = await client.users.fetch(config.idKoback);
        const pilotoUser = await client.users.fetch(config.idPiloto);
        if (!kobackUser) {
            console.error('User with idKoback not found');
            return;
        }
        if (!pilotoUser) {
            console.error('User with idPiloto not found');
            return;
        }

        const reportMessage = `
            **Daily Report:**
            - Users joined: ${usersJoined}
            - Users left: ${usersLeft}
        `;

        // Send the message to the user
        await kobackUser.send(reportMessage);
        await pilotoUser.send(reportMessage);

        // Reset counters for the next 24 hours
        usersJoined = 0;
        usersLeft = 0;
    } catch (error) {
        console.error('Error sending daily report:', error);
    }
}, 86400000);

client.login(config.token);