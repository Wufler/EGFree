'use client'
import { toast } from 'sonner'
import {
	Clipboard,
	ExternalLink,
	Loader2,
	Save,
	Send,
	Undo2,
	DollarSign,
	Image as ImageIcon,
	Clock,
	ShoppingCart,
	AlertTriangle,
	MessageSquare,
	Gamepad2,
	Palette,
	Pen,
	Paintbrush2,
	Monitor,
	Smartphone,
	CalendarDays,
	Edit,
	ArrowRightLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, getMobileGameKey } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HexColorPicker } from 'react-colorful'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const defaultColor = '#85ce4b'

function GameSelectionList({
	games,
	type,
	settings,
	updateSetting,
}: {
	games: { id: string; title: string }[]
	type: string
	settings: EgFreeSettings
	updateSetting: <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => void
}) {
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
		<div className="space-y-3 p-3 rounded-lg bg-card/50 border shadow-xs">
			<div className="flex items-center justify-between pb-2 border-b border-border/50">
				<div className="flex items-center gap-2 text-sm font-semibold text-primary">
					{type === 'Desktop' ? <Monitor className="size-4" /> : type === 'Mobile' ? <Smartphone className="size-4" /> : <CalendarDays className="size-4" />}
					{type}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleToggleAll}
					className="h-7 px-3 text-xs bg-muted hover:bg-muted/80 rounded-full"
				>
					{allSelected ? 'Deselect All' : 'Select All'}
				</Button>
			</div>
			<div className="grid gap-2">
				{games.map(game => (
					<Label
						key={game.id}
						htmlFor={game.id}
						className="relative flex items-center w-full gap-3 rounded-md border border-input p-3 bg-background hover:bg-accent hover:border-primary/50 cursor-pointer transition-all has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 group"
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
							className="mt-0"
						/>
						<span className="font-medium text-sm cursor-pointer">
							{game.title}
						</span>
					</Label>
				))}
			</div>
		</div>
	)
}

const optionCheckboxClass =
	'border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 shadow-sm outline-none bg-background transition-all hover:bg-accent hover:border-primary/50'

