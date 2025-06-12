'use client'
import { useState, useEffect } from 'react'
import {
	ClipboardCopy,
	FileJson2,
	Send,
	Undo2,
	Clipboard,
	Check,
	Loader2,
	Save,
	ExternalLink,
	X,
	DollarSign,
	Image as ImageIcon,
	Clock,
	ShoppingCart,
	AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { encrypt, decrypt } from '@/lib/encryption'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import DiscordPreview from './Embed'
import { Checkbox } from './ui/checkbox'
import Discord from './ui/discord'
import Link from 'next/link'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'

const defaultColor = '#85ce4b'
const defaultContent = '<@&847939354978811924>'

export default function Json({ games }: { games: Game }) {
	const [jsonData, setJsonData] = useState({})
	const [webhookUrl, setWebhookUrl] = useState('')
	const [messageId, setMessageId] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [showWarning, setShowWarning] = useState(false)
	const [checkoutLink, setCheckoutLink] = useState('')
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
		showDiscordPreview: true,
		openAccordions: [],
	})

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const loadSettings = async () => {
				const savedSettings = localStorage.getItem('egFreeSettings')
				if (savedSettings) {
					try {
						const parsed = JSON.parse(savedSettings)
						const decryptedWebhook = parsed.webhookUrl
							? await decrypt(parsed.webhookUrl)
							: ''

						const validGameIds = new Set([
							...games.currentGames.map(game => game.id),
							...games.nextGames.map(game => game.id),
						])

						const cleanedSelectedGames: Record<string, boolean> = {}
						Object.entries(parsed.selectedGames || {}).forEach(
							([gameId, isSelected]) => {
								if (validGameIds.has(gameId)) {
									cleanedSelectedGames[gameId] = isSelected as boolean
								}
							}
						)

						games.currentGames.forEach(game => {
							if (cleanedSelectedGames[game.id] === undefined) {
								cleanedSelectedGames[game.id] = true
							}
						})
						games.nextGames.forEach(game => {
							if (cleanedSelectedGames[game.id] === undefined) {
								cleanedSelectedGames[game.id] = false
							}
						})

						setSettings({
							...parsed,
							selectedGames: cleanedSelectedGames,
							webhookUrl: decryptedWebhook,
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
					games.currentGames.forEach(game => {
						initialSelectedGames[game.id] = true
					})
					games.nextGames.forEach(game => {
						initialSelectedGames[game.id] = false
					})
					setSettings(prev => ({
						...prev,
						selectedGames: initialSelectedGames,
					}))
				}
			}
			loadSettings()
		}
	}, [games])

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
					}
					localStorage.setItem('egFreeSettings', JSON.stringify(settingsToSave))
				} catch (error) {
					console.error('Failed to save settings:', error)
				}
			}
		}
		saveSettings()
	}, [settings])

	const updateSetting = <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T]
	) => {
		setSettings(prev => ({ ...prev, [key]: value }))
	}

	const handleAccordionChange = (value: string[]) => {
		updateSetting('openAccordions', value)
	}

	const handleColorChange = (color: string) => {
		updateSetting('embedColor', color === defaultColor ? defaultColor : color)
	}

	const isCurrentlyFree = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage === 0 &&
				game.promotions?.promotionalOffers.length > 0
		)
	}

	const isPermanentlyFree = (game: GameItem) => {
		return game.price.totalPrice.originalPrice === 0
	}

	const isDiscountedGame = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage > 0 &&
				game.promotions?.promotionalOffers.length > 0
		)
	}

	const isUpcomingFree = (game: GameItem) => {
		return Boolean(
			game.promotions?.upcomingPromotionalOffers[0]?.promotionalOffers[0]
				?.discountSetting?.discountPercentage === 0
		)
	}

	useEffect(() => {
		const generateJson = () => {
			const selectedGames = [...games.currentGames, ...games.nextGames].filter(
				game => settings.selectedGames[game.id]
			)

			const mysteryGames = games.currentGames.some(
				game => game.seller?.name === 'Epic Dev Test Account'
			)

			const generateBulkCheckoutUrl = () => {
				if (mysteryGames) return null

				const offers = games.currentGames
					.map(game => {
						if (!game.namespace || !game.id) return null
						return `1-${game.namespace}-${game.id}-`
					})
					.filter(Boolean)

				if (offers.length === 0) return null

				const offersParam = offers.map(offer => `offers=${offer}`).join('&')
				return `https://store.epicgames.com/purchase?${offersParam}#/purchase/payment-methods`
			}

			const normalizeCheckoutUrl = (url: string) => {
				if (!url.trim()) return ''

				try {
					let fullUrl = url.trim()

					if (fullUrl.startsWith('/purchase')) {
						fullUrl = `https://store.epicgames.com${fullUrl}`
					} else if (!fullUrl.startsWith('http')) {
						fullUrl = `https://store.epicgames.com/${fullUrl}`
					}

					const urlObj = new URL(fullUrl)
					const offers = urlObj.searchParams.getAll('offers')

					if (offers.length === 0) return fullUrl

					const offersParam = offers.map(offer => `offers=${offer}`).join('&')
					return `https://store.epicgames.com/purchase?${offersParam}#/purchase/payment-methods`
				} catch {
					return url
				}
			}

			const bulkCheckoutUrl = generateBulkCheckoutUrl()
			const normalizedCheckoutLink = normalizeCheckoutUrl(checkoutLink)

			const embeds: DiscordEmbed[] = selectedGames.map((game: GameItem) => {
				const isCurrent = game.promotions.promotionalOffers.length > 0
				const dateInfo = isCurrent
					? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
					: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
							.startDate
				const endDate = new Date(dateInfo)
				const pageSlug =
					game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
				const isBundleGame = game.categories?.some(
					(category: { path: string }) => category.path === 'bundles'
				)
				const linkPrefix = isBundleGame ? 'bundles/' : 'p/'

				const getClaimText = (game: GameItem) =>
					game.offerType === 'ADD_ON'
						? 'Claim Add-on'
						: isBundleGame
						? 'Claim Bundle'
						: 'Claim Game'

				const getCheckoutUrl = (game: GameItem) => {
					if (!game.namespace || !game.id) return null
					const offerParam = `offers=1-${game.namespace}-${game.id}-`
					return `https://store.epicgames.com/purchase?${offerParam}#/purchase/payment-methods`
				}

				const description = isCurrent
					? game.title.toLowerCase().includes('mystery')
						? ''
						: `${
								settings.includePrice
									? isCurrentlyFree(game)
										? isPermanentlyFree(game)
											? `Free${
													settings.includeClaimGame
														? `\n[${getClaimText(
																game
														  )}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
														: ''
											  }`
											: `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**${
													settings.includeClaimGame
														? `\n[${getClaimText(game)}](${getCheckoutUrl(game)})`
														: ''
											  }`
										: isDiscountedGame(game)
										? `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **${game.price.totalPrice.fmtPrice.discountPrice}**\n[Store Page](https://store.epicgames.com/${linkPrefix}${pageSlug})`
										: `${game.price.totalPrice.fmtPrice.originalPrice}\n[${
												settings.includeClaimGame ? getClaimText(game) : 'Store Page'
										  }](https://store.epicgames.com/${linkPrefix}${pageSlug})`
									: ''
						  }`
					: game.title.toLowerCase().includes('mystery')
					? ''
					: `${
							settings.includePrice
								? isPermanentlyFree(game)
									? 'Free\n'
									: isUpcomingFree(game)
									? `${game.price.totalPrice.fmtPrice.originalPrice}\n`
									: `${game.price.totalPrice.fmtPrice.originalPrice}\n`
								: ''
					  }[Store Page](https://store.epicgames.com/${linkPrefix}${pageSlug})`

				const imageUrl = game.keyImages.find(
					(img: { type: string; url: string }) =>
						img.type === 'VaultClosed' ||
						img.type === 'DieselStoreFrontWide' ||
						img.type === 'OfferImageWide' ||
						img.type === 'DieselGameBoxWide'
				)?.url

				return {
					color: parseInt(settings.embedColor.replace('#', ''), 16),
					author: {
						name: 'Epic Games Store',
						url: 'https://free.wolfey.me/',
						icon_url: 'https://wolfey.s-ul.eu/YcyMXrI1',
					},
					title: game.title,
					url: `https://store.epicgames.com/${linkPrefix}${pageSlug}`,
					description,
					...(settings.includeFooter && {
						footer: {
							text: isCurrent ? 'Offer ends' : 'Offer starts',
						},
						timestamp: endDate.toISOString(),
					}),
					...(settings.includeImage &&
						imageUrl && { image: { url: encodeURI(imageUrl) } }),
				}
			})

			if (games.currentGames.length > 1 && settings.includeCheckout) {
				if (!mysteryGames || normalizedCheckoutLink) {
					const checkoutEmbed = {
						color: parseInt(settings.embedColor.replace('#', ''), 16),
						title: '🛒 Checkout Link',
						description: normalizedCheckoutLink
							? `[Claim All Games](${normalizedCheckoutLink})`
							: bulkCheckoutUrl
							? `[Claim All Games](${bulkCheckoutUrl})`
							: 'No claimable games available',
					}
					embeds.push(checkoutEmbed)
				}
			}

			setJsonData({
				content: settings.embedContent || defaultContent,
				embeds: embeds,
			})
		}

		generateJson()
	}, [games, settings, checkoutLink])

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

	const handleWebhook = async () => {
		if (!webhookUrl) {
			toast.error('Insert a webhook.')
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

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrl(text)
		} catch {
			console.error('Failed to paste text')
		}
	}

	const GameSelectionList = ({
		games,
		type,
	}: {
		games: GameItem[]
		type: string
	}) => {
		const allSelected = games.every(game => settings.selectedGames[game.id])

		const handleToggleAll = () => {
			const newSelectedGames = { ...settings.selectedGames }
			const shouldSelectAll = !allSelected

			games.forEach(game => {
				newSelectedGames[game.id] = shouldSelectAll
			})
			updateSetting('selectedGames', newSelectedGames)
		}

		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-sm font-medium">{type}</Label>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleToggleAll}
						className="h-6 px-2 text-xs"
					>
						{allSelected ? 'Deselect All' : 'Select All'}
					</Button>
				</div>
				{games.map(game => (
					<div
						key={game.id}
						className="relative flex w-full bg-background shadow-xs gap-2 rounded-md border border-input p-3 has-data-[state=checked]:border-primary/50 cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all"
					>
						<Checkbox
							id={game.id}
							checked={settings.selectedGames[game.id] ?? false}
							onCheckedChange={checked => {
								updateSetting('selectedGames', {
									...settings.selectedGames,
									[game.id]: checked as boolean,
								})
							}}
							className="order-1 after:absolute after:inset-0"
						/>
						<div className="grid grow gap-1">
							<Label htmlFor={game.id} className="cursor-pointer">
								{game.title}
							</Label>
						</div>
					</div>
				))}
			</div>
		)
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="rounded-full">
					<FileJson2 className="!size-5" />
					JSON
				</Button>
			</DialogTrigger>
			<DialogContent
				onOpenAutoFocus={e => e.preventDefault()}
				hideCloseButton
				className="!max-w-4xl overflow-hidden p-0"
			>
				<div className="flex h-[90vh] flex-col lg:flex-row">
					<div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r flex flex-col">
						<div className="p-6 pb-4 lg:border-b shrink-0">
							<div className="flex items-center justify-between">
								<DialogTitle className="flex items-center gap-2">
									JSON Builder
									<Link href="https://builder.wolfey.me">
										<ExternalLink className="size-4" />
									</Link>
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
							<Tabs defaultValue="settings" className="flex h-full flex-col">
								<TabsList className="w-full h-auto rounded-none border-b border-border bg-transparent p-0 shrink-0">
									<TabsTrigger
										value="settings"
										className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
									>
										Settings
									</TabsTrigger>
									<TabsTrigger
										value="preview"
										className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
									>
										Preview
									</TabsTrigger>
								</TabsList>
								<TabsContent
									value="settings"
									className="overflow-hidden mt-0 pb-0 border-0"
								>
									<ScrollArea className="h-[calc(90vh-150px)]">
										<div className="space-y-4 p-4 pt-2">
											<div className="space-y-3">
												<Label htmlFor="webhook-url" className="text-sm font-medium">
													Webhook URL
												</Label>
												<div className="flex items-center gap-2">
													<div className="flex-grow flex">
														<Input
															id="webhook-url"
															type={isVisible ? 'text' : 'password'}
															onFocus={() => setIsVisible(true)}
															onBlur={() => setIsVisible(false)}
															placeholder="https://"
															value={webhookUrl}
															onChange={e => setWebhookUrl(e.target.value)}
															className="rounded-r-none border-r-0 text-sm"
														/>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="outline"
																	size="icon"
																	className="px-2 rounded-none border-l-0 border-r-0 disabled:opacity-100 disabled:text-muted-foreground"
																	disabled={!webhookUrl.trim()}
																>
																	<Save className="size-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>Warning</AlertDialogTitle>
																	<AlertDialogDescription className="space-y-2" asChild>
																		<div>
																			<p>
																				This will encrypt and save your webhook in your browsers
																				local storage and will automatically be in the URL input.
																			</p>
																			<p className="font-medium">
																				⚠️ This might not be secure. Consider manually pasting the
																				webhook instead.
																			</p>
																		</div>
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel className="sm:w-1/2">
																		Cancel
																	</AlertDialogCancel>
																	<AlertDialogAction
																		className="dark:text-black sm:w-1/2"
																		onClick={() => {
																			updateSetting('webhookUrl', webhookUrl)
																			toast.success('Webhook saved locally')
																		}}
																	>
																		Save Anyway
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
														<Button
															variant="outline"
															size="icon"
															className="px-2 rounded-l-none border-l-0"
															onClick={handlePaste}
														>
															<Clipboard className="size-4" />
														</Button>
													</div>
												</div>
												<Button
													onClick={handleWebhook}
													className={`w-full ${
														showWarning
															? 'bg-yellow-500 hover:bg-yellow-600 text-black'
															: 'dark:text-black'
													}`}
													size="sm"
													disabled={isLoading}
												>
													{isLoading ? (
														<Loader2 className="size-4 animate-spin" />
													) : showWarning ? (
														<AlertTriangle className="size-4" />
													) : (
														<Send className="size-4" />
													)}
													{showWarning
														? 'Click again to confirm'
														: messageId
														? 'Edit Message'
														: 'Send'}
												</Button>
											</div>

											<div className="space-y-3">
												<div className="space-y-2">
													<Label htmlFor="message-content" className="text-sm font-medium">
														Message Content
													</Label>
													<div className="flex items-center gap-2">
														<Textarea
															id="message-content"
															placeholder={defaultContent}
															value={settings.embedContent}
															onChange={e => updateSetting('embedContent', e.target.value)}
															className="min-h-[38px] max-h-[100px] text-sm wrap-anywhere"
														/>
														<Button
															variant="outline"
															onClick={async () => {
																try {
																	const text = await navigator.clipboard.readText()
																	if (/^\d+$/.test(text)) {
																		updateSetting(
																			'embedContent',
																			`${settings.embedContent}<@&${text}>`
																		)
																	} else {
																		toast.error('Clipboard content must be a role ID')
																	}
																} catch (err) {
																	console.error('Failed to read clipboard:', err)
																	toast.error('Failed to read clipboard')
																}
															}}
														>
															@&
														</Button>
													</div>
												</div>
												<div className="space-y-2">
													<Label htmlFor="message-id" className="text-sm font-medium">
														Message ID
													</Label>
													<div className="flex items-center gap-2">
														<Input
															id="message-id"
															placeholder="Leave empty to send new message"
															value={messageId}
															onChange={e => {
																setMessageId(e.target.value)
															}}
															className="text-sm"
														/>
														<Button
															variant="outline"
															size="icon"
															onClick={async () => {
																try {
																	const text = await navigator.clipboard.readText()
																	if (/^\d+$/.test(text.trim())) {
																		setMessageId(text.trim())
																	} else {
																		toast.error('Message ID must contain only numbers')
																	}
																} catch (err) {
																	console.error('Failed to read clipboard:', err)
																	toast.error('Failed to read clipboard')
																}
															}}
														>
															<Clipboard className="size-4" />
														</Button>
													</div>
												</div>
											</div>

											<Accordion
												type="multiple"
												className="space-y-2"
												value={settings.openAccordions}
												onValueChange={handleAccordionChange}
											>
												{(games.currentGames.length > 0 || games.nextGames.length > 0) && (
													<AccordionItem value="game-visibility">
														<AccordionTrigger className="text-sm font-medium">
															Game Visibility
														</AccordionTrigger>
														<AccordionContent className="space-y-4 pt-2">
															{games.currentGames.length > 0 && (
																<GameSelectionList
																	games={games.currentGames}
																	type="💎 Free Now"
																/>
															)}
															{games.nextGames.length > 0 && (
																<GameSelectionList games={games.nextGames} type="📅 Upcoming" />
															)}
														</AccordionContent>
													</AccordionItem>
												)}

												<AccordionItem value="appearance">
													<AccordionTrigger className="text-sm font-medium">
														Appearance
													</AccordionTrigger>
													<AccordionContent className="space-y-3 pt-2">
														<div className="space-y-3">
															<div className="flex items-center justify-between">
																<Label className="text-sm font-medium">Options</Label>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => {
																		const allSelected =
																			settings.includePrice &&
																			settings.includeImage &&
																			settings.includeFooter &&
																			settings.includeCheckout &&
																			settings.includeClaimGame
																		const newValue = !allSelected
																		updateSetting('includePrice', newValue)
																		updateSetting('includeImage', newValue)
																		updateSetting('includeFooter', newValue)
																		updateSetting('includeCheckout', newValue)
																		updateSetting('includeClaimGame', newValue)
																	}}
																	className="h-6 px-2 text-xs"
																>
																	{settings.includePrice &&
																	settings.includeImage &&
																	settings.includeFooter &&
																	settings.includeCheckout &&
																	settings.includeClaimGame
																		? 'Deselect All'
																		: 'Select All'}
																</Button>
															</div>
															<div className="grid grid-cols-2 gap-3">
																<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
																	<div className="flex justify-between gap-2">
																		<Checkbox
																			id="include-price-mobile"
																			checked={settings.includePrice}
																			onCheckedChange={checked =>
																				updateSetting('includePrice', checked as boolean)
																			}
																			className="order-1 after:absolute after:inset-0"
																		/>
																		<DollarSign
																			className="opacity-60"
																			size={16}
																			aria-hidden="true"
																		/>
																	</div>
																	<Label htmlFor="include-price-mobile">Price</Label>
																</div>
																<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
																	<div className="flex justify-between gap-2">
																		<Checkbox
																			id="include-image-mobile"
																			checked={settings.includeImage}
																			onCheckedChange={checked =>
																				updateSetting('includeImage', checked as boolean)
																			}
																			className="order-1 after:absolute after:inset-0"
																		/>
																		<ImageIcon
																			className="opacity-60"
																			size={16}
																			aria-hidden="true"
																		/>
																	</div>
																	<Label htmlFor="include-image-mobile">Images</Label>
																</div>
																<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
																	<div className="flex justify-between gap-2">
																		<Checkbox
																			id="include-footer-mobile"
																			checked={settings.includeFooter}
																			onCheckedChange={checked =>
																				updateSetting('includeFooter', checked as boolean)
																			}
																			className="order-1 after:absolute after:inset-0"
																		/>
																		<Clock className="opacity-60" size={16} aria-hidden="true" />
																	</div>
																	<Label htmlFor="include-footer-mobile">Footer</Label>
																</div>
																<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
																	<div className="flex justify-between gap-2">
																		<Checkbox
																			id="include-checkout-mobile"
																			checked={settings.includeCheckout}
																			onCheckedChange={checked =>
																				updateSetting('includeCheckout', checked as boolean)
																			}
																			className="order-1 after:absolute after:inset-0"
																			disabled={games.currentGames.length <= 1}
																		/>
																		<ShoppingCart
																			className="opacity-60"
																			size={16}
																			aria-hidden="true"
																		/>
																	</div>
																	<Label htmlFor="include-checkout-mobile">Checkout</Label>
																</div>
															</div>
															<div className="flex items-center justify-end gap-2">
																<Label htmlFor="include-claim" className="text-sm">
																	Claim Links
																</Label>
																<Checkbox
																	id="include-claim"
																	checked={settings.includeClaimGame}
																	onCheckedChange={checked =>
																		updateSetting('includeClaimGame', checked as boolean)
																	}
																/>
															</div>
															{settings.includeCheckout && games.currentGames.length > 1 && (
																<div className="space-y-2">
																	<div className="flex items-center justify-between">
																		<Label
																			htmlFor="checkout-link"
																			className="text-sm font-medium"
																		>
																			Manual Checkout Link
																		</Label>
																	</div>
																	<Textarea
																		id="checkout-link"
																		placeholder="https://store.epicgames.com/purchase?offers=1-{namespace}-{id}-#/purchase/payment-methods"
																		value={checkoutLink}
																		onChange={e => setCheckoutLink(e.target.value)}
																		className="max-h-[100px] text-sm wrap-anywhere"
																	/>
																	<div className="flex items-center gap-1 text-xs text-muted-foreground">
																		<a
																			href="https://wolfey.s-ul.eu/D3RfQGJZ"
																			target="_blank"
																			className="text-xs text-blue-500 hover:underline flex items-center gap-1"
																		>
																			Image on how to get link <ExternalLink className="size-3" />
																		</a>
																		or leave empty to use automatic link
																	</div>
																</div>
															)}
														</div>

														<div className="space-y-3">
															<Label htmlFor="sidebar-color" className="text-sm font-medium">
																Sidebar Color
															</Label>
															<div className="flex items-center gap-2">
																<Popover>
																	<PopoverTrigger asChild>
																		<Button style={{ backgroundColor: settings.embedColor }} />
																	</PopoverTrigger>
																	<PopoverContent className="w-full p-3" align="start">
																		<HexColorPicker
																			color={settings.embedColor}
																			onChange={handleColorChange}
																			className="w-full mb-2"
																		/>
																		<Button
																			onClick={() => handleColorChange(defaultColor)}
																			variant="outline"
																			size="sm"
																			className="w-full"
																		>
																			<Undo2 className="size-4" />
																			Reset to Default
																		</Button>
																	</PopoverContent>
																</Popover>
																<Input
																	id="sidebar-color"
																	value={settings.embedColor}
																	onChange={e => handleColorChange(e.target.value)}
																	maxLength={7}
																	className="text-sm"
																/>
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										</div>
									</ScrollArea>
								</TabsContent>
								<TabsContent
									value="preview"
									className="overflow-hidden mt-0 pb-0 border-0"
								>
									<div className="overflow-hidden flex-grow">
										<ScrollArea className="h-[calc(90vh-8rem)]">
											<div className="space-y-4">
												<div className="flex lg:flex-row flex-col gap-2 px-4 pt-2">
													<Button
														onClick={copyToClipboard}
														className="w-full"
														variant="outline"
													>
														{isCopied ? (
															<Check className="size-4" />
														) : (
															<ClipboardCopy className="size-4" />
														)}
														Copy JSON
													</Button>
													<div className="relative w-full flex bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all items-center gap-2 rounded-md border border-input p-2.5">
														<Checkbox
															id="discord-mobile"
															checked={settings.showDiscordPreview}
															onCheckedChange={checked => {
																updateSetting('showDiscordPreview', checked as boolean)
															}}
															className="order-1 after:absolute after:inset-0"
														/>
														<div className="flex grow items-center gap-2">
															<Discord />
															<Label htmlFor="discord-mobile">Discord Preview</Label>
														</div>
													</div>
												</div>
												{settings.showDiscordPreview ? (
													<DiscordPreview
														games={games}
														settings={settings}
														checkoutLink={checkoutLink}
													/>
												) : (
													<pre className="bg-secondary text-secondary-foreground p-4 overflow-auto text-xs whitespace-pre-wrap break-all">
														{JSON.stringify(jsonData, null, 2)}
													</pre>
												)}
											</div>
										</ScrollArea>
									</div>
								</TabsContent>
							</Tabs>
						</div>

						<div className="hidden lg:block overflow-hidden">
							<ScrollArea className="h-full">
								<div className="space-y-4 p-6">
									<div className="space-y-3">
										<Label htmlFor="webhook-url" className="text-sm font-medium">
											Webhook URL
										</Label>
										<div className="flex items-center gap-2">
											<div className="flex-grow flex">
												<Input
													id="webhook-url"
													type={isVisible ? 'text' : 'password'}
													onFocus={() => setIsVisible(true)}
													onBlur={() => setIsVisible(false)}
													placeholder="https://"
													value={webhookUrl}
													onChange={e => setWebhookUrl(e.target.value)}
													className="rounded-r-none border-r-0 text-sm"
												/>

												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="outline"
															size="icon"
															className="px-2 rounded-none border-l-0 border-r-0 disabled:opacity-100 disabled:text-muted-foreground"
															disabled={!webhookUrl.trim()}
														>
															<Save className="size-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Warning</AlertDialogTitle>
															<AlertDialogDescription className="space-y-2" asChild>
																<div>
																	<p>
																		This will encrypt and save your webhook in your browsers local
																		storage and will automatically be in the URL input.
																	</p>
																	<p className="font-medium">
																		⚠️ This might not be secure. Consider manually pasting the
																		webhook instead.
																	</p>
																</div>
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel className="sm:w-1/2">
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																className="dark:text-black sm:w-1/2"
																onClick={() => {
																	updateSetting('webhookUrl', webhookUrl)
																	toast.success('Webhook saved locally')
																}}
															>
																Save Anyway
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
												<Button
													variant="outline"
													size="icon"
													className="px-2 rounded-l-none border-l-0"
													onClick={handlePaste}
												>
													<Clipboard className="size-4" />
												</Button>
											</div>
										</div>
										<Button
											onClick={handleWebhook}
											className={`w-full ${
												showWarning
													? 'bg-yellow-500 hover:bg-yellow-600 text-black'
													: 'dark:text-black'
											}`}
											disabled={isLoading}
										>
											{isLoading ? (
												<Loader2 className="size-4 animate-spin" />
											) : showWarning ? (
												<AlertTriangle className="size-4" />
											) : (
												<Send className="size-4" />
											)}
											{showWarning
												? 'Click again to confirm'
												: messageId
												? 'Edit Message'
												: 'Send'}
										</Button>
									</div>

									<div className="space-y-3">
										<div className="space-y-2">
											<Label htmlFor="message-content" className="text-sm font-medium">
												Message Content
											</Label>
											<div className="flex items-center gap-2">
												<Textarea
													id="message-content"
													placeholder={defaultContent}
													value={settings.embedContent}
													onChange={e => updateSetting('embedContent', e.target.value)}
													className="min-h-[38px] max-h-[100px] text-sm wrap-anywhere"
												/>
												<Button
													variant="outline"
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText()
															if (/^\d+$/.test(text)) {
																updateSetting(
																	'embedContent',
																	`${settings.embedContent}<@&${text}>`
																)
															} else {
																toast.error('Clipboard content must be a role ID')
															}
														} catch (err) {
															console.error('Failed to read clipboard:', err)
															toast.error('Failed to read clipboard')
														}
													}}
												>
													@&
												</Button>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="message-id" className="text-sm font-medium">
												Message ID
											</Label>
											<div className="flex items-center gap-2">
												<Input
													id="message-id"
													placeholder="Leave empty to send new message"
													value={messageId}
													onChange={e => {
														setMessageId(e.target.value)
													}}
													className="text-sm"
												/>
												<Button
													variant="outline"
													size="icon"
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText()
															if (/^\d+$/.test(text.trim())) {
																setMessageId(text.trim())
															} else {
																toast.error('Message ID must contain only numbers')
															}
														} catch (err) {
															console.error('Failed to read clipboard:', err)
															toast.error('Failed to read clipboard')
														}
													}}
												>
													<Clipboard className="size-4" />
												</Button>
											</div>
										</div>
									</div>

									<Accordion
										type="multiple"
										className="space-y-2"
										value={settings.openAccordions}
										onValueChange={handleAccordionChange}
									>
										{(games.currentGames.length > 0 || games.nextGames.length > 0) && (
											<AccordionItem value="game-visibility">
												<AccordionTrigger className="text-sm font-medium">
													Game Visibility
												</AccordionTrigger>
												<AccordionContent className="space-y-4 pt-2">
													{games.currentGames.length > 0 && (
														<GameSelectionList
															games={games.currentGames}
															type="💎 Free Now"
														/>
													)}
													{games.nextGames.length > 0 && (
														<GameSelectionList games={games.nextGames} type="📅 Upcoming" />
													)}
												</AccordionContent>
											</AccordionItem>
										)}

										<AccordionItem value="appearance">
											<AccordionTrigger className="text-sm font-medium">
												Appearance
											</AccordionTrigger>
											<AccordionContent className="space-y-3 pt-2">
												<div className="space-y-3">
													<div className="flex items-center justify-between">
														<Label className="text-sm font-medium">Options</Label>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																const allSelected =
																	settings.includePrice &&
																	settings.includeImage &&
																	settings.includeFooter &&
																	settings.includeCheckout &&
																	settings.includeClaimGame
																const newValue = !allSelected
																updateSetting('includePrice', newValue)
																updateSetting('includeImage', newValue)
																updateSetting('includeFooter', newValue)
																updateSetting('includeCheckout', newValue)
																updateSetting('includeClaimGame', newValue)
															}}
															className="h-6 px-2 text-xs"
														>
															{settings.includePrice &&
															settings.includeImage &&
															settings.includeFooter &&
															settings.includeCheckout &&
															settings.includeClaimGame
																? 'Deselect All'
																: 'Select All'}
														</Button>
													</div>
													<div className="grid grid-cols-2 gap-3">
														<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
															<div className="flex justify-between gap-2">
																<Checkbox
																	id="include-price"
																	checked={settings.includePrice}
																	onCheckedChange={checked =>
																		updateSetting('includePrice', checked as boolean)
																	}
																	className="order-1 after:absolute after:inset-0"
																/>
																<DollarSign
																	className="opacity-60"
																	size={16}
																	aria-hidden="true"
																/>
															</div>
															<Label htmlFor="include-price">Price</Label>
														</div>
														<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
															<div className="flex justify-between gap-2">
																<Checkbox
																	id="include-image"
																	checked={settings.includeImage}
																	onCheckedChange={checked =>
																		updateSetting('includeImage', checked as boolean)
																	}
																	className="order-1 after:absolute after:inset-0"
																/>
																<ImageIcon
																	className="opacity-60"
																	size={16}
																	aria-hidden="true"
																/>
															</div>
															<Label htmlFor="include-image">Images</Label>
														</div>
														<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
															<div className="flex justify-between gap-2">
																<Checkbox
																	id="include-footer"
																	checked={settings.includeFooter}
																	onCheckedChange={checked =>
																		updateSetting('includeFooter', checked as boolean)
																	}
																	className="order-1 after:absolute after:inset-0"
																/>
																<Clock className="opacity-60" size={16} aria-hidden="true" />
															</div>
															<Label htmlFor="include-footer">Footer</Label>
														</div>
														<div className="border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all">
															<div className="flex justify-between gap-2">
																<Checkbox
																	id="include-checkout"
																	checked={settings.includeCheckout}
																	onCheckedChange={checked =>
																		updateSetting('includeCheckout', checked as boolean)
																	}
																	className="order-1 after:absolute after:inset-0"
																	disabled={games.currentGames.length <= 1}
																/>
																<ShoppingCart
																	className="opacity-60"
																	size={16}
																	aria-hidden="true"
																/>
															</div>
															<Label htmlFor="include-checkout">Checkout</Label>
														</div>
													</div>
													<div className="flex items-center justify-end gap-2">
														<Label htmlFor="include-claim" className="text-sm">
															Claim Links
														</Label>
														<Checkbox
															id="include-claim"
															checked={settings.includeClaimGame}
															onCheckedChange={checked =>
																updateSetting('includeClaimGame', checked as boolean)
															}
														/>
													</div>
													{settings.includeCheckout && games.currentGames.length > 1 && (
														<div className="space-y-2">
															<div className="flex items-center justify-between">
																<Label htmlFor="checkout-link" className="text-sm font-medium">
																	Manual Checkout Link
																</Label>
															</div>
															<Textarea
																id="checkout-link"
																placeholder="https://store.epicgames.com/purchase?offers=1-{namespace}-{id}-#/purchase/payment-methods"
																value={checkoutLink}
																onChange={e => setCheckoutLink(e.target.value)}
																className="max-h-[100px] text-sm wrap-anywhere"
															/>
															<div className="flex items-center gap-1 text-xs text-muted-foreground">
																<a
																	href="https://wolfey.s-ul.eu/D3RfQGJZ"
																	target="_blank"
																	className="text-xs text-blue-500 hover:underline flex items-center gap-1"
																>
																	Image on how to get link <ExternalLink className="size-3" />
																</a>
																or leave empty to use automatic link
															</div>
														</div>
													)}
												</div>
												<div className="space-y-3">
													<Label htmlFor="sidebar-color" className="text-sm font-medium">
														Sidebar Color
													</Label>
													<div className="flex items-center gap-2">
														<Popover>
															<PopoverTrigger asChild>
																<Button style={{ backgroundColor: settings.embedColor }} />
															</PopoverTrigger>
															<PopoverContent className="w-full p-3" align="start">
																<HexColorPicker
																	color={settings.embedColor}
																	onChange={handleColorChange}
																	className="w-full mb-2"
																/>
																<Button
																	onClick={() => handleColorChange(defaultColor)}
																	variant="outline"
																	size="sm"
																	className="w-full px-8"
																>
																	<Undo2 className="size-4" />
																	Reset to Default
																</Button>
															</PopoverContent>
														</Popover>
														<Input
															id="sidebar-color"
															value={settings.embedColor}
															onChange={e => handleColorChange(e.target.value)}
															maxLength={7}
															className="font-mono"
														/>
													</div>
												</div>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								</div>
							</ScrollArea>
						</div>
					</div>

					<div className="hidden lg:flex flex-col w-1/2">
						<div className="flex gap-2 p-3 shrink-0">
							<Button onClick={copyToClipboard} className="w-1/2" variant="outline">
								{isCopied ? (
									<Check className="size-4" />
								) : (
									<ClipboardCopy className="size-4" />
								)}
								Copy JSON
							</Button>
							<div className="relative flex w-1/2 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all items-center gap-2 rounded-md border border-input p-2">
								<Checkbox
									id="discord"
									checked={settings.showDiscordPreview}
									onCheckedChange={checked => {
										updateSetting('showDiscordPreview', checked as boolean)
									}}
									className="order-1 after:absolute after:inset-0"
								/>
								<div className="flex grow items-center gap-2">
									<Discord />
									<Label htmlFor="discord">Discord Preview</Label>
								</div>
							</div>
						</div>
						<div className="overflow-hidden flex-grow">
							<ScrollArea className="h-[calc(90vh-56px)]">
								<div className="space-y-4">
									{settings.showDiscordPreview ? (
										<DiscordPreview
											games={games}
											settings={settings}
											checkoutLink={checkoutLink}
										/>
									) : (
										<pre className="bg-secondary text-secondary-foreground p-4 overflow-auto text-xs whitespace-pre-wrap break-all">
											{JSON.stringify(jsonData, null, 2)}
										</pre>
									)}
								</div>
							</ScrollArea>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
