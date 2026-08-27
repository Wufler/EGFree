import {
  type ChannelSelectMenuInteraction,
  MessageFlags,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../logger";
import {
  canManageSettings,
  sendInteractionResponse,
} from "../services/discordService";
import { fetchCurrentOffers } from "../services/offerService";
import type { BotCredentials } from "../state";
import {
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
  updateGuildSettings,
} from "../state";
import { buildConfirmationPayload } from "../ui/confirmationPrompt";
import { getSettingsPayload } from "../ui/settingsPanel";

export async function handleSelectMenuInteraction(
  interaction:
    | StringSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction,
  credentials: BotCredentials,
): Promise<void> {
  if (!canManageSettings(interaction)) {
    await interaction.reply({
      content:
        "**Access Denied**: You need **Administrator** or **Manage Server** permissions (or the configured Review Role) to modify bot settings or select offers.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const token = credentials.discordToken;

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("select_post_games")
  ) {
    const parts = interaction.customId.split(":");
    const includeUpcoming = parts[1] === "1";
    const guildId = parts[2] || interaction.guildId || null;
    const s = getGuildSettings(guildId);
    const includeAddOns =
      parts[3] !== undefined ? parts[3] === "1" : s.includeAddOns;

    const selectedIndices = interaction.values
      .map((v) => parseInt(v, 10))
      .filter((n) => !Number.isNaN(n));

    const prevOfferIds = getGuildPostedOfferIds(guildId);
    const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

    const offers = await fetchCurrentOffers(prevOfferIds, {
      includeUpcoming,
      previousUpcomingOfferIds: prevUpcomingIds,
      includeAddOns,
    });

    const payloadData = buildConfirmationPayload(offers, {
      includeUpcoming,
      guildId,
      includeAddOns,
      selectedIndices,
    });

    if (payloadData.isV2 && payloadData.v2Payload) {
      await interaction.deferUpdate();
      const url = `https://discord.com/api/v10/webhooks/${credentials.clientId}/${interaction.token}/messages/@original`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadData.v2Payload),
      });
      if (!res.ok) {
        logger.error(`Failed to update confirmation prompt: ${res.statusText}`);
      }
    } else if (payloadData.classicPayload) {
      await interaction.update({
        content: payloadData.classicPayload.content || "",
        embeds: payloadData.classicPayload.embeds,
        components: payloadData.classicPayload.components,
      });
    }
    return;
  }

  if (interaction.isChannelSelectMenu()) {
    const channelId = interaction.values[0];
    if (interaction.customId === "select_announcement_channel") {
      updateGuildSettings(interaction.guildId, {
        announcementChannelId: channelId,
      });
    } else if (interaction.customId === "select_mobile_channel") {
      updateGuildSettings(interaction.guildId, {
        mobileAnnouncementChannelId: channelId,
      });
    } else if (interaction.customId === "select_review_channel") {
      updateGuildSettings(interaction.guildId, { reviewChannelId: channelId });
    }

    await sendInteractionResponse(
      token,
      interaction,
      getSettingsPayload("channels", interaction.guildId),
      true,
    );
  }

  if (interaction.isRoleSelectMenu()) {
    const roleId = interaction.values[0];
    if (interaction.customId === "select_review_role") {
      updateGuildSettings(interaction.guildId, { reviewMentionRoleId: roleId });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("channels", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "select_mention_role") {
      updateGuildSettings(interaction.guildId, { mentionRoleId: roleId });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("format", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "select_mobile_role") {
      updateGuildSettings(interaction.guildId, { mobileMentionRoleId: roleId });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("format", interaction.guildId),
        true,
      );
    }
  }
}
