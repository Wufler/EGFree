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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
	Dialog,
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
import DiscordPreview from './DiscordEmbed'
import { Checkbox } from './ui/checkbox'
import Discord from './ui/discord'

function Switches({
	id,
	checked,
	onCheckedChange,
	disabled,
	label,
}: {
	id: string
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	disabled?: boolean
	label: string
}) {
	return (
		<div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
			<Switch
				id={id}
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
				className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-2 rtl:[&_span]:data-[state=checked]:-translate-x-2"
			/>
			<div className="grid grow gap-2">
				<Label htmlFor={id}>{label}</Label>
			</div>
		</div>
	)
}

const defaultColor = '#85ce4b'
const defaultContent = '<@&847939354978811924>'

export default function Json({ games }: { games: Game }) {
	const [jsonData, setJsonData] = useState({})
	const [webhookUrl, setWebhookUrl] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [settings, setSettings] = useState<EgFreeSettings>({
		selectedGames: {},
		embedContent: '',
		embedColor: defaultColor,
		includeFooter: true,
		includePrice: true,
		includeImage: true,
		webhookUrl: '',
		showDiscordPreview: true,
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

						const initialSelectedGames: Record<string, boolean> = {
							...parsed.selectedGames,
						}
						games.currentGames.forEach(game => {
							if (initialSelectedGames[game.id] === undefined) {
								initialSelectedGames[game.id] = true
							}
						})
						games.nextGames.forEach(game => {
							if (initialSelectedGames[game.id] === undefined) {
								initialSelectedGames[game.id] = false
							}
						})

						setSettings({
							...parsed,
							selectedGames: initialSelectedGames,
							webhookUrl: decryptedWebhook,
						})
						setWebhookUrl(decryptedWebhook)
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

			const embeds = selectedGames.map((game: GameItem) => {
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

				const fieldValue = isCurrent
					? game.title.toLowerCase().includes('mystery')
						? ''
						: `${
								settings.includePrice
									? isCurrentlyFree(game)
										? isPermanentlyFree(game)
											? `Free\n[${getClaimText(
													game
											  )}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
											: `~~${
													game.price.totalPrice.fmtPrice.originalPrice
											  }~~ **Free**\n[${getClaimText(
													game
											  )}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
										: isDiscountedGame(game)
										? `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **${game.price.totalPrice.fmtPrice.discountPrice}**\n[Store Page](https://store.epicgames.com/${linkPrefix}${pageSlug})`
										: `${game.price.totalPrice.fmtPrice.originalPrice}\n[${getClaimText(
												game
										  )}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
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
						img.type === 'OfferImageWide'
				)?.url

				return {
					color: parseInt(settings.embedColor.replace('#', ''), 16),
					fields: [
						{
							name: game.title,
							value: fieldValue,
						},
					],
					author: {
						name: 'Epic Games Store',
						url: 'https://egfreegames.vercel.app/',
						icon_url: 'https://wolfey.s-ul.eu/YcyMXrI1',
					},
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

			setJsonData({
				content: settings.embedContent || defaultContent,
				embeds: embeds.length > 0 ? embeds : undefined,
			})
		}

		generateJson()
	}, [games, settings])

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

		try {
			setIsLoading(true)
			const response = await fetch('/api/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ webhookUrl, jsonData }),
			})

			if (response.ok) {
				toast.success('Successfully sent data.')
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
	}) => (
		<div className="space-y-2">
			<Label className="text-sm font-medium">{type}</Label>
			{games.map(game => (
				<div
					key={game.id}
					className="relative flex w-full items-center gap-2 rounded-md border border-input p-3 has-[[data-state=checked]]:border-ring"
				>
					<Checkbox
						id={game.id}
						checked={settings.selectedGames[game.id] ?? true}
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

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="px-2.5 rounded-full">
					<FileJson2 className="size-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
				<div className="flex h-[90vh] flex-col lg:flex-row">
					<div className="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r flex flex-col">
						<div className="p-6 border-b">
							<DialogTitle>JSON Data</DialogTitle>
							<DialogDescription className="mt-1.5">
								This tool is designed to create Discord embeds.
							</DialogDescription>
						</div>

						<div className="block lg:hidden">
							<Tabs defaultValue="settings" className="w-full">
								<TabsList className="w-full rounded-none">
									<TabsTrigger value="settings" className="flex-1">
										Settings
									</TabsTrigger>
									<TabsTrigger value="preview" className="flex-1">
										Preview
									</TabsTrigger>
								</TabsList>
								<TabsContent value="settings" className="m-0">
									<ScrollArea className="h-[calc(90vh-10rem)] p-6">
										<div className="space-y-6">
											<div className="space-y-6">
												<div className="space-y-3">
													<Label className="text-sm font-medium">Webhook URL</Label>
													<div className="flex items-center gap-2">
														<div className="flex-grow flex">
															<Input
																type={isVisible ? 'text' : 'password'}
																onFocus={() => setIsVisible(true)}
																onBlur={() => setIsVisible(false)}
																placeholder="https://"
																value={webhookUrl}
																onChange={e => setWebhookUrl(e.target.value)}
																className="rounded-r-none border-r-0"
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
																		<AlertDialogCancel className="w-full">
																			Cancel
																		</AlertDialogCancel>
																		<AlertDialogAction
																			className="dark:text-black w-full"
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
														className="w-full dark:text-black"
														size="sm"
														disabled={isLoading}
													>
														{isLoading ? (
															<Loader2 className="size-4 mr-2 animate-spin" />
														) : (
															<Send className="size-4 mr-2" />
														)}
														Send
													</Button>
												</div>

												<div className="space-y-3">
													<Label className="text-sm font-medium">Message Content</Label>
													<Input
														placeholder={defaultContent}
														value={settings.embedContent}
														onChange={e => updateSetting('embedContent', e.target.value)}
													/>
												</div>

												{games.currentGames.length > 0 && (
													<GameSelectionList games={games.currentGames} type="Free Now" />
												)}
												{games.nextGames.length > 0 && (
													<GameSelectionList games={games.nextGames} type="Coming Soon" />
												)}

												<div className="space-y-3">
													<Label className="text-sm font-medium">Appearance</Label>
													<div className="grid gap-2">
														<Switches
															id="include-price"
															checked={settings.includePrice}
															onCheckedChange={checked =>
																updateSetting('includePrice', checked)
															}
															label="Show Price"
														/>
														<Switches
															id="include-image"
															checked={settings.includeImage}
															onCheckedChange={checked =>
																updateSetting('includeImage', checked)
															}
															label="Show Image"
														/>
														<Switches
															id="include-footer"
															checked={settings.includeFooter}
															onCheckedChange={checked =>
																updateSetting('includeFooter', checked)
															}
															label="Show Footer"
														/>
													</div>
												</div>

												<div className="space-y-3 pb-2">
													<Label className="text-sm font-medium">Embed Color</Label>
													<div className="flex items-center gap-2">
														<Popover>
															<PopoverTrigger asChild>
																<Button
																	className="size-10"
																	style={{ backgroundColor: settings.embedColor }}
																/>
															</PopoverTrigger>
															<PopoverContent className="w-full p-3" align="start">
																<HexColorPicker
																	color={settings.embedColor}
																	onChange={handleColorChange}
																	className="!w-full mb-2"
																/>
																<Button
																	onClick={() => handleColorChange(defaultColor)}
																	variant="outline"
																	size="sm"
																	className="w-full px-8"
																>
																	<Undo2 className="size-4 mr-2" />
																	Reset to Default
																</Button>
															</PopoverContent>
														</Popover>
														<Input
															value={settings.embedColor}
															onChange={e => handleColorChange(e.target.value)}
															maxLength={7}
															className="font-mono"
														/>
													</div>
												</div>
											</div>
										</div>
									</ScrollArea>
								</TabsContent>
								<TabsContent value="preview" className="m-0">
									<ScrollArea className="h-[calc(90vh-10rem)] p-6">
										<div className="space-y-4">
											<div className="flex gap-2">
												<Button
													onClick={copyToClipboard}
													className="w-full"
													variant="outline"
												>
													{isCopied ? (
														<Check className="size-4 mr-2" />
													) : (
														<ClipboardCopy className="size-4 mr-2" />
													)}
													Copy JSON
												</Button>
												<div className="relative flex w-full items-center gap-2 rounded-lg border border-input p-3 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
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
												<DiscordPreview games={games} settings={settings} />
											) : (
												<pre className="bg-secondary text-secondary-foreground p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap break-all">
													{JSON.stringify(jsonData, null, 2)}
												</pre>
											)}
										</div>
									</ScrollArea>
								</TabsContent>
							</Tabs>
						</div>

						<div className="hidden lg:block">
							<ScrollArea className="h-[calc(93vh-8rem)] p-6">
								<div className="space-y-6">
									<div className="space-y-3">
										<Label className="text-sm font-medium">Webhook URL</Label>
										<div className="flex items-center gap-2">
											<div className="flex-grow flex">
												<Input
													type={isVisible ? 'text' : 'password'}
													onFocus={() => setIsVisible(true)}
													onBlur={() => setIsVisible(false)}
													placeholder="https://"
													value={webhookUrl}
													onChange={e => setWebhookUrl(e.target.value)}
													className="rounded-r-none border-r-0"
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
															<AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
															<AlertDialogAction
																className="dark:text-black w-full"
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
											size="sm"
											disabled={isLoading}
											className="dark:text-black w-full"
										>
											{isLoading ? (
												<Loader2 className="size-4 mr-2 animate-spin" />
											) : (
												<Send className="size-4 mr-2" />
											)}
											Send
										</Button>
									</div>

									<div className="space-y-3">
										<Label className="text-sm font-medium">Message Content</Label>
										<Input
											placeholder={defaultContent}
											value={settings.embedContent}
											onChange={e => updateSetting('embedContent', e.target.value)}
										/>
									</div>

									{games.currentGames.length > 0 && (
										<GameSelectionList games={games.currentGames} type="Free Now" />
									)}
									{games.nextGames.length > 0 && (
										<GameSelectionList games={games.nextGames} type="Coming Soon" />
									)}

									<div className="space-y-3">
										<Label className="text-sm font-medium">Appearance</Label>
										<div className="grid gap-2">
											<Switches
												id="include-price"
												checked={settings.includePrice}
												onCheckedChange={checked => updateSetting('includePrice', checked)}
												label="Show Price"
											/>
											<Switches
												id="include-image"
												checked={settings.includeImage}
												onCheckedChange={checked => updateSetting('includeImage', checked)}
												label="Show Image"
											/>
											<Switches
												id="include-footer"
												checked={settings.includeFooter}
												onCheckedChange={checked => updateSetting('includeFooter', checked)}
												label="Show Footer"
											/>
										</div>
									</div>

									<div className="space-y-3 pb-2">
										<Label className="text-sm font-medium">Embed Color</Label>
										<div className="flex items-center gap-2">
											<Popover>
												<PopoverTrigger asChild>
													<Button
														className="size-10"
														style={{ backgroundColor: settings.embedColor }}
													/>
												</PopoverTrigger>
												<PopoverContent className="w-full p-3" align="start">
													<HexColorPicker
														color={settings.embedColor}
														onChange={handleColorChange}
														className="!w-full mb-2"
													/>
													<Button
														onClick={() => handleColorChange(defaultColor)}
														variant="outline"
														size="sm"
														className="w-full px-8"
													>
														<Undo2 className="size-4 mr-2" />
														Reset to Default
													</Button>
												</PopoverContent>
											</Popover>
											<Input
												value={settings.embedColor}
												onChange={e => handleColorChange(e.target.value)}
												maxLength={7}
												className="font-mono"
											/>
										</div>
									</div>
								</div>
							</ScrollArea>
						</div>
					</div>

					<div className="hidden lg:flex flex-1 flex-col">
						<ScrollArea className="flex-1 p-6">
							<div className="space-y-4">
								<div className="flex gap-2">
									<Button onClick={copyToClipboard} className="w-full" variant="outline">
										{isCopied ? (
											<Check className="size-4 mr-2" />
										) : (
											<ClipboardCopy className="size-4 mr-2" />
										)}
										Copy JSON
									</Button>
									<div className="relative flex w-full items-center gap-2 rounded-md border border-input p-2 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
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

								{settings.showDiscordPreview ? (
									<DiscordPreview games={games} settings={settings} />
								) : (
									<pre className="bg-secondary text-secondary-foreground p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap break-all">
										{JSON.stringify(jsonData, null, 2)}
									</pre>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
