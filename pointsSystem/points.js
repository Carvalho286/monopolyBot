const Discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { getPoints, getCurrentPositionInLeaderboard } = require('./pointsManager'); 
const colors = require('../colors.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription('Check the points of a user.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to check points for')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const points = getPoints(user.id);
        const positionData = getCurrentPositionInLeaderboard(user.id);
        
        if (!positionData) {
            return interaction.reply({ content: `No points data found for ${user.username}.` });
        }

        const { position, totalUsers } = positionData;

        const embed = new Discord.EmbedBuilder()
            .setColor(colors.yellow)
            .setTitle(`📊 **Points Information** 📊`)
            .setDescription(`Here are the details for **${user.username}**`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '📈 Points', value: `${points} points`, inline: true },
                { name: '🏆 Position', value: `**${position}**/${totalUsers}`, inline: true },
                //{ name: '👤 User', value: `${user.username}`, inline: false },
            )
            .setFooter({ text: 'Lucky Roll', iconURL: 'https://raw.githubusercontent.com/Carvalho286/monopolyBot/refs/heads/main/logo.png' })
            .setTimestamp()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
        

        if (points === null) {
            await interaction.reply({ content: `No points data found for ${user.username}.` });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
