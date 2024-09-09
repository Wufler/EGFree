'use client'

import { useState, useEffect } from 'react'
import { ClipboardCopy, FileJson2, Send, Undo2 } from 'lucide-react'
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
import Loading from './Loading'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export default function Json({ games }: { games: any }) {
	const [jsonData, setJsonData] = useState<any>({})
	const [includeCurrent, setIncludeCurrent] = useState(true)
	const [includeUpcoming, setIncludeUpcoming] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [webhookUrl, setWebhookUrl] = useState('')
	const [content, setContent] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [embedColor, setEmbedColor] = useState('')
	const defaultColor = '#85ce4b'
	const defaultContent = '<@&847939354978811924>'

	useEffect(() => {
		const savedIncludeCurrent = localStorage.getItem('includeCurrent')
		const savedIncludeUpcoming = localStorage.getItem('includeUpcoming')
		const savedContent = localStorage.getItem('embedContent')
		const savedColor = localStorage.getItem('embedColor')

		if (savedIncludeCurrent !== null)
			setIncludeCurrent(JSON.parse(savedIncludeCurrent))
		if (savedIncludeUpcoming !== null)
			setIncludeUpcoming(JSON.parse(savedIncludeUpcoming))
		if (savedContent) setContent(savedContent)
		if (savedColor) setEmbedColor(savedColor)
	}, [])

	useEffect(() => {
		localStorage.setItem('embedContent', content)
		localStorage.setItem('includeCurrent', JSON.stringify(includeCurrent))
		localStorage.setItem('includeUpcoming', JSON.stringify(includeUpcoming))
		if (embedColor !== defaultColor) {
			localStorage.setItem('embedColor', embedColor)
		} else {
			localStorage.removeItem('embedColor')
		}
	}, [content, embedColor, includeCurrent, includeUpcoming])

	useEffect(() => {
		const generateJson = () => {
			const selectedGames = [
				...(includeCurrent ? games.currentGames : []),
				...(includeUpcoming ? games.nextGames : []),
			]

			const embeds = selectedGames.map((game: Game) => {
				const isCurrent = game.promotions.promotionalOffers.length > 0
				const dateInfo = isCurrent
					? game.promotions.promotionalOffers[0].promotionalOffers[0]
					: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
				const endDate = new Date(dateInfo.endDate)
				const pageSlug = game.catalogNs?.mappings?.[0]?.pageSlug || game.urlSlug
				const isBundleGame = game.categories?.some(
					(category: any) => category.path === 'bundles'
				)
				const linkPrefix = isBundleGame ? '/bundles/' : '/p/'

				const fieldValue = isCurrent
					? `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**\n[Claim ${
							isBundleGame ? 'Bundle' : 'Game'
					  }](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`
					: `${game.price.totalPrice.fmtPrice.originalPrice}\n[Game Link](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`

				return {
					color: parseInt((embedColor || defaultColor).replace('#', ''), 16),
					fields: [
						{
							name: game.title,
							value: fieldValue,
							inline: true,
						},
					],
					author: {
						name: 'Epic Games Store',
						url: 'https://egfreegames.vercel.app/',
						icon_url: 'https://i.imgur.com/ANplrW5.png',
					},
					footer: {
						text: isCurrent ? 'Offer ends' : 'Offer starts',
					},
					timestamp: endDate.toISOString(),
					image: {
						url: game.keyImages.find((img: any) => img.type === 'OfferImageWide')
							?.url,
					},
				}
			})

			setJsonData({
				content: content || defaultContent,
				embeds: embeds,
				attachments: [],
			})
		}

		generateJson()
	}, [games, includeCurrent, includeUpcoming, content, embedColor])

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
			toast.success('Copied JSON data to clipboard.')
		} catch (err) {
			console.error('Failed to copy text: ', err)
			toast.error('Failed to copy JSON data.')
		}
	}

	const sendToDiscord = async () => {
		if (!webhookUrl) {
			toast.error('Insert a Discord webhook.')
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
				toast.success('Successfully sent embed to Discord.')
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to send data to Discord')
			}
		} catch (err) {
			console.error('Failed to send to Discord: ', err)
			toast.error('Failed to send embed to Discord.', {
				description: 'The webhook might be invalid.',
			})
		}
		setIsLoading(false)
	}

	const handleColorChange = (color: string) => {
		setEmbedColor(color === defaultColor ? '' : color)
	}

	return (
		<div>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button variant="ghost" className="px-2 rounded-full">
						<FileJson2 />
					</Button>
				</DialogTrigger>
				<DialogContent
					className="max-w-3xl max-h-[80vh] flex flex-col"
					style={{ borderLeft: `3px solid ${embedColor || defaultColor}` }}
				>
					<DialogHeader>
						<DialogTitle>JSON Data for Discord</DialogTitle>
						<DialogDescription>
							Automatically saves your options locally, not webhook for security
							reasons.
						</DialogDescription>
					</DialogHeader>
					<div className="flex sm:flex-row flex-col items-center gap-4 p-1">
						<div className="flex gap-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="current-popup"
									checked={includeCurrent}
									onCheckedChange={checked => setIncludeCurrent(checked)}
								/>
								<label
									htmlFor="current-popup"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Current
								</label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="upcoming-popup"
									checked={includeUpcoming}
									onCheckedChange={checked => setIncludeUpcoming(checked)}
								/>
								<label
									htmlFor="upcoming-popup"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Upcoming
								</label>
							</div>
						</div>
					</div>
					<div className="flex flex-col gap-3">
						<Input
							placeholder={defaultContent}
							value={content}
							onChange={e => setContent(e.target.value)}
						/>
						<div className="flex sm:flex-row flex-col items-center gap-4">
							<div className="flex items-center sm:flex-row flex-col gap-3 w-full">
								<div className="flex w-full gap-3 items-center">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												className="w-10"
												style={{
													backgroundColor: embedColor || defaultColor,
												}}
											/>
										</PopoverTrigger>
										<PopoverContent
											className="w-full"
											onOpenAutoFocus={e => e.preventDefault()}
										>
											<Input
												maxLength={7}
												value={embedColor || defaultColor}
												onChange={e => handleColorChange(e.target.value)}
												className="mb-2"
											/>
											<HexColorPicker
												color={embedColor || defaultColor}
												onChange={handleColorChange}
												className="!w-full"
											/>
											<Button
												onClick={() => setEmbedColor(defaultColor)}
												variant="outline"
												size="sm"
												className="mt-2 flex items-center gap-2 w-full"
											>
												<Undo2 className="size-4" />
												<span className="sr-only ">Revert to default</span>
												Revert to default
											</Button>
										</PopoverContent>
									</Popover>
									<Input
										type={isVisible ? 'text' : 'password'}
										onFocus={() => setIsVisible(true)}
										onBlur={() => setIsVisible(false)}
										placeholder="Webhook URL"
										value={webhookUrl}
										onChange={e => setWebhookUrl(e.target.value)}
									/>
								</div>
								<Button
									onClick={sendToDiscord}
									disabled={isLoading}
									size="sm"
									className="flex items-center w-full sm:w-auto gap-2"
								>
									<span className="sr-only">Send</span>
									{isLoading ? (
										<>
											<Loading size={16} />
											<p>Send</p>
										</>
									) : (
										<>
											<Send className="size-4" />
											<p>Send </p>
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
					<pre className="dark:bg-gray-900 bg-gray-800 text-gray-200 p-4 rounded overflow-auto flex-grow text-sm">
						{JSON.stringify(jsonData, null, 2)}
					</pre>
					<Button
						onClick={copyToClipboard}
						variant="outline"
						size="sm"
						className="flex items-center w-full sm:w-auto p-4 gap-2"
					>
						<ClipboardCopy className="size-4" />
						<span className="sr-only ">Copy to clipboard</span>
						Copy JSON
					</Button>
				</DialogContent>
			</Dialog>
		</div>
	)
}
