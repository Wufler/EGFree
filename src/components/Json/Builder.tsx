'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { FileJson2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { generateJsonPayload } from '@/lib/jsonBuilder'
import { getEffectiveGames, getMobileGameKey, mergeMobile } from '@/lib/utils'
import JsonFormContent from './FormContent'
import JsonPreviewContent, { JsonPreviewButtons } from './PreviewContent'

const defaultColor = '#85ce4b'
const defaultContent = '<@&847939354978811924>'

type PlatformChoice = 'both' | 'ios' | 'android'
type EnteredPlatform = 'ios' | 'android'

type ParseGameResponse = {
	gameData: MobileGameDataLocal
	discordPayload: object
	enteredPlatform: EnteredPlatform | null
	error?: string
}

export default function Json({
	games,
	mobile,
}: {
	games: Game
	mobile: MobileGameData[]
}) {
	const [jsonData, setJsonData] = useState({})
	const [webhookUrl, setWebhookUrl] = useState('')
	const [messageId, setMessageId] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [showWarning, setShowWarning] = useState(false)
	const [checkoutLink, setCheckoutLink] = useState('')
	const [mobileUrl, setMobileUrl] = useState('')
	const [isMobileLoading, setIsMobileLoading] = useState(false)
	const [parsedMobileGames, setParsedMobileGames] = useState<
		MobileGameDataLocal[]
	>([])
	const [pendingMobileGame, setPendingMobileGame] =
		useState<MobileGameDataLocal | null>(null)
	const [pendingPlatform, setPendingPlatform] = useState<EnteredPlatform | null>(
		null,
	)
	const [existingGameForCombine, setExistingGameForCombine] =
		useState<MobileGameDataLocal | null>(null)
	const [isPlatformPromptOpen, setIsPlatformPromptOpen] = useState(false)

	const allMobileGames = useMemo(
		() => mergeMobile(mobile, parsedMobileGames),
		[mobile, parsedMobileGames],
	)
	const effectiveGames = useMemo(() => getEffectiveGames(games), [games])

	const storedMobileGameKeys = useMemo(
		() => new Set(parsedMobileGames.map(g => getMobileGameKey(g))),
		[parsedMobileGames],
	)

	const [settings, setSettings] = useState<EgFreeSettings>({
		selectedGames: {},
		embedContent: '',
		embedColor: defaultColor,
		includeFooter: true,
		includePrice: true,
		includeImage: true,
		includeCheckout: true,
		includeClaimGame: true,
		webhookUrl: '',
		webhookName: undefined,
		webhookAvatar: undefined,
		showDiscordPreview: true,
		openAccordions: [],
	})

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const storedMobile = localStorage.getItem('parsedMobileGames')
			const mobileParsed: MobileGameDataLocal[] = storedMobile
				? JSON.parse(storedMobile)
				: []
			const storedList = Array.isArray(mobileParsed) ? mobileParsed : []
			setParsedMobileGames(storedList)
			const mergedMobile = mergeMobile(mobile, storedList)

			const loadSettings = async () => {
				const savedSettings = localStorage.getItem('egFreeSettings')
				if (savedSettings) {
					try {
						const parsed = JSON.parse(savedSettings)
						const decryptedWebhook = parsed.webhookUrl
							? await decrypt(parsed.webhookUrl)
							: ''

						const validGameIds = new Set([
							...effectiveGames.currentGames.map(game => game.id),
							...effectiveGames.nextGames.map(game => game.id),
						])

						const cleanedSelectedGames: Record<string, boolean> = {}
						Object.entries(parsed.selectedGames || {}).forEach(
							([gameId, isSelected]) => {
								if (validGameIds.has(gameId)) {
									cleanedSelectedGames[gameId] = isSelected as boolean
								} else if (gameId.startsWith('mobile-')) {
									const mobileExists = mergedMobile.some(
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
						mergedMobile.forEach(game => {
							const key = getMobileGameKey(game)
							if (cleanedSelectedGames[key] === undefined) {
								cleanedSelectedGames[key] = true
							}
						})

						setSettings({
							...parsed,
							selectedGames: cleanedSelectedGames,
							webhookUrl: decryptedWebhook,
							webhookName: parsed.webhookName,
							webhookAvatar: parsed.webhookAvatar,
							messageId: '',
							checkoutLink: '',
							openAccordions: parsed.openAccordions || [],
						})
						setWebhookUrl(decryptedWebhook)
						setMessageId('')
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
					mergedMobile.forEach(game => {
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
					const settingsToSave = {
						...settings,
						webhookUrl: encryptedWebhook,
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

	const updateSetting = <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => {
		setSettings(prev => ({ ...prev, [key]: value }))
	}

	const closePlatformPrompt = () => {
		setIsPlatformPromptOpen(false)
		setPendingMobileGame(null)
		setPendingPlatform(null)
		setExistingGameForCombine(null)
	}

	const applyPlatformChoice = (choice: PlatformChoice) => {
		if (!pendingMobileGame) return
		const filteredGameData: MobileGameDataLocal = {
			...pendingMobileGame,
			iosOffer: choice === 'android' ? null : pendingMobileGame.iosOffer,
			androidOffer: choice === 'ios' ? null : pendingMobileGame.androidOffer,
		}
		addParsedGameToStorage(filteredGameData)
		setMobileUrl('')
		closePlatformPrompt()
	}

	const applyCombineChoice = (choice: 'combine' | 'separate') => {
		if (!pendingMobileGame || !existingGameForCombine || !pendingPlatform) return
		if (choice === 'combine') {
			const merged: MobileGameDataLocal = {
				...existingGameForCombine,
				iosOffer: existingGameForCombine.iosOffer ?? pendingMobileGame.iosOffer,
				androidOffer:
					existingGameForCombine.androidOffer ?? pendingMobileGame.androidOffer,
			}
			addParsedGameToStorage(merged)
		} else {
			const filtered: MobileGameDataLocal = {
				...pendingMobileGame,
				iosOffer: pendingPlatform === 'android' ? null : pendingMobileGame.iosOffer,
				androidOffer:
					pendingPlatform === 'ios' ? null : pendingMobileGame.androidOffer,
			}
			addParsedGameToStorage(filtered)
		}
		setMobileUrl('')
		closePlatformPrompt()
	}

	const handleMobileParseResponse = (data: ParseGameResponse) => {
		const existing = allMobileGames.find(
			g =>
				g.namespace === data.gameData.namespace && g.title === data.gameData.title,
		)
		const enteredPlatform = data.enteredPlatform
		const hasBothInParse = Boolean(
			data.gameData.iosOffer && data.gameData.androidOffer,
		)
		const existingMissingPlatform =
			existing &&
			enteredPlatform &&
			((enteredPlatform === 'ios' && !existing.iosOffer) ||
				(enteredPlatform === 'android' && !existing.androidOffer)) &&
			(enteredPlatform === 'ios'
				? data.gameData.iosOffer
				: data.gameData.androidOffer)

		if (existingMissingPlatform) {
			setPendingMobileGame(data.gameData)
			setPendingPlatform(enteredPlatform)
			setExistingGameForCombine(existing)
			setIsPlatformPromptOpen(true)
			return
		}
		if (hasBothInParse && enteredPlatform) {
			setPendingMobileGame(data.gameData)
			setPendingPlatform(enteredPlatform)
			setExistingGameForCombine(null)
			setIsPlatformPromptOpen(true)
			return
		}
		addParsedGameToStorage(data.gameData)
		setMobileUrl('')
	}

	const handleAccordionChange = (value: string[]) => {
		updateSetting('openAccordions', value)
	}

	const handleColorChange = (color: string) => {
		updateSetting('embedColor', color === defaultColor ? defaultColor : color)
	}

	useEffect(() => {
		setJsonData(
			generateJsonPayload(effectiveGames, settings, checkoutLink, allMobileGames),
		)
	}, [effectiveGames, settings, checkoutLink, allMobileGames])

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
			/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+\/?$/
		return webhookPattern.test(url.trim())
	}

	const handleWebhook = async () => {
		if (!webhookUrl) {
			toast.error('Insert a webhook.')
			return
		}

		if (!isValidDiscordWebhook(webhookUrl)) {
			toast.error('Invalid Discord webhook URL format.')
			return
		}

		if (!showWarning) {
			setShowWarning(true)
			setTimeout(() => setShowWarning(false), 3000)
			return
		}

		try {
			setIsLoading(true)
			setShowWarning(false)
			const response = await fetch('/api/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ webhookUrl, jsonData, messageId }),
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

	const fetchWebhookInfo = async (url: string) => {
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
				updateSetting('webhookName', webhookInfo.name)
				updateSetting('webhookAvatar', webhookInfo.avatar)
			} else {
				const errorText = await response.text()
				console.error('Failed to fetch webhook info:', errorText)
				updateSetting('webhookName', undefined)
				updateSetting('webhookAvatar', undefined)
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

	const addParsedGameToStorage = (gameData: MobileGameDataLocal) => {
		if (typeof window === 'undefined') return
		try {
			const stored = localStorage.getItem('parsedMobileGames')
			const parsed: MobileGameDataLocal[] = stored ? JSON.parse(stored) : []
			const newKey = getMobileGameKey(gameData)
			const filtered = parsed.filter(item => getMobileGameKey(item) !== newKey)
			const updated = [gameData, ...filtered]
			localStorage.setItem('parsedMobileGames', JSON.stringify(updated))
			setParsedMobileGames(updated)
			window.dispatchEvent(new Event('parsedMobileGamesUpdated'))

			updateSetting('selectedGames', {
				...settings.selectedGames,
				[newKey]: true,
			})
		} catch (error) {
			console.error('Failed to store parsed game:', error)
		}
	}

	const removeParsedGame = (gameData: MobileGameDataLocal) => {
		if (typeof window === 'undefined') return
		try {
			const removeKey = getMobileGameKey(gameData)
			const stored = localStorage.getItem('parsedMobileGames')
			const parsed: MobileGameDataLocal[] = stored ? JSON.parse(stored) : []
			const wasInStored = parsed.some(
				item => getMobileGameKey(item) === removeKey,
			)
			if (wasInStored) {
				const filtered = parsed.filter(
					item => getMobileGameKey(item) !== removeKey,
				)
				localStorage.setItem('parsedMobileGames', JSON.stringify(filtered))
				setParsedMobileGames(filtered)
				window.dispatchEvent(new Event('parsedMobileGamesUpdated'))
			}

			const newSelected = { ...settings.selectedGames }
			delete newSelected[removeKey]
			updateSetting('selectedGames', newSelected)
		} catch (error) {
			console.error('Failed to remove parsed game:', error)
		}
	}

	const parseMobileGame = async () => {
		if (!mobileUrl.trim()) {
			toast.error('Please enter a URL')
			return
		}

		setIsMobileLoading(true)
		closePlatformPrompt()

		try {
			const response = await fetch('/api/parse-game', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: mobileUrl.trim() }),
			})

			const data = (await response.json()) as ParseGameResponse

			if (!response.ok) {
				throw new Error(data.error || 'Failed to parse game')
			}

			handleMobileParseResponse(data)
			toast.success(`Parsed: ${data.gameData.title}`)
		} catch (error) {
			console.error('Parse error:', error)
			toast.error(error instanceof Error ? error.message : 'Failed to parse game')
		} finally {
			setIsMobileLoading(false)
		}
	}

	const handleMobilePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setMobileUrl(text)
			if (text.trim()) {
				setIsMobileLoading(true)
				closePlatformPrompt()
				try {
					const response = await fetch('/api/parse-game', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ url: text.trim() }),
					})
					const data = (await response.json()) as ParseGameResponse
					if (response.ok) {
						handleMobileParseResponse(data)
						toast.success(`Parsed: ${data.gameData.title}`)
					} else {
						throw new Error(data.error)
					}
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : 'Failed to parse game',
					)
				} finally {
					setIsMobileLoading(false)
				}
			}
		} catch {
			toast.error('Failed to read clipboard')
		}
	}

	const formProps = {
		games: effectiveGames,
		settings,
		parsedMobileGames: allMobileGames,
		storedMobileGameKeys,
		webhookUrl,
		setWebhookUrl,
		messageId,
		setMessageId,
		checkoutLink,
		setCheckoutLink,
		mobileUrl,
		setMobileUrl,
		isVisible,
		setIsVisible,
		isLoading,
		showWarning,
		isMobileLoading,
		updateSetting,
		handleAccordionChange,
		handleColorChange,
		handleWebhook,
		handlePaste,
		parseMobileGame,
		handleMobilePaste,
		removeParsedGame,
		isValidDiscordWebhook,
		debouncedFetchWebhookInfo,
		fetchWebhookInfo,
		defaultContent,
	}

	const previewProps = {
		jsonData,
		settings,
		updateSetting,
		copyToClipboard,
		isCopied,
		games: effectiveGames,
		checkoutLink,
		parsedMobileGames: allMobileGames,
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
				className="max-w-4xl! overflow-hidden p-0"
			>
				<AlertDialog
					open={isPlatformPromptOpen}
					onOpenChange={open => {
						if (!open) closePlatformPrompt()
					}}
				>
					<AlertDialogContent className="z-70">
						<AlertDialogHeader>
							<AlertDialogTitle>
								{existingGameForCombine ? 'Combine or separate' : 'Mobile link options'}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{existingGameForCombine ? (
									<>
										Existing {existingGameForCombine.title} has only{' '}
										{existingGameForCombine.iosOffer ? 'iOS' : 'Android'}. Add{' '}
										{pendingPlatform === 'ios' ? 'iOS' : 'Android'} to combine, or replace
										with {pendingPlatform === 'ios' ? 'iOS' : 'Android'} only.
									</>
								) : (
									<>
										Choose whether to include both platforms or only the{' '}
										{pendingPlatform === 'ios' ? 'iOS' : 'Android'} link you entered.
									</>
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							{existingGameForCombine ? (
								<>
									<AlertDialogAction onClick={() => applyCombineChoice('separate')}>
										Separate ({pendingPlatform === 'ios' ? 'iOS' : 'Android'} only)
									</AlertDialogAction>
									<AlertDialogAction onClick={() => applyCombineChoice('combine')}>
										Combine with existing
									</AlertDialogAction>
								</>
							) : (
								<>
									<AlertDialogAction onClick={() => applyPlatformChoice('both')}>
										Both iOS and Android
									</AlertDialogAction>
									<AlertDialogAction
										onClick={() =>
											applyPlatformChoice(pendingPlatform === 'ios' ? 'ios' : 'android')
										}
									>
										Only {pendingPlatform === 'ios' ? 'iOS' : 'Android'}
									</AlertDialogAction>
								</>
							)}
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				<div className="flex h-[90vh] flex-col lg:flex-row">
					<div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r flex flex-col">
						<div className="p-6 pb-4 lg:border-b shrink-0">
							<div className="flex items-center justify-between">
								<DialogTitle className="flex items-center gap-2">
									JSON Builder
								</DialogTitle>
								<DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
									<X className="size-4" />
									<span className="sr-only">Close</span>
								</DialogClose>
							</div>
							<DialogDescription className="mt-1.5">
								This tool is designed to create Discord embeds.
							</DialogDescription>
						</div>

						<div className="block lg:hidden">
							<Tabs defaultValue="settings" className="flex h-full flex-col min-h-0">
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
									<ScrollArea className="h-[calc(90vh-170px)]">
										<div className="p-4 pt-2">
											<JsonFormContent idSuffix="-mobile" {...formProps} />
										</div>
									</ScrollArea>
								</TabsContent>
								<TabsContent
									value="preview"
									className="overflow-hidden mt-0 pb-0 border-0 flex-1 min-h-0"
								>
									<ScrollArea className="h-[calc(90vh-170px)]">
										<JsonPreviewContent
											idSuffix="-mobile"
											inlineButtons
											{...previewProps}
										/>
									</ScrollArea>
								</TabsContent>
							</Tabs>
						</div>

						<div className="hidden lg:block overflow-hidden">
							<ScrollArea className="h-full">
								<div className="p-6">
									<JsonFormContent {...formProps} />
								</div>
							</ScrollArea>
						</div>
					</div>

					<div className="hidden lg:flex flex-col w-1/2">
						<div className="flex gap-2 p-3 shrink-0">
							<JsonPreviewButtons {...previewProps} />
						</div>
						<div className="overflow-hidden grow">
							<ScrollArea className="h-[calc(90vh-56px)]">
								<JsonPreviewContent inlineButtons={false} {...previewProps} />
							</ScrollArea>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
