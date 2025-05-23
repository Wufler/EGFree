'use client'
import { useState } from 'react'
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

export default function ClaimLinks({ games }: { games: Game }) {
	const [copiedUrl, setCopiedUrl] = useState('')

	const mysteryGames = games.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account'
	)

	const generateCheckoutUrl = (game: GameItem) => {
		if (!game.namespace || !game.id || mysteryGames) return null

		const offerId = `1-${game.namespace}-${game.id}-`
		return `https://store.epicgames.com/purchase?offers=${offerId}#/purchase/payment-methods`
	}

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

	const copyToClipboard = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url)
			setCopiedUrl(url)
			setTimeout(() => setCopiedUrl(''), 2000)
		} catch (err) {
			toast.error('Failed to copy URL')
		}
	}

	const bulkCheckoutUrl = generateBulkCheckoutUrl()

	const ClaimContent = () => (
		<div className="space-y-4">
			{mysteryGames ? (
				<div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
					<p className="text-yellow-800 dark:text-yellow-200 font-medium">
						This is currently disabled due to mystery games.
					</p>
				</div>
			) : (
				<>
					{bulkCheckoutUrl && (
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
				{mysteryGames ? (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-block">
									<Button
										className="rounded-full flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90"
										disabled={mysteryGames}
									>
										<ShoppingCart className="size-4" />
										Claim Games
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>This is currently disabled due to mystery games.</p>
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
				<ClaimContent />
			</DialogContent>
		</Dialog>
	)
}
