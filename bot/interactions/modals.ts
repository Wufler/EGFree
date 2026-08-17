import { MessageFlags, type ModalSubmitInteraction } from 'discord.js'
import { updateGuildSettings } from '../state'
import {
	canManageSettings,
	sendInteractionResponse,
} from '../services/discordService'
import { getSettingsComponentsV2Payload } from '../ui/settingsPanel'
import type { OfferSchedulerService } from '../services/schedulerService'
import type { BotCredentials } from '../state'

export async function handleModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	scheduler: OfferSchedulerService,
	credentials: BotCredentials,
): Promise<void> {
	if (!canManageSettings(interaction)) {
		await interaction.reply({
			content:
				'**Access Denied**: You need **Administrator** or **Manage Server** permissions (or Server Owner) to modify bot settings for this server.',
			flags: MessageFlags.Ephemeral,
		})
		return
	}

	const token = credentials.discordToken

	if (interaction.customId === 'settings_modal_color') {
		const colorRaw = interaction.fields.getTextInputValue('input_color').trim()
		if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorRaw)) {
			updateGuildSettings(interaction.guildId, { embedColor: colorRaw })
		}
		await sendInteractionResponse(
			token,
			interaction,
			getSettingsComponentsV2Payload('format', interaction.guildId),
			true,
		)
	} else if (interaction.customId === 'settings_modal_interval') {
		const intervalRaw = interaction.fields
			.getTextInputValue('input_interval')
			.trim()
		const parsedInterval = parseInt(intervalRaw, 10)
		if (!isNaN(parsedInterval) && parsedInterval >= 5 && parsedInterval <= 1440) {
			updateGuildSettings(interaction.guildId, {
				checkIntervalMinutes: parsedInterval,
			})
			scheduler.start()
		}
		await sendInteractionResponse(
			token,
			interaction,
			getSettingsComponentsV2Payload('scheduler', interaction.guildId),
			true,
		)
	}
}
