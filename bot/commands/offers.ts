import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import {
  COMPONENT_TYPES,
  IS_COMPONENTS_V2,
  normalizeEpicCheckoutLink,
} from "@/lib/builder/shared";
import { logger } from "../logger";
import { canManageSettings } from "../services/discordService";
import {
  fetchCurrentOffers,
  getCandidateGames,
} from "../services/offerService";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials } from "../state";
import {
  getGuildLastCheckoutLink,
  getGuildPostedMessages,
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
  recordGuildPostedOffers,
  recordGuildSeenUpcomingOffers,
  setPendingCheckoutLink,
} from "../state";
import { sendConfirmationPrompt } from "../ui/confirmationPrompt";

export async function handleOffersCommand(
  interaction: ChatInputCommandInteraction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  if (subcommand === "check") {
    await interaction.deferReply();
    try {
      const prevOfferIds = getGuildPostedOfferIds(guildId);
      const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

      const s = getGuildSettings(guildId);
      const offers = await fetchCurrentOffers(prevOfferIds, {
        includeUpcoming: true,
        previousUpcomingOfferIds: prevUpcomingIds,
        includeAddOns: s.includeAddOns,
        includeMobile: s.includeMobile !== false,
      });

      if (offers.upcomingOfferIds.length > 0) {
        recordGuildSeenUpcomingOffers(guildId, offers.upcomingOfferIds);
      }
      const count =
        offers.effectiveGames.currentGames.length +
        offers.activeMobileGames.length +
        offers.effectiveGames.nextGames.length;

      if (count === 0) {
        await interaction.editReply("No free offers currently detected.");
        return;
      }

      const titleList = offers.titles.join("\n");
      const channelDetails = [
        `Desktop: ${s.announcementChannelId ? `<#${s.announcementChannelId}>` : "*Not configured*"}`,
      ];
      if (s.mobileAnnouncementChannelId) {
        channelDetails.push(`Mobile: <#${s.mobileAnnouncementChannelId}>`);
      }

      if (s.useComponentsV2) {
        const token = credentials.discordToken;
        const url = `https://discord.com/api/v10/webhooks/${credentials.clientId}/${interaction.token}/messages/@original`;
        const v2Payload = {
          flags: IS_COMPONENTS_V2,
          components: [
            {
              type: COMPONENT_TYPES.CONTAINER,
              components: [
                {
                  type: COMPONENT_TYPES.TEXT_DISPLAY,
                  content: `# Current Offers (${count})\n${titleList}\n\n${channelDetails.join("\n")}`,
                },
              ],
            },
          ],
        };
        await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(v2Payload),
        });
      } else {
        const embedColorHex =
          Number.parseInt(s.embedColor.replace("#", ""), 16) || 0x5865f2;
        const checkEmbed = {
          color: embedColorHex,
          title: `Current Offers (${count})`,
          description: "Offers currently detected on Epic Games Store.",
          fields: [
            {
              name: "Detected Offers",
              value: titleList,
              inline: false,
            },
            {
              name: "Target Channels",
              value: channelDetails.join("\n"),
              inline: false,
            },
          ],
        };
        await interaction.editReply({ embeds: [checkEmbed] });
      }
    } catch (error) {
      logger.error("Error in /offers check:", error);
      await interaction.editReply(
        "Failed to fetch offers. Please check server logs.",
      );
    }
  } else if (subcommand === "post") {
    if (!canManageSettings(interaction)) {
      await interaction.reply({
        content:
          "Access Denied: You need Administrator or Manage Server permissions (or the configured Review Role) to post offers.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();
    try {
      const guildId = interaction.guildId;
      const force = interaction.options.getBoolean("force") || false;
      const includeUpcoming =
        interaction.options.getBoolean("upcoming") ??
        interaction.options.getBoolean("include_upcoming") ??
        false;
      const guildSettings = getGuildSettings(guildId);
      const includeAddOns =
        interaction.options.getBoolean("addons") ??
        interaction.options.getBoolean("include_addons") ??
        guildSettings.includeAddOns;
      const reqConfirm =
        interaction.options.getBoolean("confirm") ??
        interaction.options.getBoolean("require_confirmation") ??
        guildSettings.requireConfirmation;
      const specificGame = interaction.options.getString("game")?.trim();
      const rawCheckoutLink = interaction.options
        .getString("checkout_link")
        ?.trim();
      const checkoutLink = rawCheckoutLink
        ? normalizeEpicCheckoutLink(rawCheckoutLink)
        : "";

      if (checkoutLink) {
        setPendingCheckoutLink(guildId, checkoutLink);
      }

      const prevOfferIds = getGuildPostedOfferIds(guildId);
      const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

      const offers = await fetchCurrentOffers(prevOfferIds, {
        includeUpcoming,
        previousUpcomingOfferIds: prevUpcomingIds,
        includeAddOns,
        includeMobile: guildSettings.includeMobile !== false,
      });

      if (!offers.hasNewOffers && !force && !specificGame) {
        await interaction.editReply(
          "No new offers found. Use `/offers post force:True` to post anyway, or select a specific game.",
        );
        return;
      }

      const candidateGames = getCandidateGames(offers, {
        includeUpcoming,
        previousOfferIds: prevOfferIds,
        previousUpcomingOfferIds: prevUpcomingIds,
      });

      let selectedIndices: number[] | undefined;
      let selectedGameIds: string[] | undefined;

      if (specificGame) {
        const matched = candidateGames.find(
          (c) =>
            c.id === specificGame ||
            c.title.toLowerCase().includes(specificGame.toLowerCase()),
        );
        if (matched) {
          selectedIndices = [matched.index];
          selectedGameIds = [matched.id];
        } else {
          await interaction.editReply(
            `Could not find an offer matching \`${specificGame}\`.`,
          );
          return;
        }
      }

      if (reqConfirm) {
        await sendConfirmationPrompt(
          interaction.client,
          credentials.discordToken,
          credentials.clientId,
          interaction,
          offers,
          {
            includeUpcoming,
            guildId,
            includeAddOns,
            selectedIndices,
            checkoutLink: checkoutLink || undefined,
          },
        );
      } else {
        const result = await scheduler.broadcastOffers(offers, {
          includeUpcoming,
          guildId,
          includeAddOns,
          selectedGameIds,
          checkoutLink,
        });
        if (result.success) {
          const postedCurrentIds = (
            selectedGameIds || offers.currentOfferIds
          ).filter((id) => offers.currentOfferIds.includes(id));
          const postedUpcomingIds = (
            selectedGameIds || offers.upcomingOfferIds
          ).filter((id) => offers.upcomingOfferIds.includes(id));

          recordGuildPostedOffers(guildId, postedCurrentIds, postedUpcomingIds);
          await interaction.editReply(
            `Offers posted successfully to the announcement channel.${checkoutLink ? `\nCheckout link: \`${checkoutLink}\`` : ""}`,
          );
        } else {
          await interaction.editReply(`Failed to post offers: ${result.error}`);
        }
      }
    } catch (error) {
      logger.error("Error in /offers post:", error);
      await interaction.editReply(
        `Failed to process post request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else if (subcommand === "edit-link") {
    if (!canManageSettings(interaction)) {
      await interaction.reply({
        content:
          "Access Denied: You need Administrator or Manage Server permissions (or the configured Review Role) to edit checkout links.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();
    try {
      const rawLink = interaction.options.getString("link")?.trim();
      const clear = interaction.options.getBoolean("clear") || false;

      if (!rawLink && !clear) {
        const currentLink = getGuildLastCheckoutLink(guildId);
        const postedRefs = getGuildPostedMessages(guildId);
        await interaction.editReply(
          `ℹ️ **Current Broadcasted Checkout Link:** ${currentLink ? `\`${currentLink}\`` : "*None (default)*"}\n**Tracked announcement messages:** ${postedRefs.length}\n\nTo update the link on the announcement message(s), run \`/offers edit-link link:<new_url>\` or \`/offers edit-link clear:True\`.`,
        );
        return;
      }

      const checkoutLink = clear
        ? ""
        : rawLink
          ? normalizeEpicCheckoutLink(rawLink)
          : "";

      const prevOfferIds = getGuildPostedOfferIds(guildId);
      const s = getGuildSettings(guildId);

      const offers = await fetchCurrentOffers(prevOfferIds, {
        includeUpcoming: false,
        includeAddOns: s.includeAddOns,
      });

      const result = await scheduler.editBroadcastedOffers(
        offers,
        checkoutLink,
        guildId,
      );

      if (result.success) {
        await interaction.editReply(
          `✅ Successfully updated **${result.updatedCount}** announcement message(s)${checkoutLink ? ` with checkout link: \`${checkoutLink}\`` : " to remove custom checkout link"}.`,
        );
      } else {
        await interaction.editReply(
          `❌ Failed to update announcement message(s): ${result.error}`,
        );
      }
    } catch (error) {
      logger.error("Error in /offers edit-link:", error);
      await interaction.editReply(
        `Failed to edit checkout link: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