export default function JsonFormContent({
	idSuffix = '',
	games,
	settings,
	parsedMobileGames,
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
}: {
	idSuffix?: string
	games: Game
	settings: EgFreeSettings
	parsedMobileGames: MobileGameDataLocal[]
	canSplitDesktopMobile: boolean
	webhookUrl: string
	setWebhookUrl: (v: string) => void
	webhookUrlMobile: string
	setWebhookUrlMobile: (v: string) => void
	messageId: string
	setMessageId: (v: string) => void
	mobileMessageId: string
	setMobileMessageId: (v: string) => void
	checkoutLink: string
	setCheckoutLink: (v: string) => void
	isVisible: boolean
	setIsVisible: (v: boolean) => void
	isMobileWebhookVisible: boolean
	setIsMobileWebhookVisible: (v: boolean) => void
	isLoading: boolean
	showWarning: boolean
	updateSetting: <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => void
	handleColorChange: (color: string) => void
	handleWebhook: () => void
	handlePaste: () => void
	handlePasteMobile: () => void
	canSendWebhook: boolean
	isValidDiscordWebhook: (url: string) => boolean
	debouncedFetchWebhookInfo: (url: string) => void
	fetchWebhookInfo: (url: string, target?: 'desktop' | 'mobile') => void
	defaultContent: string
	defaultMobileContent: string
}) {
	const activeMobile = parsedMobileGames.filter(
		g => g.promoEndDate && new Date(g.promoEndDate) > new Date(),
	)
	const hasGames =
		games.currentGames.length > 0 ||
		games.nextGames.length > 0 ||
		activeMobile.length > 0
	const selectedCurrentCount = games.currentGames.filter(
		game => settings.selectedGames[game.id],
	).length
	const showDesktopMessageFields = true
	const showMobileMessageFields = settings.splitDesktopMobile
	const showDesktopWebhookField =
		!settings.splitDesktopMobile ||
		(settings.splitDesktopMobile && canSplitDesktopMobile)
	const showMobileWebhookField =
		settings.splitDesktopMobile &&
		canSplitDesktopMobile &&
		!settings.useDesktopWebhookForMobile
	const clearMessageIds = () => {
		setMessageId('')
		setMobileMessageId('')
	}
	const allOptionsSelected =
		settings.includePrice &&
		settings.includeImage &&
		settings.includeFooter &&
		settings.includeCheckout &&
		settings.includeClaimGame

	return (
		<div className="w-full">
			<Tabs
				defaultValue="discord"
				className="w-full gap-0 bg-muted/30"
			>
				<TabsList className="grid w-full grid-cols-3 rounded-none bg-transparent">
					<TabsTrigger value="discord"> <MessageSquare className="size-3.5 text-primary" /> Webhook</TabsTrigger>
					<TabsTrigger value="games"> <Gamepad2 className="size-3.5 text-primary" /> Games</TabsTrigger>
					<TabsTrigger value="appearance"> <Palette className="size-3.5 text-primary" /> Theme</TabsTrigger>
				</TabsList>

				<TabsContent
					value="discord"
					className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0"
				>
					<Card className="bg-background dark:bg-[#0a0a0a] border-none overflow-hidden rounded-none p-0 pb-6">
						<CardHeader className="bg-muted/30 py-4 border-b border-border/50">
							<CardTitle className="text-lg flex items-center gap-2">
								Configuration
							</CardTitle>
							<CardDescription>
								Setup your discord webhook and message content.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-3">
								{showDesktopWebhookField && (
									<>
										<Label
											htmlFor={`webhook-url${idSuffix}`}
											className="text-sm font-semibold flex items-center gap-1.5"
										>
											{settings.splitDesktopMobile &&
												!settings.useDesktopWebhookForMobile && (
													<>
														<Monitor className="size-3.5 text-primary" /> Desktop{' '}
													</>
												)}
											Webhook URL
										</Label>
										<div className="flex items-center ring-1 ring-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
											<Input
												id={`webhook-url${idSuffix}`}
												type={isVisible ? 'text' : 'password'}
												onFocus={() => setIsVisible(true)}
												onBlur={() => setIsVisible(false)}
												placeholder="https://discord.com/api/webhooks/..."
												value={webhookUrl}
												onChange={e => {
													setWebhookUrl(e.target.value)
													debouncedFetchWebhookInfo(e.target.value)
												}}
												className={`border-0 rounded-none focus-visible:ring-0 text-sm ${webhookUrl && !isValidDiscordWebhook(webhookUrl)
													? 'text-red-500'
													: ''
													}`}
											/>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														key="save-webhook"
														className="px-3 h-full rounded-none border-l hover:bg-accent hover:text-accent-foreground disabled:opacity-100 disabled:text-muted-foreground"
														disabled={!webhookUrl.trim()}
													>
														<Save className="size-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent className="z-80 border-primary/20 shadow-2xl">
													<AlertDialogHeader>
														<AlertDialogTitle className="flex items-center gap-2 text-primary">
															<Save className="size-5" /> Warning
														</AlertDialogTitle>
														<AlertDialogDescription className="space-y-2 text-base" asChild>
															<div>
																<p>
																	This will encrypt and save your webhook in your browser&apos;s local
																	storage and will automatically populate the URL input.
																</p>
																<p className="font-semibold text-foreground text-sm">
																	Consider manually pasting the webhook as a safer alternative.
																</p>
															</div>
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel className="sm:w-1/2">Cancel</AlertDialogCancel>
														<AlertDialogAction
															className="sm:w-1/2 font-semibold"
															onClick={() => {
																updateSetting('webhookUrl', webhookUrl)
																fetchWebhookInfo(webhookUrl)
																toast.success('Webhook saved locally')
															}}
														>
															Save Anyway
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
											<Button
												variant="ghost"
												onClick={handlePaste}
												className="px-3 h-full rounded-none border-l hover:bg-accent hover:text-accent-foreground"
												title="Paste desktop webhook from clipboard"
											>
												<Clipboard className="size-4" />
											</Button>
										</div>
									</>
								)}
								{showMobileWebhookField && (
									<>
										<Label
											htmlFor={`webhook-url-mobile${idSuffix}`}
											className="text-sm font-semibold flex items-center gap-1.5"
										>
											<Smartphone className="size-3.5 text-primary" />
											Mobile Webhook URL
										</Label>
										<div className="flex items-center ring-1 ring-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
											<Input
												id={`webhook-url-mobile${idSuffix}`}
												type={isMobileWebhookVisible ? 'text' : 'password'}
												onFocus={() => setIsMobileWebhookVisible(true)}
												onBlur={() => setIsMobileWebhookVisible(false)}
												placeholder="https://discord.com/api/webhooks/..."
												value={webhookUrlMobile}
												onChange={e => {
													setWebhookUrlMobile(e.target.value)
													if (isValidDiscordWebhook(e.target.value)) {
														fetchWebhookInfo(e.target.value, 'mobile')
													}
												}}
												className={`border-0 rounded-none focus-visible:ring-0 text-sm ${webhookUrlMobile && !isValidDiscordWebhook(webhookUrlMobile)
													? 'text-red-500'
													: ''
													}`}
											/>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														key="save-mobile-webhook"
														className="px-3 h-full rounded-none border-l hover:bg-accent hover:text-accent-foreground disabled:opacity-100 disabled:text-muted-foreground"
														disabled={!webhookUrlMobile.trim()}
													>
														<Save className="size-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent className="z-80 border-primary/20 shadow-2xl">
													<AlertDialogHeader>
														<AlertDialogTitle className="flex items-center gap-2 text-primary">
															<Save className="size-5" /> Warning
														</AlertDialogTitle>
														<AlertDialogDescription className="space-y-2 text-base" asChild>
															<div>
																<p>
																	This will encrypt and save your mobile webhook in your browser&apos;s local
																	storage.
																</p>
																<p className="font-semibold text-foreground text-sm">
																	Consider manually pasting the webhook as a safer alternative.
																</p>
															</div>
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel className="sm:w-1/2">Cancel</AlertDialogCancel>
														<AlertDialogAction
															className="sm:w-1/2 font-semibold"
															onClick={() => {
																updateSetting('webhookUrlMobile', webhookUrlMobile)
																fetchWebhookInfo(webhookUrlMobile, 'mobile')
																toast.success('Mobile webhook saved locally')
															}}
														>
															Save Anyway
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
											<Button
												variant="ghost"
												onClick={handlePasteMobile}
												className="px-3 h-full rounded-none border-l hover:bg-accent hover:text-accent-foreground"
												title="Paste mobile webhook from clipboard"
											>
												<Clipboard className="size-4" />
											</Button>
										</div>
									</>
								)}
								<div className="space-y-3">
									{canSplitDesktopMobile && (
										<Label
											htmlFor={`split-toggle${idSuffix}`}
											className={cn(optionCheckboxClass, 'flex')}
										>
											<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
												<Edit className="opacity-70 shrink-0" size={14} />
												Split Desktop and Mobile
											</span>
											<Checkbox
												id={`split-toggle${idSuffix}`}
												checked={settings.splitDesktopMobile}
												onCheckedChange={checked => {
													clearMessageIds()
													updateSetting('splitDesktopMobile', checked as boolean)
												}}
												className="shadow-sm"
											/>
										</Label>
									)}

									{canSplitDesktopMobile && settings.splitDesktopMobile && (
										<div className="grid gap-3 sm:grid-cols-2">
											<Label
												htmlFor={`split-use-desktop-webhook${idSuffix}`}
												className={cn(optionCheckboxClass, 'flex sm:col-span-2')}
											>
												<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
													<ArrowRightLeft className="opacity-70 shrink-0" size={14} />
													Same webhook for both
												</span>
												<Checkbox
													id={`split-use-desktop-webhook${idSuffix}`}
													checked={settings.useDesktopWebhookForMobile}
													onCheckedChange={checked => {
														clearMessageIds()
														updateSetting(
															'useDesktopWebhookForMobile',
															checked as boolean,
														)
													}}
													className="shadow-sm"
												/>
											</Label>
											<Label
												htmlFor={`split-send-desktop${idSuffix}`}
												className={cn(optionCheckboxClass, 'flex')}
											>
												<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
													<Monitor className="opacity-70 shrink-0" size={14} />
													Send Desktop
												</span>
												<Checkbox
													id={`split-send-desktop${idSuffix}`}
													checked={settings.sendDesktop}
													onCheckedChange={checked => {
														clearMessageIds()
														updateSetting('sendDesktop', checked as boolean)
													}}
													className="shadow-sm"
												/>
											</Label>
											<Label
												htmlFor={`split-send-mobile${idSuffix}`}
												className={cn(optionCheckboxClass, 'flex')}
											>
												<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
													<Smartphone className="opacity-70 shrink-0" size={14} />
													Send Mobile
												</span>
												<Checkbox
													id={`split-send-mobile${idSuffix}`}
													checked={settings.sendMobile}
													onCheckedChange={checked => {
														clearMessageIds()
														updateSetting('sendMobile', checked as boolean)
													}}
													className="shadow-sm"
												/>
											</Label>
										</div>
									)}
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								{showDesktopMessageFields && (
									<>
										<div className="space-y-2 sm:col-span-2">
											<Label
												htmlFor={`message-content${idSuffix}`}
												className="text-sm font-semibold flex justify-between"
											>
												<span className="flex items-center gap-1.5">
													{settings.splitDesktopMobile && (
														<Monitor className="size-3.5 text-primary" />
													)}
													{settings.splitDesktopMobile ? 'Desktop Message Content' : 'Message Content'}
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="h-5 px-2 text-xs text-muted-foreground hover:text-primary"
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText()
															if (/^\d+$/.test(text)) {
																updateSetting(
																	'embedContent',
																	`${settings.embedContent}<@&${text}>`,
																)
															} else {
																toast.error('Clipboard content must be a role ID')
															}
														} catch {
															toast.error('Failed to read clipboard')
														}
													}}
												>
													Paste Role ID (@&)
												</Button>
											</Label>
											<Textarea
												id={`message-content${idSuffix}`}
												placeholder={defaultContent}
												value={settings.embedContent}
												onChange={e => updateSetting('embedContent', e.target.value)}
												className="min-h-16 max-h-32 text-sm wrap-anywhere resize-y border-input focus-visible:ring-primary"
											/>
										</div>

										<div className="space-y-2 sm:col-span-2">
											<Label
												htmlFor={`message-id${idSuffix}`}
												className="text-sm font-semibold flex items-center gap-1.5"
											>
												{settings.splitDesktopMobile && (
													<Monitor className="size-3.5 text-primary" />
												)}
												{settings.splitDesktopMobile
													? 'Desktop Message ID (Edit mode)'
													: 'Message ID (Edit mode)'}
											</Label>
											<div className="flex items-center ring-1 ring-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
												<Input
													id={`message-id${idSuffix}`}
													placeholder="Leave empty to send as a new message"
													value={messageId}
													onChange={e => setMessageId(e.target.value)}
													className="border-0 rounded-none focus-visible:ring-0 text-sm"
												/>
												<Button
													variant="ghost"
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText()
															if (/^\d+$/.test(text.trim())) {
																setMessageId(text.trim())
															} else {
																toast.error('Message ID must contain only numbers')
															}
														} catch {
															toast.error('Failed to read clipboard')
														}
													}}
													className="px-3 h-full rounded-none border-l hover:bg-accent hover:text-accent-foreground"
												>
													<Clipboard className="size-4" />
												</Button>
											</div>
										</div>
									</>
								)}

								{showMobileMessageFields && (
									<>
										<div className="space-y-2 sm:col-span-2">
											<Label
												htmlFor={`message-content-mobile${idSuffix}`}
												className="text-sm font-semibold flex justify-between"
											>
												<span className="flex items-center gap-1.5">
													<Smartphone className="size-3.5 text-primary" />
													Mobile Message Content
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="h-5 px-2 text-xs text-muted-foreground hover:text-primary"
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText()
															if (/^\d+$/.test(text)) {
																updateSetting(
																	'embedContentMobile',
																	`${settings.embedContentMobile}<@&${text}>`,
																)
															} else {
																toast.error('Clipboard content must be a role ID')
															}
														} catch {
															toast.error('Failed to read clipboard')
														}
													}}
												>
													Paste Role ID (@&)
												</Button>
											</Label>
											<Textarea
												id={`message-content-mobile${idSuffix}`}
												placeholder={defaultMobileContent}
												value={settings.embedContentMobile}
												onChange={e =>
													updateSetting('embedContentMobile', e.target.value)
												}
												className="min-h-16 max-h-32 text-sm wrap-anywhere resize-y border-input focus-visible:ring-primary"
											/>
										</div>

										<div className="space-y-2 sm:col-span-2">
											<Label
												htmlFor={`message-id-mobile${idSuffix}`}
												className="text-sm font-semibold flex items-center gap-1.5"
											>
												<Smartphone className="size-3.5 text-primary" />
												Mobile Message ID (Edit mode)
											</Label>
											<div className="flex items-center ring-1 ring-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
												<Input
													id={`message-id-mobile${idSuffix}`}
													placeholder="Leave empty to send as a new message"
													value={mobileMessageId}
													onChange={e => setMobileMessageId(e.target.value)}
													className="border-0 rounded-none focus-visible:ring-0 text-sm"
												/>
												<Button
													variant="ghost"
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText()
															if (/^\d+$/.test(text.trim())) {
																setMobileMessageId(text.trim())
															} else {
																toast.error('Message ID must contain only numbers')
															}
														} catch {
															toast.error('Failed to read clipboard')
														}
													}}
													className="px-3 h-full rounded-none border-l hover:bg-accent hover:text-accent-foreground"
												>
													<Clipboard className="size-4" />
												</Button>
											</div>
										</div>
									</>
								)}
							</div>
						</CardContent>
						<CardFooter>
							<Button
								onClick={handleWebhook}
								className={`w-full py-6 text-lg transition-all duration-300 ${showWarning
									? 'bg-yellow-500 hover:bg-yellow-600 text-black outline-8 outline-yellow-500/20'
									: 'bg-primary hover:bg-primary/90 text-primary-foreground'
									}`}
								disabled={isLoading || !canSendWebhook}
							>
								{isLoading ? (
									<Loader2 className="size-5 animate-spin" />
								) : showWarning ? (
									<AlertTriangle className="size-5" />
								) : (settings.splitDesktopMobile
									? messageId || mobileMessageId
									: messageId) ? (
									<Pen className="size-5" />
								) : (
									<Send className="size-5" />
								)}
								{showWarning
									? 'Click again to confirm'
									: settings.splitDesktopMobile
										? messageId || mobileMessageId
											? 'Update Split Messages'
											: 'Send Split Messages'
										: messageId
											? 'Update Existing Message'
											: 'Send'}
							</Button>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent
					value="games"
					className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0"
				>
					<Card className="bg-background dark:bg-[#0a0a0a] border-none overflow-hidden rounded-none p-0 pb-6">
						<CardHeader className="bg-muted/30 py-4 border-b border-border/50">
							<CardTitle className="text-lg flex items-center gap-2">
								Game Visibility
							</CardTitle>
							<CardDescription>
								Select which games to include in the embed.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{!hasGames ? (
								<div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
									No games available to select.
								</div>
							) : (
								<div className="grid gap-4">
									{games.currentGames.length > 0 && (
										<GameSelectionList
											games={games.currentGames}
											type="Desktop"
											settings={settings}
											updateSetting={updateSetting}
										/>
									)}
									{activeMobile.length > 0 && (
										<GameSelectionList
											games={activeMobile.map(g => ({
												id: getMobileGameKey(g),
												title:
													g.title +
													(g.iosOffer && !g.androidOffer
														? ' (iOS)'
														: !g.iosOffer && g.androidOffer
															? ' (Android)'
															: ''),
											}))}
											type="Mobile"
											settings={settings}
											updateSetting={updateSetting}
										/>
									)}
									{games.nextGames.length > 0 && (
										<GameSelectionList
											games={games.nextGames}
											type="Upcoming"
											settings={settings}
											updateSetting={updateSetting}
										/>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value="appearance"
					className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0"
				>
					<Card className="bg-background dark:bg-[#0a0a0a] border-none overflow-hidden rounded-none p-0 pb-6 gap-4">
						<CardHeader className="bg-muted/30 py-4 border-b border-border/50">
							<CardTitle className="text-lg flex items-center gap-2">
								Appearance
							</CardTitle>
							<CardDescription>
								Customize how the message looks in Discord.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-base font-semibold">
									Features
								</Label>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => {
										const newValue = !allOptionsSelected
										updateSetting('includePrice', newValue)
										updateSetting('includeImage', newValue)
										updateSetting('includeFooter', newValue)
										updateSetting('includeCheckout', newValue)
										updateSetting('includeClaimGame', newValue)
									}}
									className="px-3 text-xs rounded-full"
								>
									{allOptionsSelected ? 'Deselect All' : 'Select All'}
								</Button>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Label
									htmlFor={`components-v2${idSuffix}`}
									className={cn(optionCheckboxClass, 'col-span-1 flex')}
								>
									<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
										<Paintbrush2
											className="opacity-70 shrink-0"
											size={14}
										/>
										Components V2
									</span>
									<Checkbox
										id={`components-v2${idSuffix}`}
										checked={settings.componentsV2}
										onCheckedChange={checked => {
											setMessageId('')
											updateSetting('componentsV2', checked as boolean)
										}}
										className="shadow-sm"
									/>
								</Label>

								<Label
									htmlFor={`include-price${idSuffix}`}
									className={cn(optionCheckboxClass, 'col-span-1 flex')}
								>
									<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
										<DollarSign
											className="opacity-70 shrink-0"
											size={14}
										/>
										Price
									</span>
									<Checkbox
										id={`include-price${idSuffix}`}
										checked={settings.includePrice}
										onCheckedChange={checked =>
											updateSetting('includePrice', checked as boolean)
										}
										className="shadow-sm"
									/>
								</Label>

								<Label
									htmlFor={`include-image${idSuffix}`}
									className={cn(optionCheckboxClass, 'col-span-1 flex')}
								>
									<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
										<ImageIcon
											className="opacity-70 shrink-0"
											size={14}
										/>
										Thumbnails
									</span>
									<Checkbox
										id={`include-image${idSuffix}`}
										checked={settings.includeImage}
										onCheckedChange={checked =>
											updateSetting('includeImage', checked as boolean)
										}
										className="shadow-sm"
									/>
								</Label>

								<Label
									htmlFor={`include-footer${idSuffix}`}
									className={cn(optionCheckboxClass, 'col-span-1 flex')}
								>
									<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
										<Clock
											className="opacity-70 shrink-0"
											size={14}
										/>
										Timestamp
									</span>
									<Checkbox
										id={`include-footer${idSuffix}`}
										checked={settings.includeFooter}
										onCheckedChange={checked =>
											updateSetting('includeFooter', checked as boolean)
										}
										className="shadow-sm"
									/>
								</Label>

								<Label
									htmlFor={`include-claim${idSuffix}`}
									className={cn(optionCheckboxClass, 'col-span-1 flex')}
								>
									<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
										<ExternalLink
											className="opacity-70 shrink-0"
											size={14}
										/>
										Claim Links
									</span>
									<Checkbox
										id={`include-claim${idSuffix}`}
										checked={settings.includeClaimGame}
										onCheckedChange={checked =>
											updateSetting('includeClaimGame', checked as boolean)
										}
										className="shadow-sm"
									/>
								</Label>

								<Label
									htmlFor={`include-checkout${idSuffix}`}
									className={cn(
										optionCheckboxClass,
										'col-span-1 flex',
										selectedCurrentCount < 1 &&
										'opacity-50 grayscale pointer-events-none',
									)}
								>
									<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-tight">
										<ShoppingCart
											className="opacity-70 shrink-0"
											size={14}
										/>
										Checkout Button
									</span>
									<Checkbox
										id={`include-checkout${idSuffix}`}
										checked={settings.includeCheckout}
										onCheckedChange={checked =>
											updateSetting('includeCheckout', checked as boolean)
										}
										className="shadow-sm"
										disabled={selectedCurrentCount < 1}
									/>
								</Label>
							</div>

							{settings.includeCheckout && selectedCurrentCount >= 1 && (
								<div className="p-4 bg-muted/40 rounded-lg border border-dashed space-y-3">
									<Label
										htmlFor={`checkout-link${idSuffix}`}
										className="text-sm font-semibold text-foreground flex items-center gap-2"
									>
										<ShoppingCart className="size-4 text-primary" />
										Manual Checkout Override
									</Label>
									<Textarea
										id={`checkout-link${idSuffix}`}
										placeholder="https://store.epicgames.com/purchase?offers=1-{namespace}-{id}-#"
										value={checkoutLink}
										onChange={e => setCheckoutLink(e.target.value)}
										className="max-h-24 text-sm font-mono bg-background focus-visible:ring-primary"
									/>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
										<span>Leave empty to use automatic link.</span>
										<a
											href="https://up.wolfey.me/milb5OsF"
											target="_blank"
											className="text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-primary/20"
										>
											<ImageIcon className="size-3" /> View instruction image
										</a>
									</div>
								</div>
							)}

							{!settings.componentsV2 && (
								<div className="space-y-3 pt-2">
									<Label
										htmlFor={`sidebar-color${idSuffix}`}
										className="text-sm font-semibold"
									>
										Embed Edge Color
									</Label>
									<div className="flex items-center gap-3">
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className="w-12 h-10 p-0 rounded-md border-2 shadow-sm transition-all hover:scale-105"
													style={{
														backgroundColor: settings.embedColor,
														borderColor: settings.embedColor,
													}}
												/>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-4 z-90 border-border/50 shadow-xl rounded-xl"
												align="start"
											>
												<HexColorPicker
													color={settings.embedColor}
													onChange={handleColorChange}
													className="w-full mb-4"
												/>
												<Button
													onClick={() => handleColorChange(defaultColor)}
													variant="secondary"
													size="sm"
													className="w-full font-medium"
												>
													<Undo2 className="size-4 mr-2" />
													Reset Default
												</Button>
											</PopoverContent>
										</Popover>
										<Input
											id={`sidebar-color${idSuffix}`}
											value={settings.embedColor}
											onChange={e => handleColorChange(e.target.value)}
											maxLength={7}
											className="text-sm font-mono max-w-30 uppercase tracking-wider"
										/>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
