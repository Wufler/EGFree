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

	const NoOffers = () => (
		<div className="pb-2 text-lg font-medium">
			<div className="text-lg">If offers are not showing up, try refreshing.</div>
			<div className="text-sm text-muted-foreground">
				You can also check if the offers are at the{' '}
				<Link
					href="https://store.epicgames.com/en-US/free-games"
					className="text-epic-blue"
				>
					Epic Games Store
				</Link>
			</div>
		</div>
	)

	if (games.currentGames.length === 0 && games.nextGames.length === 0) {
		return (
			<div className="flex justify-center items-center h-[50vh] text-lg font-medium">
				<div className="flex flex-col items-center">
					<div className="text-lg font-medium">
						If offers are not showing up, try refreshing.
					</div>
					<div className="text-sm text-muted-foreground">
						You can also check if the offers are at the{' '}
						<Link
							href="https://store.epicgames.com/en-US/free-games"
							className="text-epic-blue"
						>
							Epic Games Store
						</Link>
					</div>
				</div>
			</div>
		)
	}

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
			<Card className="rounded-none sm:rounded-lg p-0 group relative overflow-hidden border-0">
				<div className="relative aspect-[16/9] overflow-hidden sm:rounded-lg">
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
							className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-103 ${
								timeLeft[game.id] === 'Expired' ? 'grayscale' : ''
							}`}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
							<Gift className="size-20 text-epic-blue" />
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black via-black/40" />
				</div>

				<CardContent className="absolute bottom-0 left-0 right-0 p-4">
					<div className="flex items-end justify-between mb-1">
						{isCurrentGame ? (
							<TimeDisplay gameId={game.id} />
						) : (
							<div className="flex items-center text-gray-400">
								<Calendar className="mr-1.5 size-4" />
								<span className="text-sm font-medium">
									{format(getGameDate(game), 'MMM d')}
								</span>
							</div>
						)}
					</div>
					<div className="flex justify-between items-center">
						<div>
							<p className="line-clamp-1 text-lg font-bold text-white transition-colors duration-200 group-hover:text-epic-blue dark:group-hover:text-epic-blue">
								{game.title}
							</p>
							{game.seller?.name !== 'Epic Dev Test Account' && (
								<p className="line-clamp-1 text-sm text-white">{game.seller?.name}</p>
							)}
						</div>
						<div className="flex flex-col items-end">
							{isCurrentGame && <span className="font-bold text-white">Free</span>}
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
										className={`text-sm ${
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

	const gridClassName = `grid gap-4 ${
		isSingleGame
			? 'grid-cols-1 lg:grid-cols-2'
			: isTwoCurrentGames && isTwoUpcomingGames
			? 'grid-cols-1 lg:grid-cols-2'
			: 'grid-cols-1 lg:grid-cols-3'
	}`

	return (
		<div className="dark:bg-epic-black lg:px-8 lg:py-6 py-0">
			<>
				<Tabs defaultValue="current" className="w-full lg:hidden gap-0 sm:gap-4">
					<TabsList className="w-full h-auto rounded-none bg-transparent p-0">
						<TabsTrigger
							value="current"
							className="flex-1 !text-epic-blue relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
						>
							<Gem className="size-4" /> Free Now
						</TabsTrigger>
						<TabsTrigger
							value="upcoming"
							className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
						>
							<Calendar className="size-4" /> Coming Soon
						</TabsTrigger>
					</TabsList>
					<TabsContent value="current">
						{games.currentGames.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 sm:gap-4 gap-0 sm:px-4 px-0">
								{games.currentGames.map(game => renderGameCard(game, true))}
							</div>
						) : (
							<NoOffers />
						)}
					</TabsContent>
					<TabsContent value="upcoming">
						{games.nextGames.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 sm:gap-4 gap-0 sm:px-4 px-0">
								{games.nextGames.map(game => renderGameCard(game, false))}
							</div>
						) : (
							<NoOffers />
						)}
					</TabsContent>
				</Tabs>

				<div className="hidden lg:block">
					<div className="space-y-6 container mx-auto">
						<div>
							<h3 className="pb-4	text-lg font-medium text-epic-blue dark:text-epic-blue flex items-center">
								<Gem className="mr-2 size-4" /> Free Now
							</h3>
							{games.currentGames.length > 0 ? (
								<div className={gridClassName}>
									{games.currentGames.map(game => renderGameCard(game, true))}
								</div>
							) : (
								<NoOffers />
							)}
						</div>
						<div>
							<h3 className="pb-4	text-lg font-medium flex items-center">
								<Calendar className="mr-2 size-4" /> Coming Soon
							</h3>
							{games.nextGames.length > 0 ? (
								<div className={gridClassName}>
									{games.nextGames.map(game => renderGameCard(game, false))}
								</div>
							) : (
								<NoOffers />
							)}
						</div>
					</div>
				</div>
			</>
		</div>
	)
}
