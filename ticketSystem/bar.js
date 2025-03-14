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
  console.error("Erro ao carregar config.json:", error.message);
  process.exit(1);
}

module.exports = {
  name: "bar",
  description: "Send a bar completion ticket creation embed",

  async execute(interaction) {
    const channelId = config.barChannelId;
    const categoryId = config.buyCategoryId;
    const allowedUserIds = config.allowedTicketUsers;
    const transcriptChannelId = config.transcriptChannelId;

    // Create the ticket creation embed
    const ticketEmbed = new EmbedBuilder()
      .setTitle("🛒 Want help to finish top and side bar?")
      .setDescription(
        "**Create a ticket and we will help you finish both top and side bar!**"
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
      return;
    }

    await ticketChannel.send({
      embeds: [ticketEmbed],
      components: [ticketButton],
    });

    await interaction.reply({
      content: "Ticket creation embed sent successfully.",
      flags: MessageFlags.Ephemeral 
    });

    const collector = ticketChannel.createMessageComponentCollector({
      filter: (i) => i.customId === "createTicket",
    });

    collector.on("collect", async (buttonInteraction) => {
      if (!buttonInteraction.isButton()) return;

      await buttonInteraction.deferReply({ flags: MessageFlags.Ephemeral  });

      const user = buttonInteraction.user;
      const ticketName = `bar-${user.username}`;

      const existingChannel = interaction.guild.channels.cache.find(
        (channel) => channel.name === ticketName
      );

      if (existingChannel) {
        await buttonInteraction.editReply({
          content: "You already have an open ticket!",
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
        .setTitle("🛒 MileStone & Tournament Ticket")
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

      await buttonInteraction.editReply({
        content: `Your ticket has been created: ${ticketChannel}`,
      });

      const ticketCollector = ticketChannel.createMessageComponentCollector({
        filter: (i) => i.customId === "closeTicket",
      });

      ticketCollector.on("collect", async (closeInteraction) => {
        if (!closeInteraction.isButton()) return;

        await closeInteraction.deferReply({ flags: MessageFlags.Ephemeral  });

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

        await closeInteraction.editReply({
          content:
            "The ticket has been closed and a transcript has been sent.",
        });

        await ticketChannel.delete();
      });
    });
  },
};
