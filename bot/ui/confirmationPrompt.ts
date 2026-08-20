import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Client,
  type TextChannel,
} from "discord.js";
import { buildClassicEmbedPayload } from "@/lib/builder/classic";
import { buildDiscordMessagePayload } from "@/lib/builder/payload";
import { COMPONENT_TYPES, IS_COMPONENTS_V2 } from "@/lib/builder/shared";
import { getMobileGameKey } from "@/lib/utils";
import { dispatchDiscordPayload } from "../services/discordService";
import {
  convertMobileGameData,
  type FetchedOffers,
} from "../services/offerService";
import { getGuildSettings } from "../state";
import type { DiscordRawComponent, DiscordV2Payload } from "../types";

export async function sendConfirmationPrompt(
  client: Client,
  discordToken: string,
  clientId: string,
  interaction: ChatInputCommandInteraction | null,
  offers: FetchedOffers,
  options: { includeUpcoming?: boolean; guildId?: string | null } = {},
): Promise<void> {
  const guildId = options.guildId;
  const s = getGuildSettings(guildId);
  const targetChannelId = s.reviewChannelId || s.announcementChannelId;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `confirm_post_offers:${options.includeUpcoming ? "1" : "0"}:${guildId || ""}`,
      )
      .setLabel("Approve & Post")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`dismiss_post_offers:${guildId || ""}`)
      .setLabel("Dismiss")
      .setStyle(ButtonStyle.Danger),
  );

  const channelDetails = [
    `Desktop: ${s.announcementChannelId ? `<#${s.announcementChannelId}>` : "*Not configured*"}`,
  ];
  if (s.mobileAnnouncementChannelId) {
    channelDetails.push(`Mobile: <#${s.mobileAnnouncementChannelId}>`);
  }

  const pingId = s.reviewMentionRoleId || s.mentionRoleId;
  const rolePing = pingId ? `<@&${pingId}>` : "";

  const parsedMobile = offers.activeMobileGames.map(convertMobileGameData);
  const selectedGames: Record<string, boolean> = {};
  for (const g of offers.effectiveGames.currentGames) {
    selectedGames[g.id] = true;
  }
  for (const g of offers.effectiveGames.nextGames) {
    selectedGames[g.id] = !!options.includeUpcoming;
  }
  for (const g of parsedMobile) {
    selectedGames[getMobileGameKey(g)] = true;
  }

  const previewSettings: EgFreeSettings = {
    selectedGames,
    embedContent: "",
    embedContentMobile: "",
    splitDesktopMobile: s.splitDesktopMobile,
    sendDesktop: true,
    sendMobile: true,
    useDesktopWebhookForMobile: false,
    embedColor: s.embedColor,
    includeFooter: s.includeFooter,
    includePrice: s.includePrice,
    includeImage: s.includeImage,
    includeCheckout: s.includeCheckout,
    includeClaimGame: s.includeClaimGame,
    componentsV2: s.useComponentsV2,
    webhookUrl: "",
    webhookUrlMobile: "",
    showDiscordPreview: true,
  };

  if (s.useComponentsV2) {
    const v2Payload = buildDiscordMessagePayload(
      offers.effectiveGames,
      previewSettings,
      "",
      parsedMobile,
    ) as { components?: DiscordRawComponent[] };

    const reviewBanner: DiscordRawComponent = {
      type: COMPONENT_TYPES.CONTAINER,
      components: [
        {
          type: COMPONENT_TYPES.TEXT_DISPLAY,
          content: `# Offer Approval & Preview\nNew offers detected and are awaiting approval before posting.${rolePing ? `\n${rolePing}` : ""}\n\n**Detected Offers:**\n${offers.titles.join("\n")}\n\n**Target Channels:**\n${channelDetails.join("\n")}`,
        },
        {
          type: COMPONENT_TYPES.ACTION_ROW,
          components: [
            {
              type: COMPONENT_TYPES.BUTTON,
              custom_id: `confirm_post_offers:${options.includeUpcoming ? "1" : "0"}:${guildId || ""}`,
              label: "Approve & Post",
              style: 3,
            },
            {
              type: COMPONENT_TYPES.BUTTON,
              custom_id: `dismiss_post_offers:${guildId || ""}`,
              label: "Dismiss",
              style: 4,
            },
          ],
        },
      ],
    };

    const components = [...(v2Payload.components || []), reviewBanner];
    const payload: DiscordV2Payload = {
      flags: IS_COMPONENTS_V2,
      components: components as DiscordV2Payload["components"],
    };

    if (targetChannelId && !interaction) {
      const channel = await client.channels.fetch(targetChannelId);
      if (channel?.isTextBased()) {
        await dispatchDiscordPayload(
          discordToken,
          channel as TextChannel,
          payload as unknown as Record<string, unknown>,
        );
      }
    } else if (interaction) {
      if (s.reviewChannelId && s.reviewChannelId !== interaction.channelId) {
        const reviewChannel = await client.channels.fetch(s.reviewChannelId);
        if (reviewChannel?.isTextBased()) {
          await dispatchDiscordPayload(
            discordToken,
            reviewChannel as TextChannel,
            payload as unknown as Record<string, unknown>,
          );
          await interaction.editReply(
            `Approval prompt sent to <#${s.reviewChannelId}>.`,
          );
        } else {
          await interaction.editReply(
            `Review channel <#${s.reviewChannelId}> not found or not text-based.`,
          );
        }
      } else {
        if (rolePing && interaction.channel?.isTextBased()) {
          await dispatchDiscordPayload(
            discordToken,
            interaction.channel as TextChannel,
            payload as unknown as Record<string, unknown>,
          );
          await interaction.deleteReply();
          return;
        }

        const url = `https://discord.com/api/v10/webhooks/${clientId}/${interaction.token}/messages/@original`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${discordToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Discord API error (${res.status}): ${errorText}`);
        }
      }
    }
    return;
  }

  const previewEmbedPayload = buildClassicEmbedPayload(
    offers.effectiveGames,
    previewSettings,
    "",
    parsedMobile,
  ) as { embeds: DiscordEmbed[] };

  const embedColorHex = parseInt(s.embedColor.replace("#", ""), 16) || 0x5865f2;

  const headerEmbed: DiscordEmbed = {
    color: embedColorHex,
    author: {
      name: "Epic Games Store • Approval Required",
      url: "https://free.wolfey.me/",
      icon_url: "https://up.wolfey.me/mFG3IGgV",
    },
    title: "Offer Approval & Action",
    description:
      "Review the free offers above. Click Approve to publish to announcement channels, or Dismiss to cancel.",
    fields: [
      {
        name: "Detected Offers",
        value: offers.titles.length > 0 ? offers.titles.join("\n") : "*None*",
        inline: false,
      },
      {
        name: "Target Channels",
        value: channelDetails.join("\n"),
        inline: true,
      },
    ],
    footer: {
      text: "Click Approve to publish immediately, or Dismiss to cancel.",
    },
    timestamp: new Date().toISOString(),
  };

  const allEmbeds: DiscordEmbed[] = [
    ...(previewEmbedPayload.embeds || []),
    headerEmbed,
  ];

  if (targetChannelId && !interaction) {
    const channel = await client.channels.fetch(targetChannelId);
    if (channel?.isTextBased()) {
      await (channel as TextChannel).send({
        content: rolePing || undefined,
        embeds: allEmbeds,
        components: [row],
      });
    }
  } else if (interaction) {
    if (s.reviewChannelId && s.reviewChannelId !== interaction.channelId) {
      const reviewChannel = await client.channels.fetch(s.reviewChannelId);
      if (reviewChannel?.isTextBased()) {
        await (reviewChannel as TextChannel).send({
          content: rolePing || undefined,
          embeds: allEmbeds,
          components: [row],
        });
        await interaction.editReply(
          `Approval prompt sent to <#${s.reviewChannelId}>.`,
        );
        return;
      }
    }

    if (interaction.channel?.isTextBased()) {
      await (interaction.channel as TextChannel).send({
        content: rolePing || undefined,
        embeds: allEmbeds,
        components: [row],
      });
      try {
        await interaction.deleteReply();
      } catch {
        await interaction.editReply({
          content: "Approval prompt posted below.",
        });
      }
    } else {
      await interaction.editReply({
        content: rolePing || undefined,
        embeds: allEmbeds,
        components: [row],
      });
    }
  }
}
