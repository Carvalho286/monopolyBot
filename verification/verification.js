const { MessageFlags } = require('discord.js');
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

            let dm;
            try {
                dm = await user.createDM();
                await dm.send(`Please reply with \`!verify ${code}\` to verify yourself.`);
            } catch (error) {
                await interaction.reply({
                    content: "I couldn't send you a DM. Please enable DMs and try again.",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await interaction.reply({
                content: 'A verification code has been sent to your DMs. Please check your DMs.',
                flags: MessageFlags.Ephemeral
            });

            const filter = (message) => message.author.id === user.id && message.content.startsWith('!verify');
            const collected = await dm.awaitMessages({ filter, max: 1, time: 60000 });

            const userReply = collected.first()?.content.trim();

            if (userReply === `!verify ${code}`) {
                const role = interaction.guild.roles.cache.get(config.verifiedId);
                const removeRole = interaction.guild.roles.cache.get(config.unverifiedId);

                if (!role) {
                    await interaction.followUp({ content: 'The role does not exist.', flags: MessageFlags.Ephemeral });
                    return;
                }

                if (!interaction.guild.members.me.permissions.has('MANAGE_ROLES')) {
                    await interaction.followUp({ content: 'I do not have permission to assign roles.', flags: MessageFlags.Ephemeral });
                    return;
                }

                const member = await interaction.guild.members.fetch(user.id);
                await member.roles.add(role);
                await member.roles.remove(removeRole);

                const logChannel = interaction.guild.channels.cache.get(config.logChatId);
                if (logChannel) {
                    await logChannel.send(`${user.tag} has been verified and assigned the verified role.`);
                }

                await dm.send(`You have been verified.`);
            } else {
                await dm.send('The verification code you entered is incorrect. Please send /verify in the group again.');
            }

        } catch (error) {
            console.error('Error during verification process:', error);
            const owner = await interaction.client.users.fetch(config.idKoback);
            await owner.send(`Error during verification process: ${error.message}`);
            await interaction.followUp({ content: 'There was an error during the verification process.', flags: MessageFlags.Ephemeral });
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
