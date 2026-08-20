import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Client,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type TextChannel,
} from "discord.js";
import { buildClassicEmbedPayload } from "@/lib/builder/classic";
import { buildDiscordMessagePayload } from "@/lib/builder/payload";
import { COMPONENT_TYPES, IS_COMPONENTS_V2 } from "@/lib/builder/shared";
import { getMobileGameKey } from "@/lib/utils";
import { dispatchDiscordPayload } from "../services/discordService";
import {
  type FetchedOffers,
  getCandidateGames,
  toMobileGame,
} from "../services/offerService";
import {
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
} from "../state";
import type { DiscordRawComponent, DiscordV2Payload } from "../types";

export interface ConfirmationOptions {
  includeUpcoming?: boolean;
  guildId?: string | null;
  includeAddOns?: boolean;
  selectedIndices?: number[];
}

export function buildConfirmationPayload(
  offers: FetchedOffers,
  options: ConfirmationOptions = {},
): {
  isV2: boolean;
  v2Payload?: DiscordV2Payload;
  classicPayload?: {
    content?: string;
    embeds: DiscordEmbed[];
    components: (
      | ActionRowBuilder<StringSelectMenuBuilder>
      | ActionRowBuilder<ButtonBuilder>
    )[];
  };
} {
  const guildId = options.guildId;
  const s = getGuildSettings(guildId);
  const includeAddOns =
    options.includeAddOns !== undefined
      ? options.includeAddOns
      : s.includeAddOns;
  const includeUpcoming = Boolean(options.includeUpcoming);

  const prevOfferIds = getGuildPostedOfferIds(guildId);
  const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

  const candidateGames = getCandidateGames(offers, {
    includeUpcoming,
    previousOfferIds: prevOfferIds,
    previousUpcomingOfferIds: prevUpcomingIds,
  });

  const selectedIndices =
    options.selectedIndices !== undefined && options.selectedIndices.length > 0
      ? options.selectedIndices.filter(
          (idx) => idx >= 0 && idx < candidateGames.length,
        )
      : candidateGames.map((c) => c.index);

  const selectedGameIds = candidateGames
    .filter((c) => selectedIndices.includes(c.index))
    .map((c) => c.id);

  const parsedMobile = offers.activeMobileGames.map(toMobileGame);

  const selectedGames: Record<string, boolean> = {};
  for (const g of offers.effectiveGames.currentGames) {
    selectedGames[g.id] = selectedGameIds.includes(g.id);
  }
  for (const g of offers.effectiveGames.nextGames) {
    selectedGames[g.id] = selectedGameIds.includes(g.id);
  }
  for (const g of parsedMobile) {
    const key = getMobileGameKey(g);
    selectedGames[key] = selectedGameIds.includes(key);
  }

  const channelDetails = [
    `Desktop: ${s.announcementChannelId ? `<#${s.announcementChannelId}>` : "*Not configured*"}`,
  ];
  if (s.mobileAnnouncementChannelId) {
    channelDetails.push(`Mobile: <#${s.mobileAnnouncementChannelId}>`);
  }

  const pingId = s.reviewMentionRoleId || s.mentionRoleId;
  const rolePing = pingId ? `<@&${pingId}>` : "";

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

  const selectedTitlesList = candidateGames
    .filter((c) => selectedIndices.includes(c.index))
    .map((c) => `${c.emoji} **${c.title}** (${c.platformLabel})`);
  const selectedTitles =
    selectedTitlesList.length > 0
      ? selectedTitlesList.join("\n")
      : "*No games selected*";

  const selParam = selectedIndices.join(",");

  if (s.useComponentsV2) {
    const v2Payload = buildDiscordMessagePayload(
      offers.effectiveGames,
      previewSettings,
      "",
      parsedMobile,
    ) as { components?: DiscordRawComponent[] };

    const selectOptions = candidateGames.map((cg) => ({
      label: cg.title.slice(0, 100),
      value: `${cg.index}`,
      description: `${cg.platformLabel}${cg.isNew ? " • New offer" : ""}`.slice(
        0,
        100,
      ),
      emoji: { name: cg.emoji },
      default: selectedIndices.includes(cg.index),
    }));

    const reviewComponents: DiscordRawComponent[] = [
      {
        type: COMPONENT_TYPES.TEXT_DISPLAY,
        content: `# Offer Approval & Preview\nSelect which games to publish and review the preview below before approving.${rolePing ? `\n${rolePing}` : ""}\n\n**Selected Offers (${selectedIndices.length}/${candidateGames.length}):**\n${selectedTitles}\n\n**Target Channels:**\n${channelDetails.join("\n")}`,
      },
    ];

    if (candidateGames.length > 0) {
      reviewComponents.push({
        type: COMPONENT_TYPES.ACTION_ROW,
        components: [
          {
            type: 3, // String Select Menu
            custom_id: `select_post_games:${includeUpcoming ? "1" : "0"}:${guildId || ""}:${includeAddOns ? "1" : "0"}`,
            placeholder: `Select games to publish (${selectedIndices.length}/${candidateGames.length} selected)`,
            min_values: 1,
            max_values: candidateGames.length,
            options: selectOptions,
          } as unknown as DiscordRawComponent,
        ],
      });
    }

    reviewComponents.push({
      type: COMPONENT_TYPES.ACTION_ROW,
      components: [
        {
          type: COMPONENT_TYPES.BUTTON,
          custom_id: `confirm_post_offers:${selParam}:${includeUpcoming ? "1" : "0"}:${guildId || ""}:${includeAddOns ? "1" : "0"}`,
          label: `Approve & Post (${selectedIndices.length})`,
          style: 3,
        },
        {
          type: COMPONENT_TYPES.BUTTON,
          custom_id: `dismiss_post_offers:${guildId || ""}`,
          label: "Dismiss",
          style: 4,
        },
      ],
    });

    const reviewBanner: DiscordRawComponent = {
      type: COMPONENT_TYPES.CONTAINER,
      components: reviewComponents,
    };

    const components = [...(v2Payload.components || []), reviewBanner];
    return {
      isV2: true,
      v2Payload: {
        flags: IS_COMPONENTS_V2,
        components: components as DiscordV2Payload["components"],
      },
    };
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
      "Select which games to publish from the dropdown menu, review the preview above, and click Approve to publish.",
    fields: [
      {
        name: `Selected Offers (${selectedIndices.length}/${candidateGames.length})`,
        value: selectedTitles,
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

  const rows: (
    | ActionRowBuilder<StringSelectMenuBuilder>
    | ActionRowBuilder<ButtonBuilder>
  )[] = [];

  if (candidateGames.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(
        `select_post_games:${includeUpcoming ? "1" : "0"}:${guildId || ""}:${includeAddOns ? "1" : "0"}`,
      )
      .setPlaceholder(
        `Select games to publish (${selectedIndices.length}/${candidateGames.length} selected)`,
      )
      .setMinValues(1)
      .setMaxValues(candidateGames.length)
      .addOptions(
        candidateGames.map((cg) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cg.title.slice(0, 100))
            .setValue(`${cg.index}`)
            .setDescription(
              `${cg.platformLabel}${cg.isNew ? " • New offer" : ""}`.slice(
                0,
                100,
              ),
            )
            .setEmoji(cg.emoji)
            .setDefault(selectedIndices.includes(cg.index)),
        ),
      );

    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    );
  }

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `confirm_post_offers:${selParam}:${includeUpcoming ? "1" : "0"}:${guildId || ""}:${includeAddOns ? "1" : "0"}`,
      )
      .setLabel(`Approve & Post (${selectedIndices.length})`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`dismiss_post_offers:${guildId || ""}`)
      .setLabel("Dismiss")
      .setStyle(ButtonStyle.Danger),
  );
  rows.push(buttonRow);

  return {
    isV2: false,
    classicPayload: {
      content: rolePing || undefined,
      embeds: allEmbeds,
      components: rows,
    },
  };
}

