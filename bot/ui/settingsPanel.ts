import { MessageFlags } from "discord.js";
import { COMPONENT_TYPES, IS_COMPONENTS_V2 } from "@/lib/builder/shared";
import { getDropWindow } from "../services/schedulerService";
import { getGuildSettings, loadBotState } from "../state";
import type {
  DiscordRawComponent,
  DiscordV2Payload,
  SettingsCategory,
} from "../types";

export function getSettingsPayload(
  currentCategory: SettingsCategory = "main",
  guildId: string | null | undefined = null,
): DiscordV2Payload {
  const s = getGuildSettings(guildId);
  const state = loadBotState();

  const containerComponents: DiscordRawComponent[] = [];

  if (currentCategory === "main") {
    containerComponents.push({
      type: COMPONENT_TYPES.TEXT_DISPLAY,
      content: `### Settings`,
    });

    const pcChan = s.announcementChannelId
      ? `<#${s.announcementChannelId}>`
      : "*Not set*";
    const mobChan = s.mobileAnnouncementChannelId
      ? `<#${s.mobileAnnouncementChannelId}>`
      : "*Same as PC*";

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Channels**\nPC: ${pcChan} • Mobile: ${mobChan}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Configure",
        custom_id: "nav_channels",
      },
    });

    const formatLabel = s.useComponentsV2 ? "V2 Embed" : "Classic Embed";
    const pcRoleLabel = s.mentionRoleId
      ? `<@&${s.mentionRoleId}>`
      : "*Not set*";
    const mobRoleLabel = s.mobileMentionRoleId
      ? `<@&${s.mobileMentionRoleId}>`
      : "*Same as PC*";
    const rolesSummary = s.splitDesktopMobile
      ? `PC Role: ${pcRoleLabel} • Mobile Role: ${mobRoleLabel}`
      : `Role: ${pcRoleLabel}`;

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Format & Roles**\n${formatLabel} • ${rolesSummary}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Configure",
        custom_id: "nav_format",
      },
    });

    const activeToggles: string[] = [];
    if (s.includePrice) activeToggles.push("Prices");
    if (s.includeImage) activeToggles.push("Artwork");
    if (s.includeClaimGame) activeToggles.push("Claim Button");
    if (s.includeCheckout) activeToggles.push("Quick Checkout");
    if (s.includeFooter) activeToggles.push("Footer");
    if (s.includeAddOns) activeToggles.push("Add-ons");
    const togglesSummary =
      activeToggles.length > 0 ? activeToggles.join(", ") : "None";

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Content Toggles**\n${togglesSummary}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Configure",
        custom_id: "nav_toggles",
      },
    });

    const windowInfo = getDropWindow();
    const lastCheck = state.lastCheckTimestamp
      ? `<t:${Math.floor(new Date(state.lastCheckTimestamp).getTime() / 1000)}:R>`
      : "*Never*";

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Scheduler**\n${windowInfo.inWindow ? "🟢 **Active**" : "**Idle**"} • Last checked: ${lastCheck}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Configure",
        custom_id: "nav_scheduler",
      },
    });
  } else if (currentCategory === "channels") {
    containerComponents.push({
      type: COMPONENT_TYPES.TEXT_DISPLAY,
      content: `### Channels`,
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**PC Channel**\n${s.announcementChannelId ? `<#${s.announcementChannelId}>` : "*Not set*"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Set Channel",
        custom_id: "pick_announcement_channel",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Mobile Channel**\n${s.mobileAnnouncementChannelId ? `<#${s.mobileAnnouncementChannelId}>` : "*Same as PC channel*"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Set Channel",
        custom_id: "pick_mobile_channel",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Separate Posts**\n${s.splitDesktopMobile ? "Sending in separate channels" : "Combined in one channel"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.splitDesktopMobile ? 3 : 2,
        label: s.splitDesktopMobile ? "Disable" : "Enable",
        custom_id: "toggle_split_desktop_mobile",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SEPARATOR,
      divider: true,
      spacing: 1,
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Admin Approval**\n${s.requireConfirmation ? "Requires approval before posting" : "Posts automatically"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.requireConfirmation ? 3 : 2,
        label: s.requireConfirmation ? "Disable" : "Enable",
        custom_id: "toggle_require_confirmation",
      },
    });

    if (s.requireConfirmation) {
      containerComponents.push({
        type: COMPONENT_TYPES.SECTION,
        components: [
          {
            type: COMPONENT_TYPES.TEXT_DISPLAY,
            content: `**Review Channel**\n${s.reviewChannelId ? `<#${s.reviewChannelId}>` : "*Uses PC Channel*"}`,
          },
        ],
        accessory: {
          type: COMPONENT_TYPES.BUTTON,
          style: 2,
          label: "Set Channel",
          custom_id: "pick_review_channel",
        },
      });

      containerComponents.push({
        type: COMPONENT_TYPES.SECTION,
        components: [
          {
            type: COMPONENT_TYPES.TEXT_DISPLAY,
            content: `**Review Role**\n${s.reviewMentionRoleId ? `<@&${s.reviewMentionRoleId}>` : "*Not set*"}`,
          },
        ],
        accessory: {
          type: COMPONENT_TYPES.BUTTON,
          style: 2,
          label: "Set Role",
          custom_id: "pick_review_role",
        },
      });
    }
  } else if (currentCategory === "format") {
    containerComponents.push({
      type: COMPONENT_TYPES.TEXT_DISPLAY,
      content: `### Format & Roles`,
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Style**\n${s.useComponentsV2 ? "Components V2" : "Classic Embeds"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.useComponentsV2 ? 1 : 2,
        label: s.useComponentsV2 ? "Use Classic" : "Use V2",
        custom_id: "toggle_components_v2",
      },
    });

    const mainRoleTitle = s.splitDesktopMobile
      ? "PC Role"
      : "Announcement Role";

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**${mainRoleTitle}**\n${s.mentionRoleId ? `<@&${s.mentionRoleId}>` : "*Not set*"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 2,
        label: "Set Role",
        custom_id: "open_format_modal",
      },
    });

    if (s.splitDesktopMobile) {
      containerComponents.push({
        type: COMPONENT_TYPES.SECTION,
        components: [
          {
            type: COMPONENT_TYPES.TEXT_DISPLAY,
            content: `**Mobile Role**\n${s.mobileMentionRoleId ? `<@&${s.mobileMentionRoleId}>` : "*Uses PC Role*"}`,
          },
        ],
        accessory: {
          type: COMPONENT_TYPES.BUTTON,
          style: 2,
          label: "Set Role",
          custom_id: "open_mobile_role_modal",
        },
      });
    }

    if (!s.useComponentsV2) {
      containerComponents.push({
        type: COMPONENT_TYPES.SECTION,
        components: [
          {
            type: COMPONENT_TYPES.TEXT_DISPLAY,
            content: `**Accent Color**\n\`${s.embedColor}\``,
          },
        ],
        accessory: {
          type: COMPONENT_TYPES.BUTTON,
          style: 2,
          label: "Set Color",
          custom_id: "open_color_modal",
        },
      });
    }
  } else if (currentCategory === "toggles") {
    containerComponents.push({
      type: COMPONENT_TYPES.TEXT_DISPLAY,
      content: `### Content Toggles`,
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Prices**\n${s.includePrice ? "Enabled" : "Disabled"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.includePrice ? 3 : 2,
        label: s.includePrice ? "Disable" : "Enable",
        custom_id: "toggle_include_price",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Artwork**\n${s.includeImage ? "Enabled" : "Disabled"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.includeImage ? 3 : 2,
        label: s.includeImage ? "Disable" : "Enable",
        custom_id: "toggle_include_image",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Claim Button**\n${s.includeClaimGame ? "Enabled" : "Disabled"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.includeClaimGame ? 3 : 2,
        label: s.includeClaimGame ? "Disable" : "Enable",
        custom_id: "toggle_include_claim_game",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Quick Checkout**\n${s.includeCheckout ? "Enabled" : "Disabled"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.includeCheckout ? 3 : 2,
        label: s.includeCheckout ? "Disable" : "Enable",
        custom_id: "toggle_include_checkout",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Footer**\n${s.includeFooter ? "Enabled" : "Disabled"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.includeFooter ? 3 : 2,
        label: s.includeFooter ? "Disable" : "Enable",
        custom_id: "toggle_include_footer",
      },
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Include Add-ons**\n${s.includeAddOns ? "Enabled" : "Disabled"}`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: s.includeAddOns ? 3 : 2,
        label: s.includeAddOns ? "Disable" : "Enable",
        custom_id: "toggle_include_add_ons",
      },
    });
  } else if (currentCategory === "scheduler") {
    const windowInfo = getDropWindow();
    containerComponents.push({
      type: COMPONENT_TYPES.TEXT_DISPLAY,
      content: `### Scheduler`,
    });

    containerComponents.push({
      type: COMPONENT_TYPES.SECTION,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `**Status:** ${windowInfo.description}\n\n**Primary Offer Check**: Thursday 15:00 UTC\n**Catch-up window**: Thursday 15:00-18:00 UTC (every 15m)\n**Regular Checks**: Every 6 hours`,
        },
      ],
      accessory: {
        type: COMPONENT_TYPES.BUTTON,
        style: 1,
        label: "Check Now",
        custom_id: "trigger_check_now",
      },
    });
  }

  const navButtons: DiscordRawComponent[] = [];
  if (currentCategory !== "main") {
    navButtons.push({
      type: COMPONENT_TYPES.BUTTON,
      style: 2,
      label: "Back to Settings",
      custom_id: "nav_main",
    });
  }

  const componentsList: DiscordV2Payload["components"] = [
    {
      type: COMPONENT_TYPES.CONTAINER,
      components: containerComponents,
    },
  ];

  if (navButtons.length > 0) {
    componentsList.push({
      type: COMPONENT_TYPES.ACTION_ROW,
      components: navButtons,
    });
  }

  return {
    flags: IS_COMPONENTS_V2 | MessageFlags.Ephemeral,
    components: componentsList,
  };
}
