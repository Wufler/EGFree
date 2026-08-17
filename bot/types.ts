import type {
	ActionRowBuilder,
	ButtonBuilder,
	ChannelSelectMenuBuilder,
	RoleSelectMenuBuilder,
	StringSelectMenuBuilder,
} from 'discord.js'

export type SettingsCategory =
	| 'main'
	| 'channels'
	| 'format'
	| 'toggles'
	| 'scheduler'

export interface DiscordRawComponent {
	type: number
	components?: DiscordRawComponent[]
	accessory?: DiscordRawComponent
	content?: string
	items?: Array<{ media: { url: string } }>
	style?: number
	label?: string
	custom_id?: string
	url?: string
	divider?: boolean
	spacing?: number
}

export interface DiscordV2Payload {
	flags: number
	components: Array<
		| DiscordRawComponent
		| ActionRowBuilder<
				| ButtonBuilder
				| ChannelSelectMenuBuilder
				| RoleSelectMenuBuilder
				| StringSelectMenuBuilder
		  >
	>
}
