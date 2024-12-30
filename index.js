const Discord = require('discord.js');
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

let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Erro ao carregar config.json:', error.message);
    process.exit(1);
}

const allowedUsers = [config.idPiloto, config.idKoback];

client.on('ready', async () => {

    console.log(`----------------------------------------------`);
    console.log(`${client.user.username} está online!`);
    console.log(`----------------------------------------------`);
  
});

client.on('guildMemberAdd', async (member) => {
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
                await message.delete();
            } catch (error) {
                console.error(`Erro ao apagar mensagem: ${error.message}`);
            }

            if (message.channel.permissionsFor(client.user).has("SendMessages")) {
                await message.channel.send(`${message.author}, only monopoly friend link allowed in this chat.`);
            }
        }
    }
});


client.on("interactionCreate", async (interaction) => {
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

client.login(config.token);