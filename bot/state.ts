import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export interface BotCredentials {
	discordToken: string
	clientId: string
}

export interface BotPersistentSettings {
	announcementChannelId?: string
	mobileAnnouncementChannelId?: string
	reviewChannelId?: string
	requireConfirmation: boolean
	checkIntervalMinutes: number
	useComponentsV2: boolean
	mentionRoleId?: string
	mobileMentionRoleId?: string
	reviewMentionRoleId?: string
	splitDesktopMobile: boolean
	embedColor: string
	includePrice: boolean
	includeImage: boolean
	includeFooter: boolean
	includeCheckout: boolean
	includeClaimGame: boolean
}

export const DEFAULT_BOT_SETTINGS: BotPersistentSettings = {
	announcementChannelId: undefined,
	mobileAnnouncementChannelId: undefined,
	reviewChannelId: undefined,
	requireConfirmation: false,
	checkIntervalMinutes: 30,
	useComponentsV2: true,
	mentionRoleId: '',
	mobileMentionRoleId: undefined,
	reviewMentionRoleId: undefined,
	splitDesktopMobile: false,
	embedColor: '#85ce4b',
	includePrice: true,
	includeImage: true,
	includeFooter: true,
	includeCheckout: true,
	includeClaimGame: true,
}

export function loadBotCredentials(): BotCredentials {
	return {
		discordToken: process.env.DISCORD_BOT_TOKEN || '',
		clientId: process.env.DISCORD_CLIENT_ID || '',
	}
}

export interface BotState {
	lastPostedOfferIds: string[]
	lastCheckTimestamp: string
	settings: BotPersistentSettings
	guildSettings?: Record<string, BotPersistentSettings>
}

const STATE_FILE_PATH = path.resolve(
	process.cwd(),
	'bot',
	'data',
	'bot-state.json',
)

export function loadBotState(): BotState {
	try {
		if (fs.existsSync(STATE_FILE_PATH)) {
			const data = fs.readFileSync(STATE_FILE_PATH, 'utf8')
			const parsed = JSON.parse(data)
			return {
				lastPostedOfferIds: Array.isArray(parsed.lastPostedOfferIds)
					? parsed.lastPostedOfferIds
					: [],
				lastCheckTimestamp: parsed.lastCheckTimestamp || new Date(0).toISOString(),
				settings: {
					...DEFAULT_BOT_SETTINGS,
					...(parsed.settings || {}),
				},
				guildSettings: parsed.guildSettings || {},
			}
		}
	} catch (error) {
		console.error('[BotState] Error loading state file:', error)
	}

	return {
		lastPostedOfferIds: [],
		lastCheckTimestamp: new Date(0).toISOString(),
		settings: { ...DEFAULT_BOT_SETTINGS },
		guildSettings: {},
	}
}

export function saveBotState(state: BotState): void {
	try {
		const dir = path.dirname(STATE_FILE_PATH)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8')
	} catch (error) {
		console.error('[BotState] Error saving state file:', error)
	}
}

export function getGuildSettings(
	guildId: string | null | undefined,
): BotPersistentSettings {
	const state = loadBotState()
	if (!guildId) {
		return state.settings
	}
	if (!state.guildSettings) {
		state.guildSettings = {}
	}
	if (!state.guildSettings[guildId]) {
		state.guildSettings[guildId] = {
			...DEFAULT_BOT_SETTINGS,
			...(state.settings || {}),
		}
		saveBotState(state)
	}
	return {
		...DEFAULT_BOT_SETTINGS,
		...state.guildSettings[guildId],
	}
}

export function updateGuildSettings(
	guildId: string | null | undefined,
	partial: Partial<BotPersistentSettings>,
): BotPersistentSettings {
	const state = loadBotState()
	if (!guildId) {
		state.settings = {
			...state.settings,
			...partial,
		}
		saveBotState(state)
		return state.settings
	}

	if (!state.guildSettings) {
		state.guildSettings = {}
	}

	state.guildSettings[guildId] = {
		...DEFAULT_BOT_SETTINGS,
		...(state.guildSettings[guildId] || state.settings || {}),
		...partial,
	}

	saveBotState(state)
	return state.guildSettings[guildId]
}

export function resetGuildSettings(
	guildId: string | null | undefined,
): BotPersistentSettings {
	const state = loadBotState()
	if (!guildId) {
		state.settings = { ...DEFAULT_BOT_SETTINGS }
		saveBotState(state)
		return state.settings
	}

	if (!state.guildSettings) {
		state.guildSettings = {}
	}
	state.guildSettings[guildId] = { ...DEFAULT_BOT_SETTINGS }
	saveBotState(state)
	return state.guildSettings[guildId]
}

export function updateBotSettings(
	partial: Partial<BotPersistentSettings>,
): BotPersistentSettings {
	return updateGuildSettings(null, partial)
}

export function resetBotSettings(): BotPersistentSettings {
	return resetGuildSettings(null)
}
