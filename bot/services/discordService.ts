import {
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  type ChatInputCommandInteraction,
  type Interaction,
  type ModalSubmitInteraction,
  PermissionFlagsBits,
  type RoleSelectMenuInteraction,
  type TextChannel,
} from "discord.js";
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
  channel: TextChannel,
  rawPayload: Record<string, unknown>,
): Promise<void> {
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
    console.error(`[EGFree] Interaction response failed (${res.status}):`, err);
  }
}
