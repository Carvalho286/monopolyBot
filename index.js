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
let usersJoined = 0;
let usersLeft = 0;

let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Erro ao carregar config.json:', error.message);
    process.exit(1);
}

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
        const role = member.guild.roles.cache.get(roleId);

        if (!role) {
            console.error('Role not found.');
            return;
        }

        await member.roles.add(role);
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
                const logChannel = await client.channels.fetch(config.logLinkChatId);
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
        const embed = new EmbedBuilder()
            .setTitle('🔒 Verification Required!')
            .setDescription('Welcome to the server! To gain full access, you need to complete the verification process. This helps us keep the community safe and organized.')
            .setColor(14745344)
            .addFields(
                {
                    name: 'Why Verify?',
                    value: '- Gain access to exclusive channels.\n- Interact with the community.\n- Participate in events and discussions.'
                },
                {
                    name: 'How to Verify?',
                    value: 'Simply use the `/verify` command in this channel or click the verification button below.'
                },
                {
                    name: 'Need Help?',
                    value: 'If you\'re having trouble verifying, feel free to contact a moderator for assistance.'
                }
            )
            .setFooter({
                text: 'Thank you for joining us!',
                iconURL: 'https://cdn.discordapp.com/attachments/931866548249985036/1323351685845745766/logoDiscordBot.png'
            });

        // Create the button
        const button = new ButtonBuilder()
            .setCustomId('verify_button') // Identifier for the button interaction
            .setLabel('Verify') // Text displayed on the button
            .setStyle(ButtonStyle.Primary); // Button style (e.g., Primary, Success, Danger)

        // Create an action row to hold the button
        const actionRow = new ActionRowBuilder().addComponents(button);

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