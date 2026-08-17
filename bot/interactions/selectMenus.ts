import {
	MessageFlags,
	type StringSelectMenuInteraction,
	type ChannelSelectMenuInteraction,
	type RoleSelectMenuInteraction,
} from 'discord.js'
import { updateGuildSettings } from '../state'
import {
	canManageSettings,
	sendInteractionResponse,
} from '../services/discordService'
import { getSettingsComponentsV2Payload } from '../ui/settingsPanel'
import type { BotCredentials } from '../state'

export async function handleSelectMenuInteraction(
	interaction:
		| StringSelectMenuInteraction
		| ChannelSelectMenuInteraction
		| RoleSelectMenuInteraction,
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

	if (interaction.isChannelSelectMenu()) {
		const channelId = interaction.values[0]
		if (interaction.customId === 'select_announcement_channel') {
			updateGuildSettings(interaction.guildId, {
				announcementChannelId: channelId,
			})
		} else if (interaction.customId === 'select_mobile_channel') {
			updateGuildSettings(interaction.guildId, {
				mobileAnnouncementChannelId: channelId,
			})
		} else if (interaction.customId === 'select_review_channel') {
			updateGuildSettings(interaction.guildId, { reviewChannelId: channelId })
		}

		await sendInteractionResponse(
			token,
			interaction,
			getSettingsComponentsV2Payload('channels', interaction.guildId),
			true,
		)
	}

	if (interaction.isRoleSelectMenu()) {
		const roleId = interaction.values[0]
		if (interaction.customId === 'select_review_role') {
			updateGuildSettings(interaction.guildId, { reviewMentionRoleId: roleId })
			await sendInteractionResponse(
				token,
				interaction,
				getSettingsComponentsV2Payload('channels', interaction.guildId),
				true,
			)
		} else if (interaction.customId === 'select_mention_role') {
			updateGuildSettings(interaction.guildId, { mentionRoleId: roleId })
			await sendInteractionResponse(
				token,
				interaction,
				getSettingsComponentsV2Payload('format', interaction.guildId),
				true,
			)
		} else if (interaction.customId === 'select_mobile_role') {
			updateGuildSettings(interaction.guildId, { mobileMentionRoleId: roleId })
			await sendInteractionResponse(
				token,
				interaction,
				getSettingsComponentsV2Payload('format', interaction.guildId),
				true,
			)
		}
	}
}
