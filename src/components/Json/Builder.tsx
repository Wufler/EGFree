'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { FileJson2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { encrypt, decrypt } from '@/lib/encryption'
import { buildDiscordMessagePayload } from '@/lib/builder/payload'
import { getEffectiveGames, getMobileGameKey } from '@/lib/utils'
import JsonFormContent from '@/components/Json/FormContent'
import JsonPreviewContent, { JsonPreviewButtons } from '@/components/Json/PreviewContent'
const defaultColor = '#85ce4b'
const defaultContent = '<@&847939354978811924>'
const defaultMobileContent = '<@&1494404105471266936>'

export default function Json({
	games,
	mobile,
}: {
	games: Game
	mobile: MobileGameData[]
}) {
	const [jsonData, setJsonData] = useState({})
	const [webhookUrl, setWebhookUrl] = useState('')
	const [webhookUrlMobile, setWebhookUrlMobile] = useState('')
	const [messageId, setMessageId] = useState('')
	const [mobileMessageId, setMobileMessageId] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isMobileWebhookVisible, setIsMobileWebhookVisible] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [showWarning, setShowWarning] = useState(false)
	const [checkoutLink, setCheckoutLink] = useState('')

	const effectiveGames = useMemo(() => getEffectiveGames(games), [games])

	const [settings, setSettings] = useState<EgFreeSettings>({
		selectedGames: {},
		embedContent: '',
		embedContentMobile: '',
		splitDesktopMobile: false,
		sendDesktop: true,
		sendMobile: true,
		useDesktopWebhookForMobile: false,
		embedColor: defaultColor,
		includeFooter: true,
		includePrice: true,
		includeImage: true,
		includeCheckout: true,
		includeClaimGame: true,
		componentsV2: true,
		webhookUrl: '',
		webhookUrlMobile: '',
		webhookName: undefined,
		webhookAvatar: undefined,
		webhookNameMobile: undefined,
		webhookAvatarMobile: undefined,
		webhookChannelName: undefined,
		webhookChannelNameMobile: undefined,
		showDiscordPreview: true,
	})
	const activeMobileGames = useMemo(
		() => mobile.filter(game => game.promoEndDate && new Date(game.promoEndDate) > new Date()),
		[mobile],
	)
	const canSplitDesktopMobile = useMemo(() => {
		const hasSelectedDesktopGames = [...effectiveGames.currentGames, ...effectiveGames.nextGames].some(
			game => settings.selectedGames[game.id],
		)
		const hasSelectedMobileGames = activeMobileGames.some(game =>
			settings.selectedGames[getMobileGameKey(game)],
		)

		return hasSelectedDesktopGames && hasSelectedMobileGames
	}, [activeMobileGames, effectiveGames, settings.selectedGames])

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const loadSettings = async () => {
				const savedSettings = localStorage.getItem('egFreeSettings')
				if (savedSettings) {
					try {
						const parsed = JSON.parse(savedSettings) as Partial<EgFreeSettings> & {
							openAccordions?: string[]
						}
						const { openAccordions, ...parsedRest } = parsed
						void openAccordions
						const decryptedWebhook = parsedRest.webhookUrl
							? await decrypt(parsedRest.webhookUrl)
							: ''
						const decryptedMobileWebhook = parsedRest.webhookUrlMobile
							? await decrypt(parsedRest.webhookUrlMobile)
							: ''

						const validGameIds = new Set([
							...effectiveGames.currentGames.map(game => game.id),
							...effectiveGames.nextGames.map(game => game.id),
						])

						const cleanedSelectedGames: Record<string, boolean> = {}
						Object.entries(parsedRest.selectedGames || {}).forEach(
							([gameId, isSelected]) => {
								if (validGameIds.has(gameId)) {
									cleanedSelectedGames[gameId] = isSelected as boolean
								} else if (gameId.startsWith('mobile-')) {
									const mobileExists = mobile.some(
										g => getMobileGameKey(g) === gameId,
									)
									if (mobileExists) {
										cleanedSelectedGames[gameId] = isSelected as boolean
									}
								}
							},
						)

						effectiveGames.currentGames.forEach(game => {
							if (cleanedSelectedGames[game.id] === undefined) {
								cleanedSelectedGames[game.id] = true
							}
						})
						effectiveGames.nextGames.forEach(game => {
							if (cleanedSelectedGames[game.id] === undefined) {
								cleanedSelectedGames[game.id] = false
							}
						})
						mobile.forEach(game => {
							const key = getMobileGameKey(game)
							if (cleanedSelectedGames[key] === undefined) {
								cleanedSelectedGames[key] = true
							}
						})

						setSettings(prev => ({
							...prev,
							...parsedRest,
							selectedGames: cleanedSelectedGames,
							embedColor: parsedRest.embedColor ?? defaultColor,
							webhookUrl: decryptedWebhook,
							webhookUrlMobile: decryptedMobileWebhook,
							webhookName: parsedRest.webhookName,
							webhookAvatar: parsedRest.webhookAvatar,
							webhookNameMobile: parsedRest.webhookNameMobile,
							webhookAvatarMobile: parsedRest.webhookAvatarMobile,
							webhookChannelName: parsedRest.webhookChannelName,
							webhookChannelNameMobile: parsedRest.webhookChannelNameMobile,
							componentsV2: parsedRest.componentsV2 ?? true,
						}))
						setWebhookUrl(decryptedWebhook)
						setWebhookUrlMobile(decryptedMobileWebhook)
						setMessageId('')
						if (decryptedWebhook && isValidDiscordWebhook(decryptedWebhook)) {
							await fetchWebhookInfo(decryptedWebhook)
						}
						if (
							decryptedMobileWebhook &&
							isValidDiscordWebhook(decryptedMobileWebhook)
						) {
							await fetchWebhookInfo(decryptedMobileWebhook, 'mobile')
						}
					} catch (error) {
						console.error('Failed to load settings:', error)
					}
				} else {
					const initialSelectedGames: Record<string, boolean> = {}
					effectiveGames.currentGames.forEach(game => {
						initialSelectedGames[game.id] = true
					})
					effectiveGames.nextGames.forEach(game => {
						initialSelectedGames[game.id] = false
					})
					mobile.forEach(game => {
						initialSelectedGames[getMobileGameKey(game)] = true
					})
					setSettings(prev => ({
						...prev,
						selectedGames: initialSelectedGames,
					}))
				}
			}
			loadSettings()
		}
	}, [games, mobile, effectiveGames])

	useEffect(() => {
		const saveSettings = async () => {
			if (typeof window !== 'undefined') {
				try {
					const encryptedWebhook = settings.webhookUrl
						? await encrypt(settings.webhookUrl)
						: ''
					const encryptedMobileWebhook = settings.webhookUrlMobile
						? await encrypt(settings.webhookUrlMobile)
						: ''
					const settingsToSave = {
						...settings,
						webhookUrl: encryptedWebhook,
						webhookUrlMobile: encryptedMobileWebhook,
						checkoutLink,
					}
					localStorage.setItem('egFreeSettings', JSON.stringify(settingsToSave))
				} catch (error) {
					console.error('Failed to save settings:', error)
				}
			}
		}
		saveSettings()
	}, [settings, checkoutLink])

	useEffect(() => {
		if (!canSplitDesktopMobile && settings.splitDesktopMobile) {
			setMessageId('')
			setMobileMessageId('')
			setSettings(prev => ({ ...prev, splitDesktopMobile: false }))
		}
	}, [canSplitDesktopMobile, settings.splitDesktopMobile])

	const updateSetting = <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => {
		if (key === 'componentsV2' && settings.componentsV2 !== value) {
			setMessageId('')
		}
		setSettings(prev => ({ ...prev, [key]: value }))
	}

	const handleColorChange = (color: string) => {
		updateSetting('embedColor', color === defaultColor ? defaultColor : color)
	}

	useEffect(() => {
		setJsonData(
			buildDiscordMessagePayload(
				effectiveGames,
				settings,
				checkoutLink,
				mobile,
			),
		)
	}, [effectiveGames, settings, checkoutLink, mobile])

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 1000)
		} catch (err) {
			console.error('Failed to copy text: ', err)
			toast.error('Failed to copy JSON Data.')
		}
	}

	const isValidDiscordWebhook = (url: string) => {
		const webhookPattern =
			/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+(?:\?[^\s#]*)?\/?$/
		return webhookPattern.test(url.trim())
	}
	const canSendWebhook =
		settings.splitDesktopMobile && canSplitDesktopMobile
			? (!settings.sendDesktop || isValidDiscordWebhook(webhookUrl)) &&
				(!settings.sendMobile ||
					isValidDiscordWebhook(
						settings.useDesktopWebhookForMobile ? webhookUrl : webhookUrlMobile,
					))
			: isValidDiscordWebhook(webhookUrl)

	const handleWebhook = async () => {
		const desktopWebhookUrl = webhookUrl.trim()
		const mobileWebhookTargetUrl = (
			settings.useDesktopWebhookForMobile ? webhookUrl : webhookUrlMobile
		).trim()
		if (settings.splitDesktopMobile && canSplitDesktopMobile) {
			if (!settings.sendDesktop && !settings.sendMobile) {
				toast.error('Select at least desktop or mobile to send.')
				return
			}
			if (settings.sendDesktop && !isValidDiscordWebhook(desktopWebhookUrl)) {
				toast.error('Insert a valid desktop webhook URL.')
				return
			}
			if (settings.sendMobile && !isValidDiscordWebhook(mobileWebhookTargetUrl)) {
				toast.error('Insert a valid mobile webhook URL.')
				return
			}
		} else {
			if (!desktopWebhookUrl) {
				toast.error('Insert a webhook.')
				return
			}
			if (!isValidDiscordWebhook(desktopWebhookUrl)) {
				toast.error('Invalid Discord webhook URL format.')
				return
			}
		}

		if (!showWarning) {
			setShowWarning(true)
			setTimeout(() => setShowWarning(false), 3000)
			return
		}

		try {
			setIsLoading(true)
			setShowWarning(false)

			if (settings.splitDesktopMobile && canSplitDesktopMobile) {
				const desktopPayload = buildDiscordMessagePayload(
					effectiveGames,
					settings,
					checkoutLink,
					[],
				)
				const mobilePayload = buildDiscordMessagePayload(
					{ currentGames: [], nextGames: [] },
					{
						...settings,
						embedContent:
							settings.embedContentMobile || defaultMobileContent,
					},
					checkoutLink,
					mobile,
				)

				const sendOne = async (
					payload: object,
					targetWebhookUrl: string,
					msgId: string,
					label: string,
				): Promise<{ ok: boolean; messageId?: string; label: string }> => {
					const res = await fetch('/api/webhook', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							webhookUrl: targetWebhookUrl,
							jsonData: payload,
							messageId: msgId,
						}),
					})
					if (!res.ok) {
						return { ok: false, label }
					}
					const data = await res.json()
					return { ok: true, messageId: data.messageId, label }
				}

				if (settings.sendDesktop) {
					const deskRes = await sendOne(
						desktopPayload,
						desktopWebhookUrl,
						messageId,
						'desktop',
					)
					if (deskRes.ok) {
						if (!messageId && deskRes.messageId) setMessageId(deskRes.messageId)
						toast.success(
							messageId ? 'Desktop message updated.' : 'Desktop message sent.',
						)
					} else {
						toast.error('Failed to send desktop message.')
					}
				}

				if (settings.sendMobile) {
					const mobRes = await sendOne(
						mobilePayload,
						mobileWebhookTargetUrl,
						mobileMessageId,
						'mobile',
					)
					if (mobRes.ok) {
						if (!mobileMessageId && mobRes.messageId)
							setMobileMessageId(mobRes.messageId)
						toast.success(
							mobileMessageId ? 'Mobile message updated.' : 'Mobile message sent.',
						)
					} else {
						toast.error('Failed to send mobile message.')
					}
				}

				setIsLoading(false)
				return
			}

			const response = await fetch('/api/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					webhookUrl: desktopWebhookUrl,
					jsonData,
					messageId,
				}),
			})

			if (response.ok) {
				const responseData = await response.json()
				if (messageId) {
					toast.success('Successfully updated message.')
				} else {
					toast.success('Successfully sent data.')
					if (responseData.messageId) {
						setMessageId(responseData.messageId)
					}
				}
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to send JSON Data.')
			}
		} catch (error) {
			console.error('Failed to send:', error)
			toast.error('Failed to send JSON Data.', {
				description: 'The webhook or data might be invalid.',
			})
		}
		setIsLoading(false)
	}

	const fetchWebhookInfo = async (url: string, target: 'desktop' | 'mobile' = 'desktop') => {
		try {
			const response = await fetch('/api/webhook-info', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ webhookUrl: url }),
			})

			if (response.ok) {
				const webhookInfo = await response.json()
				if (target === 'mobile') {
					updateSetting('webhookNameMobile', webhookInfo.name)
					updateSetting('webhookAvatarMobile', webhookInfo.avatar)
					updateSetting('webhookChannelNameMobile', webhookInfo.channelName)
				} else {
					updateSetting('webhookName', webhookInfo.name)
					updateSetting('webhookAvatar', webhookInfo.avatar)
					updateSetting('webhookChannelName', webhookInfo.channelName)
				}
			} else {
				const errorText = await response.text()
				console.error('Failed to fetch webhook info:', errorText)
				if (target === 'mobile') {
					updateSetting('webhookNameMobile', undefined)
					updateSetting('webhookAvatarMobile', undefined)
					updateSetting('webhookChannelNameMobile', undefined)
				} else {
					updateSetting('webhookName', undefined)
					updateSetting('webhookAvatar', undefined)
					updateSetting('webhookChannelName', undefined)
				}
			}
		} catch (error) {
			console.error('Failed to fetch webhook info:', error)
		}
	}

	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const debouncedFetchWebhookInfo = (url: string) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}
		timeoutRef.current = setTimeout(() => {
			fetchWebhookInfo(url)
		}, 500)
	}

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrl(text)
			debouncedFetchWebhookInfo(text)
		} catch {
			console.error('Failed to paste text')
		}
	}
	const handlePasteMobile = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrlMobile(text)
			if (isValidDiscordWebhook(text)) {
				await fetchWebhookInfo(text, 'mobile')
			}
		} catch {
			console.error('Failed to paste mobile webhook text')
		}
	}

	const formProps = {
		games: effectiveGames,
		settings,
		parsedMobileGames: mobile,
		canSplitDesktopMobile,
		webhookUrl,
		setWebhookUrl,
		webhookUrlMobile,
		setWebhookUrlMobile,
		messageId,
		setMessageId,
		mobileMessageId,
		setMobileMessageId,
		checkoutLink,
		setCheckoutLink,
		isVisible,
		setIsVisible,
		isMobileWebhookVisible,
		setIsMobileWebhookVisible,
		isLoading,
		showWarning,
		updateSetting,
		handleColorChange,
		handleWebhook,
		handlePaste,
		handlePasteMobile,
		canSendWebhook,
		isValidDiscordWebhook,
		debouncedFetchWebhookInfo,
		fetchWebhookInfo,
		defaultContent,
		defaultMobileContent,
	}

	const previewProps = {
		jsonData,
		settings,
		updateSetting,
		copyToClipboard,
		isCopied,
		games: effectiveGames,
		checkoutLink,
		parsedMobileGames: mobile,
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="rounded-full">
					<FileJson2 className="size-5!" />
					JSON
				</Button>
			</DialogTrigger>
			<DialogContent
				onOpenAutoFocus={e => e.preventDefault()}
				hideCloseButton
				className="max-w-7xl! w-full max-h-[90vh] h-[90vh] overflow-hidden p-0 z-70 flex flex-col"
			>
				<div className="flex flex-col lg:flex-row flex-1 min-h-0">
					<div className="w-full lg:w-2/5 lg:min-w-0 lg:max-w-[520px] border-b lg:border-b-0 lg:border-r flex flex-col flex-1 lg:flex-none lg:shrink-0 min-h-0">
						<div className="px-6 py-5 lg:border-b shrink-0 bg-background flex flex-col gap-1.5 items-start justify-center relative z-10">
							<div className="flex w-full items-center justify-between">
								<DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
									<div className="flex items-center justify-center p-1.5 rounded-lg bg-primary/10 text-primary">
										<FileJson2 className="size-5" />
									</div>
									JSON Builder
								</DialogTitle>
								<DialogClose className="rounded-full bg-muted/40 p-2 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
									<X className="size-4" />
									<span className="sr-only">Close</span>
								</DialogClose>
							</div>
							<DialogDescription className="text-sm font-medium">
								Configure settings to customize your Discord embeds.
							</DialogDescription>
						</div>

						<div className="block lg:hidden flex-1 min-h-0">
							<Tabs defaultValue="settings" className="flex h-full flex-col min-h-0 gap-0">
								<TabsList className="w-full h-auto rounded-none border-b border-border bg-transparent p-0 shrink-0">
									<TabsTrigger
										value="settings"
										className="flex-1 relative rounded-none py-2.5 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
									>
										Settings
									</TabsTrigger>
									<TabsTrigger
										value="preview"
										className="flex-1 relative rounded-none py-2.5 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
									>
										Preview
									</TabsTrigger>
								</TabsList>
								<TabsContent
									value="settings"
									className="overflow-hidden mt-0 pb-0 border-0 flex-1 min-h-0"
								>
									<ScrollArea className="h-full">
										<JsonFormContent idSuffix="-mobile" {...formProps} />
									</ScrollArea>
								</TabsContent>
								<TabsContent
									value="preview"
									className="overflow-hidden mt-0 pb-0 border-0 flex-1 min-h-0"
								>
									<ScrollArea className="h-full">
										<JsonPreviewContent
											idSuffix="-mobile"
											inlineButtons
											{...previewProps}
										/>
									</ScrollArea>
								</TabsContent>
							</Tabs>
						</div>

						<div className="hidden lg:block overflow-hidden flex-1 min-h-0">
							<ScrollArea className="h-full">
								<JsonFormContent {...formProps} />
							</ScrollArea>
						</div>
					</div>

					<div className="hidden lg:flex flex-col flex-1 min-w-0 min-h-0 bg-muted/10 rounded-r-lg border-l border-border/50">
						<div className="flex justify-end gap-3 p-2 shrink-0 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10 w-full items-center">
							<JsonPreviewButtons {...previewProps} />
						</div>
						<div className="overflow-hidden grow min-h-0">
							<ScrollArea className="h-full border border-border/40 bg-background shadow-xs overflow-hidden">
								<JsonPreviewContent inlineButtons={false} {...previewProps} />
							</ScrollArea>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
