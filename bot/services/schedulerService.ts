import type { Client, TextChannel } from 'discord.js'
import { loadBotState, saveBotState, getGuildSettings } from '../state'
import {
	fetchCurrentOffers,
	generateOfferPayloads,
	type FetchedOffers,
} from './offerService'
import { dispatchDiscordPayload } from './discordService'
import { sendConfirmationPrompt } from '../ui/confirmationPrompt'
import type { BotCredentials } from '../state'

export function isThursdayDropWindow(now: Date = new Date()): {
	inWindow: boolean
	nextDropDate: Date
	description: string
} {
	const dayOfWeek = now.getUTCDay()
	const currentHour = now.getUTCHours()
	const currentMinute = now.getUTCMinutes()

	const isThursday = dayOfWeek === 4
	const inWindow = isThursday && currentHour >= 15

	const nextDrop = new Date(now)
	let daysUntilThursday = (4 - dayOfWeek + 7) % 7
	if (
		daysUntilThursday === 0 &&
		(currentHour > 15 || (currentHour === 15 && currentMinute > 5))
	) {
		daysUntilThursday = 7
	}
	nextDrop.setUTCDate(now.getUTCDate() + daysUntilThursday)
	nextDrop.setUTCHours(15, 0, 0, 0)

	const description = inWindow
		? '**Active Offer Window** (Checking frequently for mobile offers)'
		: `**Idle** (Next offer: <t:${Math.floor(nextDrop.getTime() / 1000)}:F>)`

	return { inWindow, nextDropDate: nextDrop, description }
}

export class OfferSchedulerService {
	private pollIntervalHandle: NodeJS.Timeout | null = null

	constructor(
		private client: Client,
		private credentials: BotCredentials,
	) {}

	public start(): void {
		if (this.pollIntervalHandle) {
			clearInterval(this.pollIntervalHandle)
		}

		console.log(
			`[EGFree] Offer scheduler started. Active on Thursdays at 15:00 UTC + catch-up window.`,
		)

		setTimeout(() => this.runOfferCheck(), 5000)

		this.pollIntervalHandle = setInterval(
			() => {
				const now = new Date()
				const { inWindow } = isThursdayDropWindow(now)
				const state = loadBotState()
				const lastCheckMs = state.lastCheckTimestamp
					? new Date(state.lastCheckTimestamp).getTime()
					: 0
				const timeSinceLastCheckMinutes = (Date.now() - lastCheckMs) / (60 * 1000)

				const thresholdMinutes = inWindow ? 15 : 360

				if (timeSinceLastCheckMinutes >= thresholdMinutes) {
					this.runOfferCheck()
				}
			},
			5 * 60 * 1000,
		)
	}

	public async broadcastOffers(
		offers: FetchedOffers,
		options: {
			includeUpcoming?: boolean
			onlyNew?: boolean
			guildId?: string | null
		} = {},
	): Promise<{ success: boolean; error?: string }> {
		const s = getGuildSettings(options.guildId)
		if (!s.announcementChannelId) {
			return {
				success: false,
				error:
					'Announcement channel is not configured. Run `/settings` in Discord first.',
			}
		}

		try {
			const desktopChannel = await this.client.channels.fetch(
				s.announcementChannelId,
			)
			if (!desktopChannel || !desktopChannel.isTextBased()) {
				return {
					success: false,
					error: 'Target announcement channel not found or not text-based.',
				}
			}

			let mobileChannel = desktopChannel as TextChannel
			if (
				s.mobileAnnouncementChannelId &&
				s.mobileAnnouncementChannelId !== s.announcementChannelId
			) {
				const fetchedMobile = await this.client.channels.fetch(
					s.mobileAnnouncementChannelId,
				)
				if (fetchedMobile && fetchedMobile.isTextBased()) {
					mobileChannel = fetchedMobile as TextChannel
				}
			}

			const shouldSplit =
				s.splitDesktopMobile || Boolean(s.mobileAnnouncementChannelId)
			const { desktopPayload, mobilePayload, combinedPayload } =
				generateOfferPayloads(
					offers,
					{ ...s, splitDesktopMobile: shouldSplit },
					options,
				)

			if (shouldSplit) {
				const shouldSendDesktop = options.onlyNew
					? offers.hasNewDesktopOffers
					: true
				const shouldSendMobile = options.onlyNew ? offers.hasNewMobileOffers : true

				if (
					shouldSendDesktop &&
					desktopPayload &&
					offers.effectiveGames.currentGames.length > 0
				) {
					await dispatchDiscordPayload(
						this.credentials.discordToken,
						desktopChannel as TextChannel,
						desktopPayload,
					)
				}
				if (
					shouldSendMobile &&
					mobilePayload &&
					offers.activeMobileGames.length > 0
				) {
					await dispatchDiscordPayload(
						this.credentials.discordToken,
						mobileChannel,
						mobilePayload,
					)
				}
			} else if (combinedPayload) {
				await dispatchDiscordPayload(
					this.credentials.discordToken,
					desktopChannel as TextChannel,
					combinedPayload,
				)
			}

			return { success: true }
		} catch (error) {
			console.error('[EGFree] Posting failed:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			}
		}
	}

	public async runOfferCheck(): Promise<void> {
		try {
			const now = new Date()
			const { inWindow } = isThursdayDropWindow(now)
			console.log(
				`[EGFree] Checking for Epic free games... (Window: ${inWindow ? 'Thursday Active' : 'Idle'})`,
			)

			const state = loadBotState()
			const offers = await fetchCurrentOffers(state.lastPostedOfferIds)

			state.lastCheckTimestamp = new Date().toISOString()
			saveBotState(state)

			if (!offers.hasNewOffers) {
				console.log('[EGFree] No new offers detected.')
				return
			}

			console.log(`[EGFree] New offers found: ${offers.titles.join(', ')}`)

			const guilds = await this.client.guilds.fetch()
			if (guilds.size === 0) {
				const s = getGuildSettings(null)
				if (s.requireConfirmation) {
					await sendConfirmationPrompt(
						this.client,
						this.credentials.discordToken,
						this.credentials.clientId,
						null,
						offers,
						{ guildId: null },
					)
				} else {
					await this.broadcastOffers(offers, { onlyNew: true, guildId: null })
				}
			} else {
				for (const [guildId] of guilds) {
					try {
						const s = getGuildSettings(guildId)
						if (s.requireConfirmation) {
							console.log(
								`[EGFree] [Guild ${guildId}] Requirement confirmation enabled. Sending prompt to review channel...`,
							)
							await sendConfirmationPrompt(
								this.client,
								this.credentials.discordToken,
								this.credentials.clientId,
								null,
								offers,
								{ guildId },
							)
						} else {
							console.log(
								`[EGFree] [Guild ${guildId}] Requirement confirmation disabled. Posting directly to announcement channel...`,
							)
							await this.broadcastOffers(offers, { onlyNew: true, guildId })
						}
					} catch (guildBroadcastErr) {
						console.error(
							`[EGFree] Error posting to guild ${guildId}:`,
							guildBroadcastErr,
						)
					}
				}
			}

			state.lastPostedOfferIds = offers.currentOfferIds
			saveBotState(state)
		} catch (error) {
			console.error('[EGFree] Error during scheduled offer check:', error)
		}
	}
}
