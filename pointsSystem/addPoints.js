const { SlashCommandBuilder } = require('discord.js');
const { addPoints } = require('./pointsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add points to a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add points to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('The number of points to add')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const quantity = interaction.options.getInteger('quantity');

        if (quantity <= 0) {
            return interaction.reply({ content: 'Please provide a positive number of points to add.', ephemeral: true });
        }

        const newPoints = addPoints(user.id, quantity);

        await interaction.reply({
            content: `${quantity} points have been added to **${user.username}**. They now have **${newPoints}** points.`,
            ephemeral: true
        });
    }
};
