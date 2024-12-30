const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,           
        Discord.GatewayIntentBits.GuildMessages,   
        Discord.GatewayIntentBits.MessageContent 
    ]
});

const colors = require("./colors.json");

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
                console.log(`Mensagem apagada: ${message.content}`);
            } catch (error) {
                console.error(`Erro ao apagar mensagem: ${error.message}`);
            }

            if (message.channel.permissionsFor(client.user).has("SendMessages")) {
                await message.channel.send(`${message.author}, apenas links de "monopolygo.com" são permitidos neste canal.`);
            }
        }
    }
});


client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === "ping") {
            interaction.reply("pong");
        }
        if (interaction.commandName === "criador") {
            const url = 'https://cdn.discordapp.com/avatars/280990969460031488/a_ef71a6f5cbba50d6655dcf4ff40d03b0.gif';
            
            const embed = new Discord.EmbedBuilder()
                .setColor(colors.purple)
                .setTitle('Sobre o criador')
                .setAuthor({ name: 'K0baCK', iconURL: url })
                .setDescription('Aqui estão algumas informações sobre o criador.')
                .setThumbnail(url)
                .addFields(
                    { name: '**Nome:**', value: 'K0baCK' },
                    { name: '**Ocupações:**', value: 'Web Developer / App Developer'},
                    { name: '**GitHub:**', value: 'https://github.com/Carvalho286', inline: true },
                    { name: '**Website:**', value: 'https://guthib.com', inline: true },
                    { name: '\u200B', value: '\u200B' }
                )
                .setTimestamp()
                .setFooter({ text: 'Lucky Roll Services' });

            await interaction.reply({ embeds: [embed] });
        }
        if (interaction.commandName === "wassup") {
            interaction.reply("Sigam todos o rei Wassup https://www.twitch.tv/the_hagith");
        }
    }
});

client.login(config.token);