import {
  ActionRowBuilder,
  type ButtonInteraction,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  RoleSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { COMPONENT_TYPES, IS_COMPONENTS_V2 } from "@/lib/builder/shared";
import {
  canManageSettings,
  sendInteractionResponse,
} from "../services/discordService";
import {
  fetchCurrentOffers,
  getCandidateGames,
} from "../services/offerService";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials, BotPersistentSettings } from "../state";
import {
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
  recordGuildPostedOffers,
  updateGuildSettings,
} from "../state";
import type { SettingsCategory } from "../types";
import { renderPickerResponse } from "../ui/pickers";
import { getSettingsPayload } from "../ui/settingsPanel";

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  if (interaction.customId.startsWith("confirm_post_offers")) {
    if (!canManageSettings(interaction)) {
      await interaction.reply({
        content:
          "Access Denied: You need Administrator or Manage Server permissions (or the configured Review Role) to approve offers.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferUpdate();

    const parts = interaction.customId.split(":");
    let selParam: string | null = null;
    let includeUpcoming = false;
    let guildId: string | null = null;
    let includeAddOns: boolean | undefined;

    if (parts.length >= 5) {
      selParam = parts[1];
      includeUpcoming = parts[2] === "1";
      guildId = parts[3] || interaction.guildId || null;
      includeAddOns = parts[4] !== undefined ? parts[4] === "1" : undefined;
    } else {
      includeUpcoming = parts[1] === "1";
      guildId = parts[2] || interaction.guildId || null;
      includeAddOns = parts[3] !== undefined ? parts[3] === "1" : undefined;
    }

    const s = getGuildSettings(guildId);
    if (includeAddOns === undefined) {
      includeAddOns = s.includeAddOns;
    }

    const prevOfferIds = getGuildPostedOfferIds(guildId);
    const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

    const offers = await fetchCurrentOffers(prevOfferIds, {
      includeUpcoming,
      previousUpcomingOfferIds: prevUpcomingIds,
      includeAddOns,
    });

    const candidateGames = getCandidateGames(offers, {
      includeUpcoming,
      previousOfferIds: prevOfferIds,
      previousUpcomingOfferIds: prevUpcomingIds,
    });

    let selectedCandidateGames = candidateGames;
    if (selParam !== null && selParam.length > 0) {
      const selectedIndices = selParam
        .split(",")
        .map((v) => parseInt(v.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      selectedCandidateGames = candidateGames.filter((c) =>
        selectedIndices.includes(c.index),
      );
    }

    const selectedGameIds = selectedCandidateGames.map((c) => c.id);

    if (selectedGameIds.length === 0) {
      await interaction.followUp({
        content:
          "No games were selected to post. Please select at least one game.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await scheduler.broadcastOffers(offers, {
      includeUpcoming,
      guildId,
      includeAddOns,
      selectedGameIds,
    });
    if (result.success) {
      const postedCurrentIds = selectedGameIds.filter((id) =>
        offers.currentOfferIds.includes(id),
      );
      const postedUpcomingIds = selectedGameIds.filter((id) =>
        offers.upcomingOfferIds.includes(id),
      );

      recordGuildPostedOffers(guildId, postedCurrentIds, postedUpcomingIds);

      const titleList =
        selectedCandidateGames.length > 0
          ? selectedCandidateGames
              .map((c) => `${c.emoji} **${c.title}** (${c.platformLabel})`)
              .join("\n")
          : "*None*";
      const timestamp = Math.floor(Date.now() / 1000);

      const channelDetails = [
        `Desktop: ${s.announcementChannelId ? `<#${s.announcementChannelId}>` : "*Not configured*"}`,
      ];
      if (s.mobileAnnouncementChannelId) {
        channelDetails.push(`Mobile: <#${s.mobileAnnouncementChannelId}>`);
      }
      const channelsList = channelDetails.join("\n");

      if (s.useComponentsV2) {
        const token = credentials.discordToken;
        const url = `https://discord.com/api/v10/webhooks/${credentials.clientId}/${interaction.token}/messages/@original`;
        const successV2Payload = {
          flags: IS_COMPONENTS_V2,
          components: [
            {
              type: COMPONENT_TYPES.CONTAINER,
              components: [
                {
                  type: COMPONENT_TYPES.TEXT_DISPLAY,
                  content: `# Offers Approved & Published\nPublished by <@${interaction.user.id}> at <t:${timestamp}:T>.\n\n**Posted Offers (${selectedCandidateGames.length}):**\n${titleList}\n\n**Posted To:**\n${channelsList}`,
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
          body: JSON.stringify(successV2Payload),
        });
      } else {
        const successEmbed: DiscordEmbed = {
          color: 0x57f287,
          author: {
            name: "Epic Games Store • Offers Published",
            url: "https://free.wolfey.me/",
            icon_url: "https://up.wolfey.me/mFG3IGgV",
          },
          title: "Offers Approved & Published",
          description: `Published by <@${interaction.user.id}> at <t:${timestamp}:T>`,
          fields: [
            {
              name: `Posted Offers (${selectedCandidateGames.length})`,
              value: titleList,
              inline: false,
            },
            {
              name: "Posted To",
              value: channelsList,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        await interaction.editReply({
          content: "",
          embeds: [successEmbed],
          components: [],
        });
      }
    } else {
      const errorEmbed: DiscordEmbed = {
        color: 0xed4245,
        title: "Failed to Publish Offers",
        description: `An error occurred while posting: \`${result.error}\``,
        timestamp: new Date().toISOString(),
      };

      await interaction.followUp({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.customId.startsWith("dismiss_post_offers")) {
    if (!canManageSettings(interaction)) {
      await interaction.reply({
        content:
          "Access Denied: You need Administrator or Manage Server permissions (or the configured Review Role) to dismiss offers.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferUpdate();
    const parts = interaction.customId.split(":");
    const guildId = parts[1] || interaction.guildId || null;
    const s = getGuildSettings(guildId);

    if (s.useComponentsV2) {
      const token = credentials.discordToken;
      const url = `https://discord.com/api/v10/webhooks/${credentials.clientId}/${interaction.token}/messages/@original`;
      const dismissedV2Payload = {
        flags: IS_COMPONENTS_V2,
        components: [
          {
            type: COMPONENT_TYPES.CONTAINER,
            components: [
              {
                type: COMPONENT_TYPES.TEXT_DISPLAY,
                content: `# Offer Posting Dismissed\nThe offer confirmation was dismissed by <@${interaction.user.id}>. No messages were sent to the announcement channels.`,
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
        body: JSON.stringify(dismissedV2Payload),
      });
    } else {
      const dismissedEmbed: DiscordEmbed = {
        color: 0xed4245,
        author: {
          name: "Epic Games Store • Approval Request",
          url: "https://free.wolfey.me/",
          icon_url: "https://up.wolfey.me/mFG3IGgV",
        },
        title: "Offer Posting Dismissed",
        description: `This offer confirmation was dismissed by <@${interaction.user.id}>. No messages were sent to announcement channels.`,
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({
        content: "",
        embeds: [dismissedEmbed],
        components: [],
      });
    }
  } else if (
    interaction.customId.startsWith("nav_") ||
    interaction.customId.startsWith("pick_") ||
    interaction.customId.startsWith("clear_") ||
    interaction.customId.startsWith("toggle_") ||
    interaction.customId === "open_color_modal" ||
    interaction.customId === "open_format_modal" ||
    interaction.customId === "open_mobile_role_modal" ||
    interaction.customId === "trigger_check_now"
  ) {
    if (!canManageSettings(interaction)) {
      await interaction.reply({
        content:
          "**Access Denied**: You need **Administrator** or **Manage Server** permissions to modify bot settings for this server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const s = getGuildSettings(interaction.guildId);
    const token = credentials.discordToken;

    if (interaction.customId === "nav_main") {
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("main", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "toggle_bot_enabled") {
      const current = s.enabled !== false;
      updateGuildSettings(interaction.guildId, { enabled: !current });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("main", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "nav_channels") {
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("channels", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "nav_format") {
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("format", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "nav_toggles") {
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("toggles", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "nav_scheduler") {
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("scheduler", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "pick_announcement_channel") {
      await renderPickerResponse(
        interaction,
        token,
        "PC Channel",
        s.announcementChannelId
          ? `<#${s.announcementChannelId}>`
          : "*Not configured*",
        new ChannelSelectMenuBuilder()
          .setCustomId("select_announcement_channel")
          .setPlaceholder("Select PC Channel")
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
          ),
        "clear_announcement_channel",
        "nav_channels",
      );
    } else if (interaction.customId === "clear_announcement_channel") {
      updateGuildSettings(interaction.guildId, { announcementChannelId: "" });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("channels", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "pick_mobile_channel") {
      await renderPickerResponse(
        interaction,
        token,
        "Mobile Channel",
        s.mobileAnnouncementChannelId
          ? `<#${s.mobileAnnouncementChannelId}>`
          : "*Not configured*",
        new ChannelSelectMenuBuilder()
          .setCustomId("select_mobile_channel")
          .setPlaceholder("Select Mobile Channel")
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
          ),
        "clear_mobile_channel",
        "nav_channels",
      );
    } else if (interaction.customId === "clear_mobile_channel") {
      updateGuildSettings(interaction.guildId, {
        mobileAnnouncementChannelId: "",
      });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("channels", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "pick_review_channel") {
      await renderPickerResponse(
        interaction,
        token,
        "Review Channel",
        s.reviewChannelId ? `<#${s.reviewChannelId}>` : "*Not configured*",
        new ChannelSelectMenuBuilder()
          .setCustomId("select_review_channel")
          .setPlaceholder("Select Review Channel")
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
          ),
        "clear_review_channel",
        "nav_channels",
      );
    } else if (interaction.customId === "clear_review_channel") {
      updateGuildSettings(interaction.guildId, { reviewChannelId: "" });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("channels", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "pick_review_role") {
      await renderPickerResponse(
        interaction,
        token,
        "Review Role",
        s.reviewMentionRoleId ? `<@&${s.reviewMentionRoleId}>` : "*Not set*",
        new RoleSelectMenuBuilder()
          .setCustomId("select_review_role")
          .setPlaceholder("Select Review Role"),
        "clear_review_role",
        "nav_channels",
      );
    } else if (interaction.customId === "clear_review_role") {
      updateGuildSettings(interaction.guildId, { reviewMentionRoleId: "" });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("channels", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "open_format_modal") {
      const roleTitle = s.splitDesktopMobile ? "PC Role" : "Announcement Role";
      const rolePlaceholder = s.splitDesktopMobile
        ? "Select PC Role"
        : "Select Announcement Role";
      await renderPickerResponse(
        interaction,
        token,
        roleTitle,
        s.mentionRoleId ? `<@&${s.mentionRoleId}>` : "*Not set*",
        new RoleSelectMenuBuilder()
          .setCustomId("select_mention_role")
          .setPlaceholder(rolePlaceholder),
        "clear_mention_role",
        "nav_format",
      );
    } else if (interaction.customId === "clear_mention_role") {
      updateGuildSettings(interaction.guildId, { mentionRoleId: "" });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("format", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "open_mobile_role_modal") {
      await renderPickerResponse(
        interaction,
        token,
        "Mobile Role",
        s.mobileMentionRoleId ? `<@&${s.mobileMentionRoleId}>` : "*Not set*",
        new RoleSelectMenuBuilder()
          .setCustomId("select_mobile_role")
          .setPlaceholder("Select Mobile Role"),
        "clear_mobile_role",
        "nav_format",
      );
    } else if (interaction.customId === "clear_mobile_role") {
      updateGuildSettings(interaction.guildId, { mobileMentionRoleId: "" });
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("format", interaction.guildId),
        true,
      );
    } else if (interaction.customId === "open_color_modal") {
      const currentSettings = getGuildSettings(interaction.guildId);
      const modal = new ModalBuilder()
        .setCustomId("settings_modal_color")
        .setTitle("Set Accent Color");

      const colorInput = new TextInputBuilder()
        .setCustomId("input_color")
        .setLabel("Hex Color:")
        .setStyle(TextInputStyle.Short)
        .setValue(currentSettings.embedColor)
        .setPlaceholder("#85ce4b")
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
      );
      await interaction.showModal(modal);
    } else if (interaction.customId === "trigger_check_now") {
      await scheduler.runOfferCheck();
      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload("scheduler", interaction.guildId),
        true,
      );
    } else if (interaction.customId.startsWith("toggle_")) {
      const toggleKey = interaction.customId.replace("toggle_", "");
      const currentSettings = getGuildSettings(interaction.guildId);

      const updates: Partial<BotPersistentSettings> = {};
      let returnCat: SettingsCategory = "toggles";

      if (toggleKey === "components_v2") {
        updates.useComponentsV2 = !currentSettings.useComponentsV2;
        returnCat = "format";
      } else if (toggleKey === "split_desktop_mobile") {
        updates.splitDesktopMobile = !currentSettings.splitDesktopMobile;
        returnCat = "channels";
      } else if (toggleKey === "require_confirmation") {
        updates.requireConfirmation = !currentSettings.requireConfirmation;
        returnCat = "channels";
      } else if (toggleKey === "include_price") {
        updates.includePrice = !currentSettings.includePrice;
      } else if (toggleKey === "include_image") {
        updates.includeImage = !currentSettings.includeImage;
      } else if (toggleKey === "include_claim_game") {
        updates.includeClaimGame = !currentSettings.includeClaimGame;
      } else if (toggleKey === "include_checkout") {
        updates.includeCheckout = !currentSettings.includeCheckout;
      } else if (toggleKey === "include_add_ons") {
        updates.includeAddOns = !currentSettings.includeAddOns;
      } else if (toggleKey === "include_mobile") {
        updates.includeMobile = !(currentSettings.includeMobile !== false);
      } else if (toggleKey === "include_footer") {
        updates.includeFooter = !currentSettings.includeFooter;
      }

      if (Object.keys(updates).length > 0) {
        updateGuildSettings(interaction.guildId, updates);
      }

      await sendInteractionResponse(
        token,
        interaction,
        getSettingsPayload(returnCat, interaction.guildId),
        true,
      );
    }
  }
}
