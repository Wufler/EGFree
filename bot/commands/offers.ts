import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { COMPONENT_TYPES, IS_COMPONENTS_V2 } from "@/lib/builder/shared";
import { canManageSettings } from "../services/discordService";
import { fetchCurrentOffers } from "../services/offerService";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials } from "../state";
import {
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
  recordGuildPostedOffers,
  recordGuildSeenUpcomingOffers,
} from "../state";
import { sendConfirmationPrompt } from "../ui/confirmationPrompt";

export async function handleOffersCommand(
  interaction: ChatInputCommandInteraction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "check") {
    await interaction.deferReply();
    try {
      const guildId = interaction.guildId;
      const prevOfferIds = getGuildPostedOfferIds(guildId);
      const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

      const s = getGuildSettings(guildId);
      const offers = await fetchCurrentOffers(prevOfferIds, {
        includeUpcoming: true,
        previousUpcomingOfferIds: prevUpcomingIds,
        includeAddOns: s.includeAddOns,
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
          parseInt(s.embedColor.replace("#", ""), 16) || 0x5865f2;
        const checkEmbed: DiscordEmbed = {
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
      console.error("[EGFree] Error in /offers check:", error);
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

      const prevOfferIds = getGuildPostedOfferIds(guildId);
      const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

      const offers = await fetchCurrentOffers(prevOfferIds, {
        includeUpcoming,
        previousUpcomingOfferIds: prevUpcomingIds,
        includeAddOns,
      });

      if (!offers.hasNewOffers && !force) {
        await interaction.editReply(
          "No new offers found. Use `/offers post force:True` to post anyway.",
        );
        return;
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
          },
        );
      } else {
        const result = await scheduler.broadcastOffers(offers, {
          includeUpcoming,
          guildId,
          includeAddOns,
        });
        if (result.success) {
          recordGuildPostedOffers(
            guildId,
            offers.currentOfferIds,
            offers.upcomingOfferIds,
          );
          await interaction.editReply(
            "Offers posted successfully to the announcement channel.",
          );
        } else {
          await interaction.editReply(`Failed to post offers: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("[EGFree] Error in /offers post:", error);
      await interaction.editReply(
        `Failed to process post request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
