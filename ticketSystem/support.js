const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  MessageFlags
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
  name: "support",
  description: "Send a support ticket creation embed",

  async execute(interaction) {
    const channelId = config.supportChannelId;
    const categoryId = config.supportCategoryId;
    const allowedUserIds = config.allowedTicketUsers;
    const transcriptChannelId = config.transcriptChannelId;

    // Create the ticket creation embed
    const ticketEmbed = new EmbedBuilder()
      .setTitle("⚒️ Need Help?")
      .setDescription(
        "**Click the button below to create a ticket, and our team will assist you shortly.**"
      )
      .setColor(colors.yellow);

    const ticketButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("createTicket")
        .setLabel("⚙️ Create Ticket")
        .setStyle(ButtonStyle.Success)
    );

    const ticketChannel = await interaction.guild.channels.fetch(channelId);

    if (!ticketChannel) {
      console.error("The specified channel for tickets was not found.");
      return;
    }

    await ticketChannel.send({
      embeds: [ticketEmbed],
      components: [ticketButton],
    });

    interaction.reply({
      content: "Support ticket creation embed sent successfully.",
      flags: MessageFlags.Ephemeral 
    });

    const collector = ticketChannel.createMessageComponentCollector({
      filter: (i) => i.customId === "createTicket",
    });

    collector.on("collect", async (buttonInteraction) => {
      const user = buttonInteraction.user;
      const ticketName = `support-${user.username}`;

      const existingChannel = interaction.guild.channels.cache.find(
        (channel) => channel.name === ticketName
      );

      if (existingChannel) {
        await buttonInteraction.reply({
          content: "You already have an open ticket!",
          flags: MessageFlags.Ephemeral 
        });
        return;
      }

      const ticketChannel = await interaction.guild.channels.create({
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
            id,
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
        .setTitle("⚒️ Support Ticket")
        .setDescription(
          "Our team will be with you shortly. Please be patient!"
        );

      const insideTicketButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("closeTicket")
          .setLabel("🔒 Close Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        embeds: [insideTicketEmbed],
        components: [insideTicketButton],
      });

      await buttonInteraction.reply({
        content: `Your support ticket has been created: ${ticketChannel}`,
        flags: MessageFlags.Ephemeral 
      });

      const ticketCollector = ticketChannel.createMessageComponentCollector({
        filter: (i) => i.customId === "closeTicket",
      });

      ticketCollector.on("collect", async (closeInteraction) => {
        if (closeInteraction.customId === "closeTicket") {
          const transcriptChannel = await closeInteraction.guild.channels.fetch(
            transcriptChannelId
          );

          if (!transcriptChannel) {
            console.error("Transcript channel not found.");
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle("🔒 Ticket Closed")
            .setColor(colors.red)
            .addFields(
              { name: "Ticket Name", value: ticketChannel.name, inline: true },
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
            content:
              "The ticket has been closed and a transcript has been sent.",
              flags: MessageFlags.Ephemeral 
          });

          await ticketChannel.delete();
        }
      });
    });
  },
};
