import { MessageFlags, type ModalSubmitInteraction } from "discord.js";
import { normalizeEpicCheckoutLink } from "@/lib/builder/shared";
import {
  canManageSettings,
  sendInteractionResponse,
} from "../services/discordService";
import { fetchCurrentOffers } from "../services/offerService";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials } from "../state";
import {
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
  setPendingCheckoutLink,
  updateGuildSettings,
} from "../state";
import { buildConfirmationPayload } from "../ui/confirmationPrompt";
import { getSettingsPayload } from "../ui/settingsPanel";

export async function handleModalSubmitInteraction(
  interaction: ModalSubmitInteraction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  if (!canManageSettings(interaction)) {
    await interaction.reply({
      content:
        "**Access Denied**: You need **Administrator** or **Manage Server** permissions (or the configured Review Role) to modify bot settings or edit offers.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const token = credentials.discordToken;

  if (interaction.customId.startsWith("confirm_modal_edit_checkout")) {
    const parts = interaction.customId.split(":");
    const includeUpcoming = parts[1] === "1";
    const guildId = parts[2] || interaction.guildId || null;
    const s = getGuildSettings(guildId);
    const includeAddOns =
      parts[3] !== undefined ? parts[3] === "1" : s.includeAddOns;
    const selParam = parts[4] || "";

    const rawLink = interaction.fields
      .getTextInputValue("input_checkout_url")
      .trim();
    const checkoutLink = rawLink ? normalizeEpicCheckoutLink(rawLink) : "";

    setPendingCheckoutLink(guildId, checkoutLink);

    const selectedIndices = selParam
      ? selParam
          .split(",")
          .map((v) => parseInt(v.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      : undefined;

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
      checkoutLink,
    });

    await interaction.deferUpdate();

    if (payloadData.isV2 && payloadData.v2Payload) {
      const url = `https://discord.com/api/v10/webhooks/${credentials.clientId}/${interaction.token}/messages/@original`;
      await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadData.v2Payload),
      });
    } else if (payloadData.classicPayload) {
      await interaction.editReply({
        content: payloadData.classicPayload.content || "",
        embeds: payloadData.classicPayload.embeds,
        components: payloadData.classicPayload.components,
      });
    }
    return;
  }

  if (interaction.customId.startsWith("post_modal_edit_checkout")) {
    const parts = interaction.customId.split(":");
    const guildId = parts[1] || interaction.guildId || null;

    const rawLink = interaction.fields
      .getTextInputValue("input_post_checkout_url")
      .trim();
    const checkoutLink = rawLink ? normalizeEpicCheckoutLink(rawLink) : "";

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const prevOfferIds = getGuildPostedOfferIds(guildId);
    const s = getGuildSettings(guildId);

    const offers = await fetchCurrentOffers(prevOfferIds, {
      includeUpcoming: false,
      includeAddOns: s.includeAddOns,
    });

    const editResult = await scheduler.editBroadcastedOffers(
      offers,
      checkoutLink,
      guildId,
    );

    if (editResult.success) {
      await interaction.editReply(
        `✅ Successfully updated **${editResult.updatedCount}** announcement message(s)${checkoutLink ? ` with checkout link: \`${checkoutLink}\`` : " to remove custom checkout link"}.`,
      );
    } else {
      await interaction.editReply(
        `❌ Failed to update announcement message(s): ${editResult.error}`,
      );
    }
    return;
  }

  if (interaction.customId === "settings_modal_color") {
    const colorRaw = interaction.fields.getTextInputValue("input_color").trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorRaw)) {
      updateGuildSettings(interaction.guildId, { embedColor: colorRaw });
    }
    await sendInteractionResponse(
      token,
      interaction,
      getSettingsPayload("format", interaction.guildId),
      true,
    );
  }
}
