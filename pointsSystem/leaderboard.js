const { SlashCommandBuilder } = require('discord.js');
const { getAllUsers } = require('./pointsManager');
const { EmbedBuilder } = require('discord.js');
const colors = require('../colors.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top users based on points.'),

    async execute(interaction) {
        const users = await getAllUsers(); 
        if (!users || users.length === 0) {
            return interaction.reply({ content: 'No users found with points data.' });
        }

        users.sort((a, b) => b.points - a.points);

        const topUsers = users.slice(0, 10);
        const embed = new EmbedBuilder()
            .setColor(colors.yellow)
            .setTitle('🏆 **Leaderboard**')
            .setDescription('Here are the top users based on points!')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/3150/3150313.png') 
            .setFooter({ text: `Lucky Roll - asked by ${interaction.user.username}`, iconURL: 'https://raw.githubusercontent.com/Carvalho286/monopolyBot/refs/heads/main/logo.png' })
            .setTimestamp()

            for (const user of topUsers.slice(0,5)) {
                try {
                    const discordUser = await interaction.client.users.fetch(user.userId);
                    
                    embed.addFields({
                        name: `${topUsers.indexOf(user) + 1}. ${discordUser.username}`,
                        value: `${user.points} points`,
                        inline: false,  
                    });
            
                } catch (error) {
                    console.error('Error fetching user:', error);
                    embed.addFields({
                        name: `${topUsers.indexOf(user) + 1}. User not found`,
                        value: `${user.points} points`,
                        inline: false,
                    });
                }
            }

        await interaction.reply({
            embeds: [embed]
        });
    }
};
