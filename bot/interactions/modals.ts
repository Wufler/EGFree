import { MessageFlags, type ModalSubmitInteraction } from "discord.js";
import {
  canManageSettings,
  sendInteractionResponse,
} from "../services/discordService";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials } from "../state";
import { updateGuildSettings } from "../state";
import { getSettingsPayload } from "../ui/settingsPanel";

export async function handleModalSubmitInteraction(
  interaction: ModalSubmitInteraction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  if (!canManageSettings(interaction)) {
    await interaction.reply({
      content:
        "**Access Denied**: You need **Administrator** or **Manage Server** permissions to modify bot settings for this server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const token = credentials.discordToken;

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
  } else if (interaction.customId === "settings_modal_interval") {
    const intervalRaw = interaction.fields
      .getTextInputValue("input_interval")
      .trim();
    const parsedInterval = parseInt(intervalRaw, 10);
    if (
      !Number.isNaN(parsedInterval) &&
      parsedInterval >= 5 &&
      parsedInterval <= 1440
    ) {
      updateGuildSettings(interaction.guildId, {
        checkIntervalMinutes: parsedInterval,
      });
      scheduler.start();
    }
    await sendInteractionResponse(
      token,
      interaction,
      getSettingsPayload("scheduler", interaction.guildId),
      true,
    );
  }
}
