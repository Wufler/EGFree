'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Check, Copy, ExternalLink, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { getMobileGameKey } from '@/lib/utils'

export default function ClaimLinks({ games }: { games: Game }) {
	const [copiedUrl, setCopiedUrl] = useState('')
	const [parsedMobileGames, setParsedMobileGames] = useState<
		MobileGameDataLocal[]
	>([])

	useEffect(() => {
		if (typeof window === 'undefined') return
		const load = () => {
			try {
				const stored = localStorage.getItem('parsedMobileGames')
				const parsed = stored ? JSON.parse(stored) : []
				setParsedMobileGames(Array.isArray(parsed) ? parsed : [])
			} catch {
				setParsedMobileGames([])
			}
		}
		load()
		window.addEventListener('parsedMobileGamesUpdated', load)
		return () => window.removeEventListener('parsedMobileGamesUpdated', load)
	}, [])

	const mysteryGames = games.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account',
	)
	const now = new Date()
	const activeMobileGames = parsedMobileGames.filter(
		g => g.promoEndDate && new Date(g.promoEndDate) > now,
	)
	const noCurrentGames =
		games.currentGames.length === 0 && activeMobileGames.length === 0
	const isDisabled = mysteryGames || noCurrentGames

	const generateCheckoutUrl = (game: GameItem) => {
		if (!game.namespace || !game.id || mysteryGames) return null

		const offerId = `1-${game.namespace}-${game.id}-`
		return `https://store.epicgames.com/purchase?offers=${offerId}#`
	}

	const generateMobileCheckoutUrl = (mg: MobileGameDataLocal) => {
		const offerParams: string[] = []
		if (mg.iosOffer) offerParams.push(`1-${mg.namespace}-${mg.iosOffer.id}--`)
		if (mg.androidOffer)
			offerParams.push(`1-${mg.namespace}-${mg.androidOffer.id}--`)
		if (offerParams.length === 0) return null
		return `https://store.epicgames.com/purchase?offers=${offerParams.join('&offers=')}#/`
	}

	const generateBulkCheckoutUrl = () => {
		if (mysteryGames) return null

		const pcOffers = games.currentGames
			.map(game => {
				if (!game.namespace || !game.id) return null
				return `1-${game.namespace}-${game.id}-`
			})
			.filter(Boolean)

		const mobileOffers = activeMobileGames.flatMap(mg => {
			const offers: string[] = []
			if (mg.iosOffer) offers.push(`1-${mg.namespace}-${mg.iosOffer.id}--`)
			if (mg.androidOffer) offers.push(`1-${mg.namespace}-${mg.androidOffer.id}--`)
			return offers
		})

		const offers = [...pcOffers, ...mobileOffers]
		if (offers.length === 0) return null

		const offersParam = offers.map(offer => `offers=${offer}`).join('&')
		return `https://store.epicgames.com/purchase?${offersParam}#`
	}

	const copyToClipboard = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url)
			setCopiedUrl(url)
			setTimeout(() => setCopiedUrl(''), 2000)
		} catch (err) {
			console.error(err)
			toast.error('Failed to copy URL')
		}
	}

	const bulkCheckoutUrl = generateBulkCheckoutUrl()

	const renderClaimContent = () => (
		<div className="space-y-4">
			{mysteryGames ? (
				<div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
					<p className="text-yellow-800 dark:text-yellow-200 font-medium">
						This is currently disabled due to mystery games.
					</p>
				</div>
			) : (
				<>
					{bulkCheckoutUrl &&
						games.currentGames.length + activeMobileGames.length > 1 && (
							<div className="p-4 bg-epic-blue/10 rounded-lg border border-epic-blue/20">
								<h4 className="font-semibold text-epic-blue mb-2">
									Claim All Free Games
								</h4>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => copyToClipboard(bulkCheckoutUrl)}
										className="flex items-center gap-2"
									>
										{copiedUrl === bulkCheckoutUrl ? (
											<Check className="size-4" />
										) : (
											<Copy className="size-4" />
										)}
										Copy
									</Button>
									<Button
										size="sm"
										className="flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90"
										asChild
									>
										<a href={bulkCheckoutUrl} target="_blank" rel="noopener noreferrer">
											<ExternalLink className="size-4" />
											Claim All
										</a>
									</Button>
								</div>
							</div>
						)}

					<div className="space-y-3">
						{games.currentGames.map(game => {
							const checkoutUrl = generateCheckoutUrl(game)

							if (!checkoutUrl) {
								return (
									<div
										key={game.id}
										className="flex items-center justify-between p-3 border rounded-lg"
									>
										<span className="font-medium">{game.title}</span>
										<span className="text-sm text-muted-foreground">Unavailable</span>
									</div>
								)
							}

							return (
								<div
									key={game.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<span className="font-medium wrap-anywhere pr-4">{game.title}</span>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => copyToClipboard(checkoutUrl)}
											className="flex items-center gap-2"
										>
											{copiedUrl === checkoutUrl ? (
												<Check className="size-4" />
											) : (
												<Copy className="size-4" />
											)}
											Copy
										</Button>
										<Button
											size="sm"
											className="flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90"
											asChild
										>
											<a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="size-4" />
												Claim
											</a>
										</Button>
									</div>
								</div>
							)
						})}
						{activeMobileGames.map(mg => {
							const checkoutUrl = generateMobileCheckoutUrl(mg)
							if (!checkoutUrl) return null
							const platformLabel =
								mg.iosOffer && mg.androidOffer
									? 'iOS & Android'
									: mg.iosOffer
										? 'iOS'
										: mg.androidOffer
											? 'Android'
											: ''
							return (
								<div
									key={getMobileGameKey(mg)}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<span className="font-medium wrap-anywhere pr-4">
										{mg.title}
										{platformLabel && (
											<span className="text-xs text-muted-foreground ml-1">
												({platformLabel})
											</span>
										)}
									</span>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => copyToClipboard(checkoutUrl)}
											className="flex items-center gap-2"
										>
											{copiedUrl === checkoutUrl ? (
												<Check className="size-4" />
											) : (
												<Copy className="size-4" />
											)}
											Copy
										</Button>
										<Button
											size="sm"
											className="flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90"
											asChild
										>
											<a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="size-4" />
												Claim
											</a>
										</Button>
									</div>
								</div>
							)
						})}
					</div>
				</>
			)}

			<div className="text-xs text-muted-foreground mt-4">
				<p>
					You are required to be logged into your Epic Games account before claiming
					the games.
				</p>
			</div>
		</div>
	)

	return (
		<Dialog>
			<DialogTrigger asChild>
				{isDisabled ? (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-block">
									<Button
										className="rounded-full flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90"
										disabled
									>
										<ShoppingCart className="size-4" />
										Claim Games
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									{mysteryGames
										? 'This is currently disabled due to mystery games'
										: 'No current free games or mobile games to claim'}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				) : (
					<Button className="rounded-full flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90">
						<ShoppingCart className="size-4" />
						Claim Games
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShoppingCart className="size-5" />
						Epic Games Store Checkout Links
					</DialogTitle>
					<DialogDescription>
						Here you can instantly checkout using generated checkout links to claim
						all current free games.
					</DialogDescription>
				</DialogHeader>
				{renderClaimContent()}
			</DialogContent>
		</Dialog>
	)
}