export async function sendConfirmationPrompt(
  client: Client,
  discordToken: string,
  clientId: string,
  interaction: ChatInputCommandInteraction | null,
  offers: FetchedOffers,
  options: ConfirmationOptions = {},
): Promise<void> {
  const guildId = options.guildId;
  const s = getGuildSettings(guildId);
  const targetChannelId = s.reviewChannelId || s.announcementChannelId;

  const payloadData = buildConfirmationPayload(offers, options);

  if (payloadData.isV2 && payloadData.v2Payload) {
    const payload = payloadData.v2Payload;

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
        const pingId = s.reviewMentionRoleId || s.mentionRoleId;
        const rolePing = pingId ? `<@&${pingId}>` : "";
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

  if (payloadData.classicPayload) {
    const { content, embeds, components } = payloadData.classicPayload;

    if (targetChannelId && !interaction) {
      const channel = await client.channels.fetch(targetChannelId);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send({
          content,
          embeds,
          components,
        });
      }
    } else if (interaction) {
      if (s.reviewChannelId && s.reviewChannelId !== interaction.channelId) {
        const reviewChannel = await client.channels.fetch(s.reviewChannelId);
        if (reviewChannel?.isTextBased()) {
          await (reviewChannel as TextChannel).send({
            content,
            embeds,
            components,
          });
          await interaction.editReply(
            `Approval prompt sent to <#${s.reviewChannelId}>.`,
          );
          return;
        }
      }

      if (interaction.channel?.isTextBased()) {
        await (interaction.channel as TextChannel).send({
          content,
          embeds,
          components,
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
          content,
          embeds,
          components,
        });
      }
    }
  }
}
