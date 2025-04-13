const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resetAllPoints } = require('./pointsManager');
const colors = require('../colors.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetpoints')
        .setDescription('⚠️ Reset all users\' points (admin only)'),

    async execute(interaction) {
        resetAllPoints();

        const embed = new EmbedBuilder()
            .setTitle('🔁 Points Reset')
            .setDescription('All users\' points have been reset to **0**.')
            .setColor(colors.red || '#ff0000')
            .setFooter({ text: 'Lucky Roll', iconURL: 'https://raw.githubusercontent.com/Carvalho286/monopolyBot/refs/heads/main/logo.png' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
