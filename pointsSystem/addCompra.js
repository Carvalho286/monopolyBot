const { SlashCommandBuilder } = require('discord.js');
const { addPoints } = require('./pointsManager'); // Certifique-se de que 'addPoints' esteja correto

const purchases = {
    "sticker": 1,
    "carry": 5,
    "bar": 10,
    "dice": 20
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcompra')
        .setDescription('Add points to a user based on a purchase.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user who made the purchase')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('purchase')
                .setDescription('Type of purchase')
                .setRequired(true)
                .addChoices(
                    { name: 'Sticker', value: 'sticker' },
                    { name: 'Carry', value: 'carry' },
                    { name: 'Bar', value: 'bar' },
                    { name: 'Dice', value: 'dice' },
                )),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const purchaseType = interaction.options.getString('purchase'); // Obter o tipo de compra

        // Debug: Verificar o que está a ser recebido
        console.log(`User: ${user.username} | Purchase: ${purchaseType}`);

        // Verificar se a compra é válida
        if (!purchaseType || !purchases[purchaseType]) {
            console.log("Invalid purchase type, no points to assign.");
            return interaction.reply({ content: "Invalid purchase type, no points to assign." });
        }

        // Obter a quantidade de pontos para a compra
        const points = purchases[purchaseType];

        // Adicionar os pontos ao utilizador
        const newTotal = addPoints(user.id, points);

        // Debug: Verificar se os pontos foram atualizados corretamente
        console.log(`${user.username} has received ${points} points. New total: ${newTotal}`);

        // Responder ao utilizador
        await interaction.reply({
            content: `${user.username} has received ${points} points for a purchase. New total: ${newTotal} points.`,
        });
    }
};
