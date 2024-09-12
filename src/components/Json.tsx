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
import { Label } from './ui/label'

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
	const [includeFooter, setIncludeFooter] = useState(true)
	const [includePrice, setIncludePrice] = useState(true)
	const [includeImage, setIncludeImage] = useState(true)
	const [allDisabled, setAllDisabled] = useState(false)
	const defaultColor = '#85ce4b'
	const defaultContent = '<@&847939354978811924>'

	useEffect(() => {
		const savedIncludeCurrent = localStorage.getItem('includeCurrent')
		const savedIncludeUpcoming = localStorage.getItem('includeUpcoming')
		const savedContent = localStorage.getItem('embedContent')
		const savedColor = localStorage.getItem('embedColor')
		const savedIncludeFooter = localStorage.getItem('includeFooter')
		const savedIncludePrice = localStorage.getItem('includePrice')
		const savedIncludeImage = localStorage.getItem('includeImage')

		if (savedIncludeCurrent !== null)
			setIncludeCurrent(JSON.parse(savedIncludeCurrent))
		if (savedIncludeUpcoming !== null)
			setIncludeUpcoming(JSON.parse(savedIncludeUpcoming))
		if (savedContent) setContent(savedContent)
		if (savedColor) setEmbedColor(savedColor)
		if (savedIncludeFooter !== null)
			setIncludeFooter(JSON.parse(savedIncludeFooter))
		if (savedIncludePrice !== null) setIncludePrice(JSON.parse(savedIncludePrice))
		if (savedIncludeImage !== null) setIncludeImage(JSON.parse(savedIncludeImage))
	}, [])

	useEffect(() => {
		setAllDisabled(!includeCurrent && !includeUpcoming)

		localStorage.setItem('embedContent', content)
		localStorage.setItem('includeCurrent', JSON.stringify(includeCurrent))
		localStorage.setItem('includeUpcoming', JSON.stringify(includeUpcoming))
		localStorage.setItem('includeFooter', JSON.stringify(includeFooter))
		localStorage.setItem('includePrice', JSON.stringify(includePrice))
		localStorage.setItem('includeImage', JSON.stringify(includeImage))
		if (embedColor !== defaultColor) {
			localStorage.setItem('embedColor', embedColor)
		} else {
			localStorage.removeItem('embedColor')
		}
	}, [
		content,
		embedColor,
		includeCurrent,
		includeUpcoming,
		includeFooter,
		includePrice,
		includeImage,
	])

	useEffect(() => {
		const generateJson = () => {
			const selectedGames = [
				...(includeCurrent ? games.currentGames : []),
				...(includeUpcoming ? games.nextGames : []),
			]

			const embeds = selectedGames.map((game: any) => {
				const isCurrent = game.promotions.promotionalOffers.length > 0
				const dateInfo = isCurrent
					? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
					: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
							.startDate
				const endDate = new Date(dateInfo)
				const pageSlug = game.catalogNs?.mappings?.[0]?.pageSlug || game.urlSlug
				const isBundleGame = game.categories?.some(
					(category: any) => category.path === 'bundles'
				)
				const linkPrefix = isBundleGame ? '/bundles/' : '/p/'

				let fieldValue = isCurrent
					? `${
							includePrice
								? `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**\n`
								: ''
					  }[Claim ${
							isBundleGame ? 'Bundle' : 'Game'
					  }](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`
					: `${
							includePrice ? `${game.price.totalPrice.fmtPrice.originalPrice}\n` : ''
					  }[Game Link](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`

				const imageUrl = game.keyImages.find(
					(img: any) => img.type === 'OfferImageWide'
				)?.url

				return {
					color: parseInt((embedColor || defaultColor).replace('#', ''), 16),
					fields: [
						{
							name: game.title,
							value: fieldValue,
						},
					],
					author: {
						name: 'Epic Games Store',
						url: 'https://egfreegames.vercel.app/',
						icon_url: 'https://i.imgur.com/ANplrW5.png',
					},
					...(includeFooter && {
						footer: {
							text: isCurrent ? 'Offer ends' : 'Offer starts',
						},
						timestamp: endDate.toISOString(),
					}),
					...(includeImage && { image: { url: encodeURI(imageUrl) } }),
				}
			})

			setJsonData({
				content: content || defaultContent,
				embeds: embeds,
				attachments: [],
			})
		}

		generateJson()
	}, [
		games,
		includeCurrent,
		includeUpcoming,
		content,
		embedColor,
		includeFooter,
		includePrice,
		includeImage,
	])

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
			toast.success('Copied JSON Data to clipboard.')
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
				toast.success('Successfully sent embed.', { position: 'bottom-center' })
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to send JSON Data.')
			}
		} catch (error) {
			console.error('Failed to send:', error, {
				position: 'bottom-center',
			})
			toast.error('Failed to send JSON Data.', {
				description: 'The webhook might be invalid.',
				position: 'bottom-center',
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
						<DialogTitle>JSON Data</DialogTitle>
						<DialogDescription>
							This tool is designed to create Discord embeds. Your preferences are
							stored locally, except your webhook.
						</DialogDescription>
					</DialogHeader>
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
									onClick={handleWebhook}
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
						<div className="flex flex-wrap gap-4 mt-1">
							<div className="flex items-center space-x-2">
								<Switch
									id="current-games"
									checked={includeCurrent}
									onCheckedChange={checked => setIncludeCurrent(checked)}
								/>
								<Label
									htmlFor="current-games"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Current
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="upcoming-games"
									checked={includeUpcoming}
									onCheckedChange={checked => setIncludeUpcoming(checked)}
								/>
								<Label
									htmlFor="upcoming-games"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Upcoming
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="include-footer"
									checked={includeFooter}
									onCheckedChange={checked => setIncludeFooter(checked)}
									disabled={allDisabled}
								/>
								<Label
									htmlFor="include-footer"
									className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
										allDisabled ? 'opacity-50' : ''
									}`}
								>
									Footer
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="include-price"
									checked={includePrice}
									onCheckedChange={checked => setIncludePrice(checked)}
									disabled={allDisabled}
								/>
								<Label
									htmlFor="include-price"
									className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
										allDisabled ? 'opacity-50' : ''
									}`}
								>
									Price
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="include-image"
									checked={includeImage}
									onCheckedChange={checked => setIncludeImage(checked)}
									disabled={allDisabled}
								/>
								<Label
									htmlFor="include-image"
									className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
										allDisabled ? 'opacity-50' : ''
									}`}
								>
									Image
								</Label>
							</div>
						</div>
					</div>
					<pre className="dark:bg-gray-900 bg-gray-800 text-gray-200 p-4 rounded overflow-auto flex-grow text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
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
