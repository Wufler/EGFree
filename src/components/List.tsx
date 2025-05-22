'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Gem, Gift } from 'lucide-react'
import Image from 'next/image'

export default function List({ games }: { games: Game }) {
	const [timeLeft] = useState<{ [key: string]: string }>({})
	const router = useRouter()
	const hasToastShown = useRef(false)

	const TimeDisplay = ({ gameId }: { gameId: string }) => {
		const [gameTimeLeft, setGameTimeLeft] = useState<string>('Loading...')

		useEffect(() => {
			const updateGameTime = () => {
				const game = games.currentGames.find(g => g.id === gameId)
				const endDate = new Date(
					game?.promotions.promotionalOffers[0]?.promotionalOffers[0]?.endDate ?? ''
				)
				const timeLeftForGame = calculateTimeLeft(endDate)
				setGameTimeLeft(timeLeftForGame)

				if (timeLeftForGame === 'Expired' && !hasToastShown.current) {
					hasToastShown.current = true
					toast.promise(
						new Promise(resolve => {
							setTimeout(() => {
								router.refresh()
								resolve(true)
							}, 5000)
						}),
						{
							loading: 'Game offers expired, refreshing...',
							success: 'Game offers updated successfully!',
							error: 'Failed to update game offers. Please refresh manually.',
						}
					)
				}
			}

			updateGameTime()
			const timer = setInterval(updateGameTime, 1000)
			return () => clearInterval(timer)
		}, [gameId])

		return (
			<div className="flex items-center text-epic-blue">
				<Clock className="mr-1.5 size-4" />
				<span className="text-sm font-semibold">{gameTimeLeft}</span>
			</div>
		)
	}

	const renderGameCard = (game: GameItem, isCurrentGame: boolean) => {
		const pageSlug =
			game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
		const isBundleGame = game.categories?.some(
			category => category.path === 'bundles'
		)
		const isAddOn = game.offerType === 'ADD_ON'
		const linkPrefix = isBundleGame ? 'bundles/' : 'p/'

		const getGameDate = (game: GameItem) => {
			if (isCurrentGame) {
				return game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]
					?.endDate
			}
			return game.promotions?.upcomingPromotionalOffers?.[0]
				?.promotionalOffers?.[0]?.startDate
		}

		const cardContent = (
			<Card className="group relative h-full overflow-hidden border-0 bg-epic-black dark:bg-epic-black transition-all duration-300 hover:scale-[1.02] shadow-none">
				<div className="relative aspect-[16/9] overflow-hidden rounded-lg">
					{isAddOn && (
						<div className="absolute right-2 top-2 z-10 flex items-center rounded-sm bg-epic-blue/80 dark:bg-epic-blue/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
							ADD-ON
						</div>
					)}
					{game.keyImages.find(
						img =>
							img.type === 'OfferImageWide' ||
							img.type === 'DieselStoreFrontWide' ||
							img.type === 'DieselGameBoxWide'
					) ? (
						<Image
							src={
								game.keyImages.find(
									img =>
										img.type === 'OfferImageWide' ||
										img.type === 'DieselStoreFrontWide' ||
										img.type === 'DieselGameBoxWide'
								)?.url || ''
							}
							width={1280}
							height={720}
							priority
							alt={game.title}
							className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
								timeLeft[game.id] === 'Expired' ? 'grayscale' : ''
							}`}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
							<Gift className="size-20 text-epic-blue" />
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-epic-black via-epic-black/60" />
				</div>

				<CardContent className="absolute bottom-0 left-0 right-0 p-4">
					<div className="flex items-end justify-between mb-1">
						{isCurrentGame ? (
							<TimeDisplay gameId={game.id} />
						) : (
							<div className="flex items-center text-epic-light-gray">
								<Calendar className="mr-1.5 size-4" />
								<span className="text-sm font-medium">
									{format(getGameDate(game), 'MMM d')}
								</span>
							</div>
						)}
					</div>
					<div className="flex justify-between items-center pb-5">
						<div>
							<p className="line-clamp-1 text-lg font-bold text-foreground transition-colors duration-200 group-hover:text-epic-blue dark:group-hover:text-epic-blue">
								{game.title}
							</p>
							{game.seller?.name !== 'Epic Dev Test Account' && (
								<p className="line-clamp-1 text-sm text-epic-light-gray">
									{game.seller?.name}
								</p>
							)}
						</div>
						<div className="flex flex-col items-end">
							{isCurrentGame && (
								<span className="font-bold text-foreground">Free</span>
							)}
							{game.price.totalPrice.originalPrice !== 0 && (
								<>
									{!isCurrentGame &&
										game.price.totalPrice.discountPrice !==
											game.price.totalPrice.originalPrice && (
											<span className="text-sm font-bold">
												{game.price.totalPrice.fmtPrice.discountPrice}
											</span>
										)}
									<span
										className={`text-sm text-epic-light-gray ${
											isCurrentGame ||
											game.price.totalPrice.discountPrice !==
												game.price.totalPrice.originalPrice
												? 'line-through opacity-70'
												: ''
										}`}
									>
										{game.price.totalPrice.fmtPrice.originalPrice}
									</span>
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		)

		return (
			<motion.div
				layout
				key={game.id}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 20 }}
				transition={{ duration: 0.3 }}
				className="h-full z-50"
			>
				{pageSlug && pageSlug !== '[]' ? (
					<Link
						href={`https://store.epicgames.com/${linkPrefix}${pageSlug}`}
						target="_blank"
						className="block h-full"
					>
						{cardContent}
					</Link>
				) : (
					cardContent
				)}
			</motion.div>
		)
	}

	const isSingleGame =
		games.currentGames.length === 1 && games.nextGames.length === 1
	const isTwoCurrentGames = games.currentGames.length <= 2
	const isTwoUpcomingGames = games.nextGames.length <= 2

	const gridClassName = `grid gap-4 lg:gap-6 ${
		isSingleGame
			? 'grid-cols-1 sm:grid-cols-2'
			: isTwoCurrentGames && isTwoUpcomingGames
			? 'grid-cols-1 sm:grid-cols-2'
			: 'grid-cols-1 sm:grid-cols-3'
	}`

	return (
		<div className="min-h-[50vh] rounded-none bg-epic-black dark:bg-epic-black p-4 lg:rounded-lg lg:p-8">
			{isSingleGame ? (
				<div className={gridClassName}>
					{games.currentGames.map(game => renderGameCard(game, true))}
					{games.nextGames.map(game => renderGameCard(game, false))}
				</div>
			) : (
				<>
					<Tabs defaultValue="current" className="w-full sm:hidden">
						<TabsList className="w-full h-auto rounded-none bg-transparent !pb-2 p-0">
							<TabsTrigger
								value="current"
								className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
							>
								Free Now
							</TabsTrigger>
							<TabsTrigger
								value="upcoming"
								className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
							>
								Coming Soon
							</TabsTrigger>
						</TabsList>
						<TabsContent value="current">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
								{games.currentGames.map(game => renderGameCard(game, true))}
							</div>
						</TabsContent>
						<TabsContent value="upcoming">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
								{games.nextGames.map(game => renderGameCard(game, false))}
							</div>
						</TabsContent>
					</Tabs>

					<div className="hidden sm:block">
						<section>
							<div className="space-y-4">
								<div>
									<h3 className="text-lg font-medium text-epic-blue dark:text-epic-blue flex items-center">
										<Gem className="mr-2 size-4" /> Free Now
									</h3>
									<div className={gridClassName}>
										{games.currentGames.map(game => renderGameCard(game, true))}
									</div>
								</div>
								<div>
									<h3 className="text-lg font-medium text-epic-light-gray dark:text-epic-light-gray flex items-center">
										<Calendar className="mr-2 size-4" /> Coming Soon
									</h3>
									<div className={gridClassName}>
										{games.nextGames.map(game => renderGameCard(game, false))}
									</div>
								</div>
							</div>
						</section>
					</div>
				</>
			)}
		</div>
	)
}
