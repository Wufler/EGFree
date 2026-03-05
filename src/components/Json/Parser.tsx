'use client'
import { useState } from 'react'
import {
	ClipboardCopy,
	Smartphone,
	Loader2,
	Check,
	X,
	Send,
	Clipboard,
	AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateDiscordEmbed } from '@/lib/EGData'

type MobileGameDataLocal = {
	title: string
	namespace: string
	imageUrl: string
	originalPrice: number
	currencyCode: string
	promoEndDate: string
	iosOffer: { id: string; pageSlug: string } | null
	androidOffer: { id: string; pageSlug: string } | null
}

type PlatformChoice = 'both' | 'ios' | 'android'
type EnteredPlatform = 'ios' | 'android'

type ParseGameResponse = {
	gameData: MobileGameDataLocal
	discordPayload: object
	enteredPlatform: EnteredPlatform | null
	error?: string
}

export default function MobileGameParser() {
	const [url, setUrl] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [jsonData, setJsonData] = useState<object | null>(null)
	const [gameData, setGameData] = useState<MobileGameDataLocal | null>(null)
	const [pendingGameData, setPendingGameData] =
		useState<MobileGameDataLocal | null>(null)
	const [pendingPlatform, setPendingPlatform] = useState<EnteredPlatform | null>(
		null,
	)
	const [isPlatformPromptOpen, setIsPlatformPromptOpen] = useState(false)
	const [webhookUrl, setWebhookUrl] = useState('')
	const [isVisible, setIsVisible] = useState(false)
	const [showWarning, setShowWarning] = useState(false)
	const [isSending, setIsSending] = useState(false)

	const closePlatformPrompt = () => {
		setIsPlatformPromptOpen(false)
		setPendingGameData(null)
		setPendingPlatform(null)
	}

	const applyPlatformChoice = (choice: PlatformChoice) => {
		if (!pendingGameData) return
		const filteredGameData: MobileGameDataLocal = {
			...pendingGameData,
			iosOffer: choice === 'android' ? null : pendingGameData.iosOffer,
			androidOffer: choice === 'ios' ? null : pendingGameData.androidOffer,
		}
		setGameData(filteredGameData)
		setJsonData(generateDiscordEmbed(filteredGameData))
		closePlatformPrompt()
	}

	const handleParseResponse = (data: ParseGameResponse) => {
		const hasBothPlatforms = Boolean(
			data.gameData.iosOffer && data.gameData.androidOffer,
		)
		if (hasBothPlatforms && data.enteredPlatform) {
			setPendingGameData(data.gameData)
			setPendingPlatform(data.enteredPlatform)
			setIsPlatformPromptOpen(true)
			return
		}
		setJsonData(data.discordPayload)
		setGameData(data.gameData)
	}

	const parseGame = async () => {
		if (!url.trim()) {
			toast.error('Please enter a URL')
			return
		}

		setIsLoading(true)
		setJsonData(null)
		setGameData(null)
		closePlatformPrompt()

		try {
			const response = await fetch('/api/parse-game', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: url.trim() }),
			})

			const data = (await response.json()) as ParseGameResponse

			if (!response.ok) {
				throw new Error(data.error || 'Failed to parse game')
			}

			handleParseResponse(data)
			toast.success(`Parsed: ${data.gameData.title}`)
		} catch (error) {
			console.error('Parse error:', error)
			toast.error(error instanceof Error ? error.message : 'Failed to parse game')
		} finally {
			setIsLoading(false)
		}
	}

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setUrl(text)
			if (text.trim()) {
				setIsLoading(true)
				setJsonData(null)
				setGameData(null)
				closePlatformPrompt()
				try {
					const response = await fetch('/api/parse-game', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ url: text.trim() }),
					})
					const data = (await response.json()) as ParseGameResponse
					if (response.ok) {
						handleParseResponse(data)
						toast.success(`Parsed: ${data.gameData.title}`)
					} else {
						throw new Error(data.error)
					}
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : 'Failed to parse game',
					)
				} finally {
					setIsLoading(false)
				}
			}
		} catch {
			toast.error('Failed to read clipboard')
		}
	}

	const copyToClipboard = async () => {
		if (!jsonData) return
		try {
			await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 1000)
			toast.success('Copied to clipboard')
		} catch {
			toast.error('Failed to copy')
		}
	}

	const isValidDiscordWebhook = (url: string) => {
		const webhookPattern =
			/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+\/?$/
		return webhookPattern.test(url.trim())
	}

	const handleWebhook = async () => {
		if (!webhookUrl || !jsonData) {
			toast.error('Insert a webhook and parse a game first.')
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
			setIsSending(true)
			setShowWarning(false)
			const response = await fetch('/api/webhook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ webhookUrl, jsonData }),
			})

			if (response.ok) {
				toast.success('Successfully sent to Discord!')
			} else {
				throw new Error('Failed to send')
			}
		} catch (error) {
			toast.error('Failed to send to webhook')
			console.error('Webhook error:', error)
		} finally {
			setIsSending(false)
		}
	}

	const handleWebhookPaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrl(text)
		} catch {
			toast.error('Failed to paste')
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="rounded-full">
					<Smartphone className="size-5!" />
					EGData
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
							<AlertDialogTitle>Mobile link options</AlertDialogTitle>
							<AlertDialogDescription>
								Choose whether to include both platforms or only the{' '}
								{pendingPlatform === 'ios' ? 'iOS' : 'Android'} link you entered.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
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
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				<div className="flex h-[90vh] flex-col lg:flex-row">
					<div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r flex flex-col">
						<div className="p-6 pb-4 lg:border-b shrink-0">
							<div className="flex items-center justify-between">
								<DialogTitle className="flex items-center gap-2">EGData</DialogTitle>
								<DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
									<X className="size-4" />
									<span className="sr-only">Close</span>
								</DialogClose>
							</div>
							<DialogDescription className="mt-1.5">
								Paste an egdata.app link to generate a Discord embed.
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
												<Label htmlFor="game-url" className="text-sm font-medium">
													Game URL
												</Label>
												<div className="flex items-center gap-2">
													<Input
														id="game-url"
														placeholder="https://egdata.app/offers/..."
														value={url}
														onChange={e => setUrl(e.target.value)}
														onKeyDown={e => e.key === 'Enter' && parseGame()}
														className="text-sm"
													/>
													<Button
														variant="outline"
														size="icon"
														onClick={handlePaste}
														disabled={isLoading}
													>
														<Clipboard className="size-4" />
													</Button>
												</div>
												<Button
													onClick={parseGame}
													className="w-full dark:text-black"
													size="sm"
													disabled={isLoading || !url.trim()}
												>
													{isLoading ? (
														<Loader2 className="size-4 animate-spin" />
													) : (
														'Parse Game'
													)}
												</Button>
											</div>

											{gameData && (
												<div className="rounded-lg border p-3 space-y-2 bg-muted/50">
													<div className="font-medium">{gameData.title}</div>
													<div className="text-sm text-muted-foreground space-y-1">
														<div>iOS: {gameData.iosOffer ? '✓' : '✗'}</div>
														<div>Android: {gameData.androidOffer ? '✓' : '✗'}</div>
														{gameData.promoEndDate && (
															<div>
																Ends: {new Date(gameData.promoEndDate).toLocaleDateString()}
															</div>
														)}
													</div>
												</div>
											)}

											<div className="space-y-3">
												<Label htmlFor="webhook-url" className="text-sm font-medium">
													Webhook URL
												</Label>
												<div className="flex items-center gap-2">
													<Input
														id="webhook-url"
														type={isVisible ? 'text' : 'password'}
														onFocus={() => setIsVisible(true)}
														onBlur={() => setIsVisible(false)}
														placeholder="https://discord.com/api/webhooks/..."
														value={webhookUrl}
														onChange={e => setWebhookUrl(e.target.value)}
														className={`text-sm ${
															webhookUrl && !isValidDiscordWebhook(webhookUrl)
																? 'border-red-500 focus:border-red-500'
																: ''
														}`}
													/>
													<Button variant="outline" size="icon" onClick={handleWebhookPaste}>
														<Clipboard className="size-4" />
													</Button>
												</div>
											</div>

											<div className="flex gap-2">
												<Button
													onClick={copyToClipboard}
													variant="outline"
													size="sm"
													disabled={!jsonData}
													className="flex-1"
												>
													{isCopied ? (
														<Check className="size-4" />
													) : (
														<ClipboardCopy className="size-4" />
													)}
													{isCopied ? 'Copied!' : 'Copy JSON'}
												</Button>
												<Button
													onClick={handleWebhook}
													size="sm"
													disabled={
														isSending || !jsonData || !isValidDiscordWebhook(webhookUrl)
													}
													className={`flex-1 ${
														showWarning
															? 'bg-yellow-500 hover:bg-yellow-600 text-black'
															: 'dark:text-black'
													}`}
												>
													{isSending ? (
														<Loader2 className="size-4 animate-spin" />
													) : showWarning ? (
														<AlertTriangle className="size-4" />
													) : (
														<Send className="size-4" />
													)}
													{showWarning ? 'Click again' : 'Send'}
												</Button>
											</div>
										</div>
									</ScrollArea>
								</TabsContent>
								<TabsContent
									value="preview"
									className="overflow-hidden mt-0 pb-0 border-0"
								>
									<ScrollArea className="h-[calc(90vh-150px)]">
										<div className="p-4">
											{jsonData ? (
												<pre className="bg-secondary text-secondary-foreground p-4 overflow-auto text-xs whitespace-pre-wrap break-all">
													{JSON.stringify(jsonData, null, 2)}
												</pre>
											) : (
												<div className="text-center text-muted-foreground py-8">
													Parse a game to see preview
												</div>
											)}
										</div>
									</ScrollArea>
								</TabsContent>
							</Tabs>
						</div>

						<div className="hidden lg:block p-4 overflow-auto flex-1">
							<div className="space-y-4">
								<div className="space-y-3">
									<Label htmlFor="game-url-lg" className="text-sm font-medium">
										Game URL
									</Label>
									<div className="flex items-center gap-2">
										<Input
											id="game-url-lg"
											placeholder="https://egdata.app/offers/..."
											value={url}
											onChange={e => setUrl(e.target.value)}
											onKeyDown={e => e.key === 'Enter' && parseGame()}
											className="text-sm"
										/>
										<Button
											variant="outline"
											size="icon"
											onClick={handlePaste}
											disabled={isLoading}
										>
											<Clipboard className="size-4" />
										</Button>
									</div>
									<Button
										onClick={parseGame}
										className="w-full dark:text-black"
										size="sm"
										disabled={isLoading || !url.trim()}
									>
										{isLoading ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											'Parse Game'
										)}
									</Button>
								</div>

								{gameData && (
									<div className="rounded-lg border p-3 space-y-2 bg-muted/50">
										<div className="font-medium">{gameData.title}</div>
										<div className="text-sm text-muted-foreground space-y-1">
											<div>iOS: {gameData.iosOffer ? '✓' : '✗'}</div>
											<div>Android: {gameData.androidOffer ? '✓' : '✗'}</div>
											{gameData.promoEndDate && (
												<div>
													Ends: {new Date(gameData.promoEndDate).toLocaleDateString()}
												</div>
											)}
										</div>
									</div>
								)}

								<div className="space-y-3">
									<Label htmlFor="webhook-url-lg" className="text-sm font-medium">
										Webhook URL
									</Label>
									<div className="flex items-center gap-2">
										<Input
											id="webhook-url-lg"
											type={isVisible ? 'text' : 'password'}
											onFocus={() => setIsVisible(true)}
											onBlur={() => setIsVisible(false)}
											placeholder="https://discord.com/api/webhooks/..."
											value={webhookUrl}
											onChange={e => setWebhookUrl(e.target.value)}
											className={`text-sm ${
												webhookUrl && !isValidDiscordWebhook(webhookUrl)
													? 'border-red-500 focus:border-red-500'
													: ''
											}`}
										/>
										<Button variant="outline" size="icon" onClick={handleWebhookPaste}>
											<Clipboard className="size-4" />
										</Button>
									</div>
								</div>

								<div className="flex gap-2">
									<Button
										onClick={copyToClipboard}
										variant="outline"
										size="sm"
										disabled={!jsonData}
										className="flex-1"
									>
										{isCopied ? (
											<Check className="size-4" />
										) : (
											<ClipboardCopy className="size-4" />
										)}
										{isCopied ? 'Copied!' : 'Copy JSON'}
									</Button>
									<Button
										onClick={handleWebhook}
										size="sm"
										disabled={
											isSending || !jsonData || !isValidDiscordWebhook(webhookUrl)
										}
										className={`flex-1 ${
											showWarning
												? 'bg-yellow-500 hover:bg-yellow-600 text-black'
												: 'dark:text-black'
										}`}
									>
										{isSending ? (
											<Loader2 className="size-4 animate-spin" />
										) : showWarning ? (
											<AlertTriangle className="size-4" />
										) : (
											<Send className="size-4" />
										)}
										{showWarning ? 'Click again' : 'Send'}
									</Button>
								</div>
							</div>
						</div>
					</div>

					<div className="hidden lg:flex w-1/2 flex-col">
						<div className="p-6 pb-4 border-b shrink-0">
							<h3 className="font-semibold">Preview</h3>
						</div>
						<ScrollArea className="flex-1">
							<div className="p-4">
								{jsonData ? (
									<pre className="bg-secondary text-secondary-foreground p-4 overflow-auto text-xs whitespace-pre-wrap break-all">
										{JSON.stringify(jsonData, null, 2)}
									</pre>
								) : (
									<div className="text-center text-muted-foreground py-8">
										Parse a game to see preview
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
