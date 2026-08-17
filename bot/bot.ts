import { Client, type Interaction } from 'discord.js'
import {
	loadBotCredentials,
	loadBotState,
	getGuildSettings,
	type BotCredentials,
	type BotPersistentSettings,
} from './state'
import { OfferSchedulerService } from './services/schedulerService'
import { registerSlashCommands, handleChatInputCommand } from './commands'
import { handleInteraction } from './interactions'

export type {
	SettingsCategory,
	DiscordRawComponent,
	DiscordV2Payload,
} from './types'

export class DiscordOfferBot {
	public client: Client
	public credentials: BotCredentials
	public scheduler: OfferSchedulerService

	constructor() {
		this.credentials = loadBotCredentials()
		this.client = new Client({
			intents: ['Guilds', 'GuildMessages'],
		})
		this.scheduler = new OfferSchedulerService(this.client, this.credentials)

		this.setupEvents()
	}

	public get settings(): BotPersistentSettings {
		return loadBotState().settings
	}

	public getGuildSettings(
		guildId: string | null | undefined,
	): BotPersistentSettings {
		return getGuildSettings(guildId)
	}

	private setupEvents(): void {
		this.client.once('clientReady', async () => {
			console.log(`[EGFree] Logged in as ${this.client.user?.tag}!`)
			await registerSlashCommands(this.credentials, this.client)
			this.scheduler.start()
		})

		this.client.on('interactionCreate', async (interaction: Interaction) => {
			if (interaction.isChatInputCommand()) {
				await handleChatInputCommand(interaction, this.scheduler, this.credentials)
			} else {
				await handleInteraction(interaction, this.scheduler, this.credentials)
			}
		})
	}

	public async start(): Promise<void> {
		if (!this.credentials.discordToken) {
			console.error(
				'[EGFree] Missing DISCORD_BOT_TOKEN in environment (.env or .env.local). Please supply it to start the bot.',
			)
			process.exit(1)
		}
		await this.client.login(this.credentials.discordToken)
	}
}

async function main() {
	console.log('Starting EGFree...')
	const bot = new DiscordOfferBot()
	await bot.start()
}

main().catch(err => {
	console.error('Fatal error starting Discord bot:', err)
	process.exit(1)
})
