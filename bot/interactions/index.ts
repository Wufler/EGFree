import type { Interaction } from "discord.js";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials } from "../state";
import { handleButtonInteraction } from "./buttons";
import { handleModalSubmitInteraction } from "./modals";
import { handleSelectMenuInteraction } from "./selectMenus";

export async function handleInteraction(
  interaction: Interaction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction, scheduler, credentials);
  } else if (
    interaction.isStringSelectMenu() ||
    interaction.isChannelSelectMenu() ||
    interaction.isRoleSelectMenu()
  ) {
    await handleSelectMenuInteraction(interaction, credentials);
  } else if (interaction.isModalSubmit()) {
    await handleModalSubmitInteraction(interaction, scheduler, credentials);
  }
}
