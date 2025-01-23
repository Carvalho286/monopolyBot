const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const fs = require("fs");
const colors = require("../colors.json");

let config;
try {
  config = JSON.parse(fs.readFileSync("config.json", "utf8"));
} catch (error) {
  console.error("Error loading config.json:", error.message);
  process.exit(1);
}

module.exports = {
  name: "sticker",
  description: "Send a buy sticker ticket creation embed",

  async execute(interaction) {
    try {
      const channelId = config.stickerChannelId;
      const categoryId = config.buyCategoryId;
      const allowedUserIds = config.allowedTicketUsers;
      const transcriptChannelId = config.transcriptChannelId;

      // Create the ticket creation embed
      const ticketEmbed = new EmbedBuilder()
        .setTitle("🛒 Want to buy a sticker?")
        .setDescription(
          "**Feel free to ask for any sticker you'd like! Just let us know what you're looking for, and we'll take care of the rest!**"
        )
        .setColor(colors.yellow);

      const ticketButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("createTicket")
          .setLabel("🛒 Create Ticket")
          .setStyle(ButtonStyle.Success)
      );

      const ticketChannel = await interaction.guild.channels.fetch(channelId);

      if (!ticketChannel) {
        console.error("The specified channel for tickets was not found.");
        await interaction.reply({
          content: "Ticket channel not found. Please check the configuration.",
          ephemeral: true,
        });
        return;
      }

      await ticketChannel.send({
        embeds: [ticketEmbed],
        components: [ticketButton],
      });

      await interaction.reply({
        content: "Ticket creation embed sent successfully.",
        ephemeral: true,
      });

      const collector = ticketChannel.createMessageComponentCollector({
        filter: (i) => i.customId === "createTicket",
      });

      collector.on("collect", async (buttonInteraction) => {
        try {
          const user = buttonInteraction.user;
          const ticketName = `sticker-${user.username}`;

          const existingChannel = interaction.guild.channels.cache.find(
            (channel) => channel.name === ticketName
          );

          if (existingChannel) {
            await buttonInteraction.reply({
              content: "You already have an open ticket!",
              ephemeral: true,
            });
            return;
          }

          const newTicketChannel = await interaction.guild.channels.create({
            name: ticketName,
            parent: categoryId,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              },
              ...allowedUserIds.map((id) => ({
                id: id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              })),
            ],
          });

          const ticketCreatorId = user.id;

          const insideTicketEmbed = new EmbedBuilder()
            .setColor(colors.yellow)
            .setTitle("🛒 Stickers Ticket")
            .setDescription(
              "Our team will be with you shortly. Please be patient!"
            );

          const insideTicketButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("closeTicket")
              .setLabel("🔒 Close Ticket")
              .setStyle(ButtonStyle.Danger)
          );

          await newTicketChannel.send({
            embeds: [insideTicketEmbed],
            components: [insideTicketButton],
          });

          await buttonInteraction.reply({
            content: `Your ticket has been created: ${newTicketChannel}`,
            ephemeral: true,
          });

          const ticketCollector = newTicketChannel.createMessageComponentCollector({
            filter: (i) => i.customId === "closeTicket",
          });

          ticketCollector.on("collect", async (closeInteraction) => {
            try {
              const transcriptChannel = await closeInteraction.guild.channels.fetch(
                transcriptChannelId
              );

              if (!transcriptChannel) {
                console.error("Transcript channel not found.");
                await closeInteraction.reply({
                  content:
                    "Transcript channel not found. Contact an admin for assistance.",
                  ephemeral: true,
                });
                return;
              }

              const embed = new EmbedBuilder()
                .setTitle("🔒 Ticket Closed")
                .setColor(colors.red)
                .addFields(
                  { name: "Ticket Name", value: newTicketChannel.name, inline: true },
                  {
                    name: "Created By",
                    value: `<@${ticketCreatorId}>`,
                    inline: true,
                  },
                  {
                    name: "Closed By",
                    value: `<@${closeInteraction.user.id}>`,
                    inline: true,
                  }
                )
                .setTimestamp();

              await transcriptChannel.send({ embeds: [embed] });

              await closeInteraction.reply({
                content: "The ticket has been closed and a transcript has been sent.",
                ephemeral: true,
              });

              await newTicketChannel.delete();
            } catch (error) {
              console.error("Error closing ticket:", error.message);
            }
          });
        } catch (error) {
          console.error("Error creating ticket:", error.message);
        }
      });
    } catch (error) {
      console.error("Error executing sticker command:", error.message);
      if (interaction.deferred || interaction.replied) return;
      await interaction.reply({
        content: "An error occurred while executing this command.",
        ephemeral: true,
      });
    }
  },
};
