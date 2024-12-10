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
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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

interface EgFreeSettings {
	includeCurrent: boolean
	includeUpcoming: boolean
	embedContent: string
	embedColor: string
	includeFooter: boolean
	includePrice: boolean
	includeImage: boolean
	webhookUrl: string
}

const defaultColor = '#85ce4b'
const defaultContent = '<@&847939354978811924>'

export default function Json({ games }: any) {
	const [jsonData, setJsonData] = useState({})
	const [webhookUrl, setWebhookUrl] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [settings, setSettings] = useState<EgFreeSettings>({
		includeCurrent: true,
		includeUpcoming: false,
		embedContent: '',
		embedColor: defaultColor,
		includeFooter: true,
		includePrice: true,
		includeImage: true,
		webhookUrl: '',
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
						setSettings({
							...parsed,
							webhookUrl: decryptedWebhook,
						})
						setWebhookUrl(decryptedWebhook)
					} catch (error) {
						console.error('Failed to load settings:', error)
					}
				}
			}
			loadSettings()
		}
	}, [])

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

	const updateSetting = (key: keyof EgFreeSettings, value: any) => {
		setSettings(prev => ({ ...prev, [key]: value }))
	}

	const handleColorChange = (color: string) => {
		updateSetting('embedColor', color === defaultColor ? defaultColor : color)
	}

	useEffect(() => {
		const generateJson = () => {
			const selectedGames = [
				...(settings.includeCurrent ? games.currentGames : []),
				...(settings.includeUpcoming ? games.nextGames : []),
			]

			const embeds = selectedGames.map((game: any) => {
				const isCurrent = game.promotions.promotionalOffers.length > 0
				const dateInfo = isCurrent
					? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
					: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
							.startDate
				const endDate = new Date(dateInfo)
				const pageSlug = game.offerMappings[0]?.pageSlug || game.urlSlug
				const isBundleGame = game.categories?.some(
					(category: any) => category.path === 'bundles'
				)
				const linkPrefix = isBundleGame ? '/bundles/' : '/p/'

				const isTestAccount = game.seller?.name === 'Epic Dev Test Account'

				let fieldValue = isTestAccount
					? ''
					: isCurrent
					? `${
							settings.includePrice
								? game.price.totalPrice.originalPrice === 0
									? '**Free**\n'
									: `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**\n`
								: ''
					  }[Claim ${
							isBundleGame ? 'Bundle' : 'Game'
					  }](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`
					: `${
							settings.includePrice
								? game.price.totalPrice.originalPrice === 0
									? 'Free\n'
									: `${game.price.totalPrice.fmtPrice.originalPrice}\n`
								: ''
					  }[Game Link](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`

				const imageUrl = game.keyImages.find(
					(img: any) => img.type === 'VaultClosed' || img.type === 'OfferImageWide'
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
			toast.error('Failed to copy JSON Data.', {
				position: 'bottom-center',
			})
		}
	}

	const handleWebhook = async () => {
		if (!webhookUrl) {
			toast.error('Insert a webhook.', {
				position: 'bottom-center',
			})
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
				toast.success('Successfully sent data.', { position: 'bottom-center' })
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to send JSON Data.')
			}
		} catch (error) {
			console.error('Failed to send:', error)
			toast.error('Failed to send JSON Data.', {
				description: 'The webhook or data might be invalid.',
				position: 'bottom-center',
			})
		}
		setIsLoading(false)
	}

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrl(text)
		} catch (err) {
			console.error('Failed to paste text')
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="px-2 rounded-full">
					<FileJson2 />
				</Button>
			</DialogTrigger>
			<DialogContent
				style={{ borderLeft: `6px solid ${settings.embedColor}` }}
				className="bg-white dark:bg-epic-black max-w-3xl max-h-[90vh] overflow-hidden"
			>
				<DialogHeader>
					<DialogTitle>JSON Data</DialogTitle>
					<DialogDescription>
						This tool is designed to create Discord embeds. Your preferences are
						stored locally, except your webhook.
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="settings" className="flex flex-col max-h-[60vh]">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="preview">JSON Preview</TabsTrigger>
					</TabsList>
					<ScrollArea className="flex-1 w-full">
						<TabsContent value="settings" className="overflow-y-auto">
							<div className="flex items-center gap-2 mt-2">
								<div className="flex-grow flex flex-col">
									<div className="flex">
										<Input
											type={isVisible ? 'text' : 'password'}
											onFocus={() => setIsVisible(true)}
											onBlur={() => setIsVisible(false)}
											placeholder="Webhook URL"
											value={webhookUrl}
											onChange={e => {
												setWebhookUrl(e.target.value)
											}}
											style={{ boxShadow: 'none' }}
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
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => {
															updateSetting('webhookUrl', webhookUrl)
															toast.success('Webhook saved locally', {
																position: 'bottom-center',
															})
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
								<Button size="sm" onClick={handleWebhook} disabled={isLoading}>
									{isLoading ? (
										<div className="sm:mr-2 mt-0.5">
											<Loader2
												className="size-4 animate-spin"
												style={{ color: settings.embedColor }}
											/>
										</div>
									) : (
										<Send className="size-4 sm:mr-2" />
									)}
									<p className="sm:block hidden">Send</p>
								</Button>
							</div>
							<Card className="mt-4">
								<CardContent className="space-y-4 mt-6">
									<div className="flex items-center gap-2">
										<Popover>
											<PopoverTrigger asChild>
												<Button
													className="size-10"
													style={{ backgroundColor: settings.embedColor }}
												/>
											</PopoverTrigger>
											<PopoverContent
												className="w-full p-3"
												align="start"
												onOpenAutoFocus={(e: any) => e.preventDefault()}
											>
												<Input
													maxLength={7}
													value={settings.embedColor}
													onChange={e => handleColorChange(e.target.value)}
													className="mb-2"
												/>
												<HexColorPicker
													color={settings.embedColor}
													onChange={handleColorChange}
													className="!w-full mb-2"
												/>
												<Button
													onClick={() => handleColorChange(defaultColor)}
													variant="outline"
													size="sm"
													className="w-full"
												>
													<Undo2 className="size-4 mr-2" />
													Reset to Default
												</Button>
											</PopoverContent>
										</Popover>
										<div className="flex-grow">
											<Input
												placeholder={defaultContent}
												value={settings.embedContent}
												onChange={e => updateSetting('embedContent', e.target.value)}
											/>
										</div>
									</div>
									<Separator />
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm font-medium">Game Selection</Label>
											<Switches
												id="current-games"
												checked={settings.includeCurrent}
												onCheckedChange={checked =>
													updateSetting('includeCurrent', checked)
												}
												label="Current"
											/>
											<Switches
												id="upcoming-games"
												checked={settings.includeUpcoming}
												onCheckedChange={checked =>
													updateSetting('includeUpcoming', checked)
												}
												label="Upcoming"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-medium">Embed Options</Label>
											<Switches
												id="include-price"
												checked={settings.includePrice}
												onCheckedChange={checked => updateSetting('includePrice', checked)}
												disabled={!settings.includeCurrent && !settings.includeUpcoming}
												label="Price"
											/>
											<Switches
												id="include-image"
												checked={settings.includeImage}
												onCheckedChange={checked => updateSetting('includeImage', checked)}
												disabled={!settings.includeCurrent && !settings.includeUpcoming}
												label="Image"
											/>
											<Switches
												id="include-footer"
												checked={settings.includeFooter}
												onCheckedChange={checked => updateSetting('includeFooter', checked)}
												disabled={!settings.includeCurrent && !settings.includeUpcoming}
												label="Footer"
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</ScrollArea>
					<TabsContent value="preview" className="overflow-y-auto pt-3">
						<Card>
							<CardContent className="p-4">
								<Button
									onClick={copyToClipboard}
									variant="outline"
									size="sm"
									className="mb-4 w-full"
								>
									{isCopied ? (
										<Check className="size-4 mr-2" />
									) : (
										<ClipboardCopy className="size-4 mr-2" />
									)}
									Copy JSON
								</Button>
								<pre className="bg-secondary text-secondary-foreground p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap break-all">
									{JSON.stringify(jsonData, null, 2)}
								</pre>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
