import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChannelSelectMenuBuilder,
	type RoleSelectMenuBuilder,
	type ButtonInteraction,
	MessageFlags,
} from 'discord.js'
import { COMPONENT_TYPES, IS_COMPONENTS_V2 } from '@/lib/builder/shared'
import { sendInteractionResponse } from '../services/discordService'

export async function renderPickerResponse(
	interaction: ButtonInteraction,
	token: string,
	title: string,
	currentValue: string,
	selectMenu: ChannelSelectMenuBuilder | RoleSelectMenuBuilder,
	clearCustomId: string,
	backCustomId: string,
): Promise<void> {
	const backBtn = new ButtonBuilder()
		.setCustomId(backCustomId)
		.setLabel('Back')
		.setStyle(ButtonStyle.Secondary)

	const clearBtn = new ButtonBuilder()
		.setCustomId(clearCustomId)
		.setLabel('Clear')
		.setStyle(ButtonStyle.Danger)

	await sendInteractionResponse(
		token,
		interaction,
		{
			flags: IS_COMPONENTS_V2 | MessageFlags.Ephemeral,
			components: [
				{
					type: COMPONENT_TYPES.CONTAINER,
					components: [
						{
							type: COMPONENT_TYPES.TEXT_DISPLAY,
							content: `### ${title}\nCurrent: ${currentValue}`,
						},
					],
				},
				new ActionRowBuilder<ChannelSelectMenuBuilder | RoleSelectMenuBuilder>().addComponents(
					selectMenu,
				),
				new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn, clearBtn),
			],
		},
		true,
	)
}
