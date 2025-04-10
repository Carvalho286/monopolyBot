const { SlashCommandBuilder } = require('discord.js');
const { removePoints } = require('./pointsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removepoints')
        .setDescription('Remove points from a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove points from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('The number of points to remove')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const quantity = interaction.options.getInteger('quantity');

        if (quantity <= 0) {
            return interaction.reply({ content: 'Please provide a positive number of points to remove.', ephemeral: true });
        }

        const newPoints = removePoints(user.id, quantity);

        await interaction.reply({
            content: `${quantity} points have been removed from **${user.username}**. They now have **${newPoints}** points.`,
            ephemeral: true
        });
    }
};
