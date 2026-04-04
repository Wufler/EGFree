'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { getMobileGameKey } from '@/lib/utils'
import { toast } from 'sonner'

const EMPTY_MOBILE_GAMES: MobileGameDataLocal[] = []

export default function ClaimTab({
	games,
	parsedMobileGames = EMPTY_MOBILE_GAMES,
}: {
	games: Game
	parsedMobileGames?: MobileGameDataLocal[]
}) {
	const [copiedUrl, setCopiedUrl] = useState('')
	const [combinedDialogGame, setCombinedDialogGame] =
		useState<MobileGameDataLocal | null>(null)

	const mysteryGames = games.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account',
	)

	const now = new Date()
	const activeMobileGames = parsedMobileGames.filter(
		g => g.promoEndDate && new Date(g.promoEndDate) > now,
	)

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

	const mobileCheckoutUrlForPlatform = (
		mg: MobileGameDataLocal,
		platform: 'ios' | 'android',
	) => {
		if (platform === 'ios' && mg.iosOffer) {
			return `https://store.epicgames.com/purchase?offers=1-${mg.namespace}-${mg.iosOffer.id}--#/`
		}
		if (platform === 'android' && mg.androidOffer) {
			return `https://store.epicgames.com/purchase?offers=1-${mg.namespace}-${mg.androidOffer.id}--#/`
		}
		return null
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
		return `https://store.epicgames.com/purchase?${offersParam}#/`
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

	return (
		<Card className="rounded-none border-none bg-transparent shadow-none p-0 gap-0">
			<Dialog
				open={combinedDialogGame !== null}
				onOpenChange={open => {
					if (!open) setCombinedDialogGame(null)
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Choose platform</DialogTitle>
						<DialogDescription>
							Copy or open checkout for iOS or Android.
						</DialogDescription>
					</DialogHeader>
					{combinedDialogGame ? (
						<div className="grid gap-4">
							<div className="space-y-2">
								<p className="text-sm font-medium">iOS</p>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-2"
										onClick={() => {
											const url = mobileCheckoutUrlForPlatform(
												combinedDialogGame,
												'ios',
											)
											if (url) copyToClipboard(url)
										}}
									>
										{copiedUrl ===
											mobileCheckoutUrlForPlatform(combinedDialogGame, 'ios') ? (
											<Check className="size-4" />
										) : (
											<Copy className="size-4" />
										)}
										Copy
									</Button>
									<Button size="sm" className="flex items-center gap-2" asChild>
										<a
											href={
												mobileCheckoutUrlForPlatform(combinedDialogGame, 'ios') ?? '#'
											}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLink className="size-4" />
											Claim
										</a>
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium">Android</p>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-2"
										onClick={() => {
											const url = mobileCheckoutUrlForPlatform(
												combinedDialogGame,
												'android',
											)
											if (url) copyToClipboard(url)
										}}
									>
										{copiedUrl ===
											mobileCheckoutUrlForPlatform(combinedDialogGame, 'android') ? (
											<Check className="size-4" />
										) : (
											<Copy className="size-4" />
										)}
										Copy
									</Button>
									<Button size="sm" className="flex items-center gap-2" asChild>
										<a
											href={
												mobileCheckoutUrlForPlatform(combinedDialogGame, 'android') ??
												'#'
											}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLink className="size-4" />
											Claim
										</a>
									</Button>
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
			<CardContent className="px-0">
				<div className="space-y-3">
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
									<div className="bg-epic-blue/10 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between p-3 border rounded-lg">
										<h4 className="font-semibold text-epic-blue">
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
												className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg"
											>
												<span className="font-medium">{game.title}</span>
												<span className="text-sm text-muted-foreground">Unavailable</span>
											</div>
										)
									}

									return (
										<div
											key={game.id}
											className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between p-3 border rounded-lg"
										>
											<span className="font-medium wrap-anywhere sm:pr-4">
												{game.title}
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
								{activeMobileGames.map(mg => {
									const checkoutUrl = generateMobileCheckoutUrl(mg)
									const hasBothPlatforms = Boolean(
										mg.iosOffer && mg.androidOffer,
									)
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
											className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between p-3 border rounded-lg"
										>
											<span className="font-medium wrap-anywhere sm:pr-4">
												{mg.title}
												{platformLabel && (
													<span className="text-xs text-muted-foreground ml-1">
														({platformLabel})
													</span>
												)}
											</span>
											<div className="flex items-center gap-2">
												{hasBothPlatforms ? (
													<>
														<Button
															variant="outline"
															size="sm"
															type="button"
															onClick={() => setCombinedDialogGame(mg)}
															className="flex items-center gap-2"
														>
															<Copy className="size-4" />
															Copy
														</Button>
														<Button
															size="sm"
															type="button"
															className="flex items-center gap-2 bg-epic-blue hover:bg-epic-blue/90"
															onClick={() => setCombinedDialogGame(mg)}
														>
															<ExternalLink className="size-4" />
															Claim
														</Button>
													</>
												) : (
													<>
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
															<a
																href={checkoutUrl}
																target="_blank"
																rel="noopener noreferrer"
															>
																<ExternalLink className="size-4" />
																Claim
															</a>
														</Button>
													</>
												)}
											</div>
										</div>
									)
								})}
							</div>
							<div className="text-xs text-muted-foreground">
								<p>
									You are required to be logged into your Epic Games account before
									claiming the games.
								</p>
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
