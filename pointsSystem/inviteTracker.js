const { Events } = require('discord.js');
const { addPoints } = require('./pointsManager');

const invitesCache = new Map();

async function fetchInvites(guild) {
    try {
        const invites = await guild.invites.fetch();
        invitesCache.set(guild.id, new Map(invites.map(invite => [invite.code, invite.uses])));
    } catch (err) {
        console.error(`Failed to fetch invites for ${guild.name}:`, err.message);
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        client.guilds.cache.forEach(guild => fetchInvites(guild));

        client.on(Events.InviteCreate, invite => {
            fetchInvites(invite.guild); 
        });

        client.on(Events.GuildMemberAdd, async member => {
            const cachedInvites = invitesCache.get(member.guild.id);
            const newInvites = await member.guild.invites.fetch();

            const inviteUsed = newInvites.find(inv => {
                const previousUses = cachedInvites?.get(inv.code) || 0;
                return inv.uses > previousUses;
            });

            if (inviteUsed && inviteUsed.inviter) {
                const inviter = inviteUsed.inviter;
                const newTotal = addPoints(inviter.id, 2);
                
            }

            fetchInvites(member.guild);
        });
    }
};
