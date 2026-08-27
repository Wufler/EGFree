import {
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  type Interaction,
  type ModalSubmitInteraction,
  PermissionFlagsBits,
  type RoleSelectMenuInteraction,
  type TextChannel,
} from "discord.js";
import { logger } from "../logger";
import { getGuildSettings } from "../state";
import type { DiscordV2Payload } from "../types";

export function canManageSettings(interaction: Interaction): boolean {
  if (!interaction.guild) return true;
  if (interaction.guild.ownerId === interaction.user.id) return true;

  if (interaction.memberPermissions) {
    if (
      interaction.memberPermissions.has(PermissionFlagsBits.Administrator) ||
      interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return true;
    }
  }

  const guildSettings = getGuildSettings(interaction.guildId);
  if (
    guildSettings.reviewMentionRoleId &&
    "member" in interaction &&
    interaction.member
  ) {
    const memberRoles = (
      interaction.member as {
        roles?: string[] | { cache: Map<string, unknown> };
      }
    ).roles;
    if (
      Array.isArray(memberRoles) &&
      memberRoles.includes(guildSettings.reviewMentionRoleId)
    ) {
      return true;
    }
    if (
      memberRoles &&
      "cache" in memberRoles &&
      memberRoles.cache.has(guildSettings.reviewMentionRoleId)
    ) {
      return true;
    }
  }

  return false;
}

export async function dispatchDiscordPayload(
  token: string,
  channel: TextChannel | { id: string; type?: number | ChannelType },
  rawPayload: Record<string, unknown>,
  options: { autoCrosspost?: boolean } = { autoCrosspost: true },
): Promise<{ id: string } | null> {
  const channelId = channel.id;

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rawPayload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API error (${response.status}): ${errorText}`);
  }

  const messageData = (await response.json()) as { id: string };

  const isAnnouncementChannel =
    channel.type === ChannelType.GuildAnnouncement || channel.type === 5;

  if (options.autoCrosspost && isAnnouncementChannel && messageData?.id) {
    try {
      const crosspostRes = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageData.id}/crosspost`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${token}`,
          },
        },
      );
      if (crosspostRes.ok) {
        logger.info(
          `Successfully published announcement message ${messageData.id} to followers.`,
        );
      } else {
        const errText = await crosspostRes.text();
        logger.warn(
          `Could not publish message in announcement channel (${crosspostRes.status}): ${errText}`,
        );
      }
    } catch (crosspostErr) {
      logger.warn("Failed to crosspost announcement message:", crosspostErr);
    }
  }

  return messageData;
}

export async function sendInteractionResponse(
  token: string,
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction
    | ModalSubmitInteraction,
  payload: DiscordV2Payload,
  isEdit: boolean = false,
): Promise<void> {
  const interactionId = interaction.id;
  const interactionToken = interaction.token;
  const responseType = isEdit ? 7 : 4;
  const url = `https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: responseType,
      data: payload,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error(`Interaction response failed (${res.status}):`, err);
  }
}
