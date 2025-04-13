const Discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { addPoints } = require('./pointsManager');
const colors = require('../colors.json');

const purchases = {
    "sticker": 1,
    "carry": 3,
    "bar": 6,
    "dice": 40
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
        const purchaseType = interaction.options.getString('purchase');

        console.log(`User: ${user.username} | Purchase: ${purchaseType}`);

        if (!purchaseType || !purchases[purchaseType]) {
            console.log("Invalid purchase type, no points to assign.");
            return interaction.reply({ content: "Invalid purchase type, no points to assign." });
        }

        const points = purchases[purchaseType];

        const newTotal = addPoints(user.id, points);

        const embed = new Discord.EmbedBuilder()
            .setColor(colors.yellow)
            .setTitle('Points Awarded!')
            .setDescription(`${user.username} has received ${points} points for the purchase of ${purchaseType}.`)
            .addFields({ name: 'New Total Points:', value: `${newTotal} points`, inline: true })
            .setThumbnail(user.displayAvatarURL({ dynamic: true })) 
            .setFooter({ text: `Lucky Roll - done by ${interaction.user.username}`, iconURL: 'https://raw.githubusercontent.com/Carvalho286/monopolyBot/refs/heads/main/logo.png' })
            .setTimestamp(); 

        await interaction.reply({
            embeds: [embed]
        });
    }
};
