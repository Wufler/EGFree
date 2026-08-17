import type { Interaction } from 'discord.js'
import { handleButtonInteraction } from './buttons'
import { handleSelectMenuInteraction } from './selectMenus'
import { handleModalSubmitInteraction } from './modals'
import type { OfferSchedulerService } from '../services/schedulerService'
import type { BotCredentials } from '../state'

export async function handleInteraction(
	interaction: Interaction,
	scheduler: OfferSchedulerService,
	credentials: BotCredentials,
): Promise<void> {
	if (interaction.isButton()) {
		await handleButtonInteraction(interaction, scheduler, credentials)
	} else if (
		interaction.isStringSelectMenu() ||
		interaction.isChannelSelectMenu() ||
		interaction.isRoleSelectMenu()
	) {
		await handleSelectMenuInteraction(interaction, credentials)
	} else if (interaction.isModalSubmit()) {
		await handleModalSubmitInteraction(interaction, scheduler, credentials)
	}
}
