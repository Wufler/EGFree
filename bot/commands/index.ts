import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	REST,
	Routes,
	type Client,
	type ChatInputCommandInteraction,
} from 'discord.js'
import { handleOffersCommand } from './offers'
import { handleSettingsCommand } from './settings'
import type { OfferSchedulerService } from '../services/schedulerService'
import type { BotCredentials } from '../state'

export async function registerSlashCommands(
	credentials: BotCredentials,
	client: Client,
): Promise<void> {
	if (!credentials.clientId) {
		console.warn(
			'[EGFree] DISCORD_CLIENT_ID not set. Skipping automatic slash command registration.',
		)
		return
	}

	const commands = [
		new SlashCommandBuilder()
			.setName('offers')
			.setDescription('Manage Epic Games free offers')
			.addSubcommand(sub =>
				sub
					.setName('check')
					.setDescription('Check current and upcoming free Epic Games offers'),
			)
			.addSubcommand(sub =>
				sub
					.setName('post')
					.setDescription('Publish offers or request review')
					.addBooleanOption(option =>
						option
							.setName('upcoming')
							.setDescription('Include upcoming free games')
							.setRequired(false),
					)
					.addBooleanOption(option =>
						option
							.setName('force')
							.setDescription('Post even if already posted before')
							.setRequired(false),
					)
					.addBooleanOption(option =>
						option
							.setName('confirm')
							.setDescription('Require approval buttons before posting')
							.setRequired(false),
					),
			),

		new SlashCommandBuilder()
			.setName('settings')
			.setDescription(
				'Open interactive control panel to configure all bot settings',
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	].map(cmd => cmd.toJSON())

	const rest = new REST({ version: '10' }).setToken(credentials.discordToken)

	try {
		console.log('[EGFree] Registering slash commands...')
		const guilds = await client.guilds.fetch()
		if (guilds.size > 0) {
			for (const [guildId, guild] of guilds) {
				try {
					await rest.put(
						Routes.applicationGuildCommands(credentials.clientId, guildId),
						{ body: commands },
					)
					console.log(
						`[EGFree] Registered slash commands for guild: ${guild.name || guildId}`,
					)
				} catch (guildErr) {
					console.warn(
						`[EGFree] Could not register guild commands for ${guildId}, registering globally instead:`,
						guildErr,
					)
					await rest.put(Routes.applicationCommands(credentials.clientId), {
						body: commands,
					})
				}
			}
		} else {
			await rest.put(Routes.applicationCommands(credentials.clientId), {
				body: commands,
			})
			console.log('[EGFree] Registered global application commands.')
		}
	} catch (error) {
		console.error('[EGFree] Failed to register slash commands:', error)
	}
}

export async function handleChatInputCommand(
	interaction: ChatInputCommandInteraction,
	scheduler: OfferSchedulerService,
	credentials: BotCredentials,
): Promise<void> {
	if (interaction.commandName === 'offers') {
		await handleOffersCommand(interaction, scheduler, credentials)
	} else if (interaction.commandName === 'settings') {
		await handleSettingsCommand(interaction, credentials)
	}
}
