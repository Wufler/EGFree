'use client'
import { toast } from 'sonner'
import {
	Clipboard,
	ExternalLink,
	Loader2,
	Save,
	Send,
	Undo2,
	X,
	DollarSign,
	Image as ImageIcon,
	Clock,
	ShoppingCart,
	AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMobileGameKey } from '@/lib/utils'
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
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
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

const optionCheckboxClass =
	'border-input has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 shadow-xs outline-none w-full bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 transition-all'

export default function JsonFormContent({
	idSuffix = '',
	games,
	settings,
	parsedMobileGames,
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
}: {
	idSuffix?: string
	games: Game
	settings: EgFreeSettings
	parsedMobileGames: MobileGameDataLocal[]
	storedMobileGameKeys?: ReadonlySet<string>
	webhookUrl: string
	setWebhookUrl: (v: string) => void
	messageId: string
	setMessageId: (v: string) => void
	checkoutLink: string
	setCheckoutLink: (v: string) => void
	mobileUrl: string
	setMobileUrl: (v: string) => void
	isVisible: boolean
	setIsVisible: (v: boolean) => void
	isLoading: boolean
	showWarning: boolean
	isMobileLoading: boolean
	updateSetting: <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => void
	handleAccordionChange: (value: string[]) => void
	handleColorChange: (color: string) => void
	handleWebhook: () => void
	handlePaste: () => void
	parseMobileGame: () => void
	handleMobilePaste: () => void
	removeParsedGame: (game: MobileGameDataLocal) => void
	isValidDiscordWebhook: (url: string) => boolean
	debouncedFetchWebhookInfo: (url: string) => void
	fetchWebhookInfo: (url: string) => void
	defaultContent: string
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
	const allOptionsSelected =
		settings.includePrice &&
		settings.includeImage &&
		settings.includeFooter &&
		settings.includeCheckout &&
		settings.includeClaimGame

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<Label htmlFor={`webhook-url${idSuffix}`} className="text-sm font-medium">
					Webhook URL
				</Label>
				<div className="flex items-center gap-2">
					<div className="grow flex">
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
							className={`rounded-r-none border-r-0 text-sm ${webhookUrl && !isValidDiscordWebhook(webhookUrl)
								? 'border-red-500 focus:border-red-500'
								: ''
								}`}
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
												Consider manually pasting the webhook instead.
											</p>
										</div>
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel className="sm:w-1/2">Cancel</AlertDialogCancel>
									<AlertDialogAction
										className="dark:text-black sm:w-1/2"
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
					className={`w-full ${showWarning
						? 'bg-yellow-500 hover:bg-yellow-600 text-black'
						: 'dark:text-black'
						}`}
					size="sm"
					disabled={isLoading || !isValidDiscordWebhook(webhookUrl)}
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
					<Label
						htmlFor={`message-content${idSuffix}`}
						className="text-sm font-medium"
					>
						Message Content
					</Label>
					<div className="flex items-center gap-2">
						<Textarea
							id={`message-content${idSuffix}`}
							placeholder={defaultContent}
							value={settings.embedContent}
							onChange={e => updateSetting('embedContent', e.target.value)}
							className="min-h-9.5 max-h-25 text-sm wrap-anywhere"
						/>
						<Button
							variant="outline"
							onClick={async () => {
								try {
									const text = await navigator.clipboard.readText()
									if (/^\d+$/.test(text)) {
										updateSetting('embedContent', `${settings.embedContent}<@&${text}>`)
									} else {
										toast.error('Clipboard content must be a role ID')
									}
								} catch (err) {
									toast.error('Failed to read clipboard')
									console.error('Failed to read clipboard:', err)
								}
							}}
						>
							@&
						</Button>
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`message-id${idSuffix}`} className="text-sm font-medium">
						Message ID
					</Label>
					<div className="flex items-center gap-2">
						<Input
							id={`message-id${idSuffix}`}
							placeholder="Leave empty to send new message"
							value={messageId}
							onChange={e => setMessageId(e.target.value)}
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
									toast.error('Failed to read clipboard')
									console.error('Failed to read clipboard:', err)
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
				{hasGames && (
					<AccordionItem value="game-visibility">
						<AccordionTrigger className="text-sm font-medium">
							Game Visibility
						</AccordionTrigger>
						<AccordionContent className="space-y-4 pt-2">
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
										const newValue = !allOptionsSelected
										updateSetting('includePrice', newValue)
										updateSetting('includeImage', newValue)
										updateSetting('includeFooter', newValue)
										updateSetting('includeCheckout', newValue)
										updateSetting('includeClaimGame', newValue)
									}}
									className="h-6 px-2 text-xs"
								>
									{allOptionsSelected ? 'Deselect All' : 'Select All'}
								</Button>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className={optionCheckboxClass}>
									<div className="flex justify-between gap-2">
										<Checkbox
											id={`include-price${idSuffix}`}
											checked={settings.includePrice}
											onCheckedChange={checked =>
												updateSetting('includePrice', checked as boolean)
											}
											className="order-1 after:absolute after:inset-0"
										/>
										<DollarSign className="opacity-60" size={16} aria-hidden="true" />
									</div>
									<Label htmlFor={`include-price${idSuffix}`}>Price</Label>
								</div>
								<div className={optionCheckboxClass}>
									<div className="flex justify-between gap-2">
										<Checkbox
											id={`include-image${idSuffix}`}
											checked={settings.includeImage}
											onCheckedChange={checked =>
												updateSetting('includeImage', checked as boolean)
											}
											className="order-1 after:absolute after:inset-0"
										/>
										<ImageIcon className="opacity-60" size={16} aria-hidden="true" />
									</div>
									<Label htmlFor={`include-image${idSuffix}`}>Images</Label>
								</div>
								<div className={optionCheckboxClass}>
									<div className="flex justify-between gap-2">
										<Checkbox
											id={`include-footer${idSuffix}`}
											checked={settings.includeFooter}
											onCheckedChange={checked =>
												updateSetting('includeFooter', checked as boolean)
											}
											className="order-1 after:absolute after:inset-0"
										/>
										<Clock className="opacity-60" size={16} aria-hidden="true" />
									</div>
									<Label htmlFor={`include-footer${idSuffix}`}>Footer</Label>
								</div>
								<div className={optionCheckboxClass}>
									<div className="flex justify-between gap-2">
										<Checkbox
											id={`include-checkout${idSuffix}`}
											checked={settings.includeCheckout}
											onCheckedChange={checked =>
												updateSetting('includeCheckout', checked as boolean)
											}
											className="order-1 after:absolute after:inset-0"
											disabled={selectedCurrentCount < 1}
										/>
										<ShoppingCart className="opacity-60" size={16} aria-hidden="true" />
									</div>
									<Label htmlFor={`include-checkout${idSuffix}`}>Checkout</Label>
								</div>
							</div>
							<div className="flex items-center justify-end gap-2">
								<Label htmlFor={`include-claim${idSuffix}`} className="text-sm">
									Claim Links
								</Label>
								<Checkbox
									id={`include-claim${idSuffix}`}
									checked={settings.includeClaimGame}
									onCheckedChange={checked =>
										updateSetting('includeClaimGame', checked as boolean)
									}
								/>
							</div>
							{settings.includeCheckout && selectedCurrentCount >= 1 && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label
											htmlFor={`checkout-link${idSuffix}`}
											className="text-sm font-medium"
										>
											Manual Checkout Link
										</Label>
									</div>
									<Textarea
										id={`checkout-link${idSuffix}`}
										placeholder="https://store.epicgames.com/purchase?offers=1-{namespace}-{id}-#"
										value={checkoutLink}
										onChange={e => setCheckoutLink(e.target.value)}
										className="max-h-25 text-sm wrap-anywhere"
									/>
									<div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs text-muted-foreground">
										<a
											href="https://up.wolfey.me/milb5OsF"
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
							<Label
								htmlFor={`sidebar-color${idSuffix}`}
								className="text-sm font-medium"
							>
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
									id={`sidebar-color${idSuffix}`}
									value={settings.embedColor}
									onChange={e => handleColorChange(e.target.value)}
									maxLength={7}
									className="text-sm"
								/>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="egdata">
					<AccordionTrigger className="text-sm font-medium">EGData</AccordionTrigger>
					<AccordionContent className="space-y-3 pt-2">
						<div className="space-y-3">
							<Label
								htmlFor={`mobile-game-url${idSuffix}`}
								className="text-sm font-medium"
							>
								Game URL
							</Label>
							<div className="flex items-center gap-2">
								<Input
									id={`mobile-game-url${idSuffix}`}
									placeholder="https://egdata.app/offers/..."
									value={mobileUrl}
									onChange={e => setMobileUrl(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && parseMobileGame()}
									className="text-sm"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={handleMobilePaste}
									disabled={isMobileLoading}
								>
									<Clipboard className="size-4" />
								</Button>
							</div>
							<Button
								onClick={parseMobileGame}
								className="w-full dark:text-black"
								size="sm"
								disabled={isMobileLoading || !mobileUrl.trim()}
							>
								{isMobileLoading ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									'Parse Game'
								)}
							</Button>
						</div>
						{parsedMobileGames.length > 0 && (
							<div className="space-y-2 pt-2 border-t">
								{parsedMobileGames.map(game => (
									<div
										key={`mobile-list${idSuffix}-${getMobileGameKey(game)}`}
										className="flex items-center justify-between text-sm p-2 rounded-md border"
									>
										<span className="truncate">
											{game.title}
											{game.iosOffer && !game.androidOffer
												? ' (iOS)'
												: !game.iosOffer && game.androidOffer
													? ' (Android)'
													: ''}
										</span>
										{(!storedMobileGameKeys ||
											storedMobileGameKeys.has(getMobileGameKey(game))) && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeParsedGame(game)}
													className="h-6 px-1 shrink-0"
												>
													<X className="size-3" />
												</Button>
											)}
									</div>
								))}
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	)
}
