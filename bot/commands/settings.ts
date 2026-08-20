import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import {
  canManageSettings,
  sendInteractionResponse,
} from "../services/discordService";
import type { BotCredentials } from "../state";
import { getSettingsPayload } from "../ui/settingsPanel";

export async function handleSettingsCommand(
  interaction: ChatInputCommandInteraction,
  credentials: BotCredentials,
): Promise<void> {
  if (!canManageSettings(interaction)) {
    await interaction.reply({
      content:
        "Access Denied: You need Administrator or Manage Server permissions to configure bot settings.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const payload = getSettingsPayload("main", interaction.guildId);
  await sendInteractionResponse(
    credentials.discordToken,
    interaction,
    payload,
    false,
  );
}
