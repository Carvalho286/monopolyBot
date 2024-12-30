const fs = require('fs');

let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Erro ao carregar config.json:', error.message);
    process.exit(1);
}

module.exports = {
    data: {
        name: 'verify',
        description: 'Send a verification code and assign a role when verified.',
    },

    async execute(interaction) {
        try {
            const code = generateVerificationCode();
            
            const user = interaction.user;
            await user.send(`Please reply with \`!verify ${code}\` to verify yourself.`);

            await interaction.reply({
                content: 'A verification code has been sent to your DMs. Please check your DMs.',
                ephemeral: true
            });

            const filter = (message) => message.author.id === user.id && message.content.startsWith('!verify');
            const collected = await user.dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });

            const userReply = collected.first().content.trim();

            if (userReply === `!verify ${code}`) {
                const role = interaction.guild.roles.cache.find(r => r.id === config.verifiedId);
                const removeRole = interaction.guild.roles.cache.find(r => r.id === config.unverifiedId)
                if (!role) {
                    await interaction.followUp('The role does not exist.');
                    return;
                }

                if (!interaction.guild.members.me.permissions.has('MANAGE_ROLES')) {
                    await interaction.followUp('I do not have permission to assign roles.');
                    return;
                }

                await interaction.guild.members.cache.get(user.id).roles.add(role);
                await interaction.guild.members.cache.get(user.id).roles.remove(removeRole);
                await user.send(`${user.tag} you have been verified.`);
            } else {
                await user.send('The verification code you entered is incorrect. Please send /verify on group again');
            }

        } catch (error) {
            console.error('Error during verification process:', error);
            await interaction.followUp('There was an error during the verification process.');
        }
    },
};

function generateVerificationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}
