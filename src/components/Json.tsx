'use client'

import { useState, useEffect } from 'react'
import { ClipboardCopy, FileJson2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import Loading from './Loading'

interface Game {
	id: string
	title: string
	description: string
	keyImages: Array<{ type: string; url: string }>
	price: {
		totalPrice: {
			fmtPrice: {
				originalPrice: string
				discountPrice: string
			}
		}
	}
	promotions: {
		promotionalOffers: Array<{
			promotionalOffers: Array<{
				startDate: string
				endDate: string
			}>
		}>
		upcomingPromotionalOffers: Array<{
			promotionalOffers: Array<{
				startDate: string
				endDate: string
			}>
		}>
	}
	catalogNs: {
		mappings: Array<{ pageSlug: string }>
	}
	urlSlug: string
	categories: Array<{ path: string }>
}

export default function Json({ games }: { games: any }) {
	const [jsonData, setJsonData] = useState<any>({})
	const [includeCurrent, setIncludeCurrent] = useState(true)
	const [includeUpcoming, setIncludeUpcoming] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [webhookUrl, setWebhookUrl] = useState('')
	const [content, setContent] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const defaultContent = '<@&847939354978811924>'

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

				return {
					color: 8769099,
					fields: [
						{
							name: game.title,
							value: `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**\n[Claim Game](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`,
							inline: true,
						},
					],
					author: {
						name: 'Epic Games Store',
						url: 'https://store.epicgames.com/en-US/free-games',
						icon_url: 'https://i.imgur.com/ANplrW5.png',
					},
					footer: {
						text: 'Offer ends',
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
	}, [games, includeCurrent, includeUpcoming, content])

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

	return (
		<div>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button variant="ghost" className="px-2 rounded-full">
						<FileJson2 />
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>JSON Data for Discord</DialogTitle>
					</DialogHeader>
					<div className="flex sm:flex-row flex-col items-center gap-4 p-1">
						<div className="flex gap-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="current-popup"
									checked={includeCurrent}
									onCheckedChange={checked => setIncludeCurrent(checked as boolean)}
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
									onCheckedChange={checked => setIncludeUpcoming(checked as boolean)}
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
					<div className="flex flex-col gap-4">
						<Textarea
							placeholder={defaultContent}
							value={content}
							onChange={e => setContent(e.target.value)}
							rows={3}
						/>
						<div className="flex sm:flex-row flex-col items-center gap-4">
							<Input
								type="text"
								placeholder="Discord Webhook URL"
								value={webhookUrl}
								onChange={e => setWebhookUrl(e.target.value)}
								className="flex-grow"
							/>
							<Button
								onClick={sendToDiscord}
								disabled={isLoading}
								size="sm"
								className="flex items-center w-full sm:w-auto gap-2"
							>
								<span className="sr-only">Send to Discord</span>
								{isLoading ? (
									<>
										<Loading size={16} />
										<p>Send to Discord</p>
									</>
								) : (
									<>
										<Send className="size-4" />
										<p>Send to Discord</p>
									</>
								)}
							</Button>
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
