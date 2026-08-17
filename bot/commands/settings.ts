import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js'
import {
	canManageSettings,
	sendInteractionResponse,
} from '../services/discordService'
import { getSettingsComponentsV2Payload } from '../ui/settingsPanel'
import type { BotCredentials } from '../state'

export async function handleSettingsCommand(
	interaction: ChatInputCommandInteraction,
	credentials: BotCredentials,
): Promise<void> {
	if (!canManageSettings(interaction)) {
		await interaction.reply({
			content:
				'Access Denied: You need Administrator or Manage Server permissions to configure bot settings.',
			flags: MessageFlags.Ephemeral,
		})
		return
	}

	const payload = getSettingsComponentsV2Payload('main', interaction.guildId)
	await sendInteractionResponse(
		credentials.discordToken,
		interaction,
		payload,
		false,
	)
}
