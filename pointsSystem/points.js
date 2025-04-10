const { SlashCommandBuilder } = require('discord.js');
const { getPoints } = require('./pointsManager'); 

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

        if (points === null) {
            await interaction.reply({ content: `No points data found for ${user.username}.` });
        } else {
            await interaction.reply({ content: `${user.username} has ${points} points.` });
        }
    }
};
