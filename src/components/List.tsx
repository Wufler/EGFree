'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { format } from 'date-fns'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Gift } from 'lucide-react'
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
				<Clock className="size-4 mr-1" />
				<span className="font-semibold">{gameTimeLeft}</span>
			</div>
		)
	}

	const renderGameCard = (game: GameItem, isCurrentGame: boolean) => {
		const pageSlug =
			game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
		const isBundleGame = game.categories?.some(
			category => category.path === 'bundles'
		)
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
			<Card className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white dark:bg-epic-darkBlue flex flex-col">
				<div className="relative overflow-hidden">
					{game.keyImages.find(
						img =>
							img.type === 'OfferImageWide' || img.type === 'DieselStoreFrontWide'
					) ? (
						<Image
							src={
								game.keyImages.find(
									img =>
										img.type === 'OfferImageWide' || img.type === 'DieselStoreFrontWide'
								)?.url || ''
							}
							width={1280}
							height={720}
							alt={game.title}
							className={`w-full ${
								isSingleGame ? 'h-48 lg:h-72 xl:h-96' : 'h-48 lg:h-60'
							} object-cover transition-all duration-300 group-hover:scale-105 ${
								timeLeft[game.id] === 'Expired' ? 'grayscale' : ''
							}`}
						/>
					) : (
						<div className="bg-gray-200 dark:bg-epic-black w-full h-48 xl:h-56 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
							<Gift className="size-20 text-epic-blue" />
						</div>
					)}
				</div>
				<CardContent className="p-4 py-3 flex-grow">
					<CardTitle className="text-xl mb-2 text-epic-black dark:text-white">
						<div className="flex flex-col">
							<p className="text-lg font-bold line-clamp-1 text-gray-900 dark:text-white group-hover:text-epic-blue transition-colors">
								{game.title}
							</p>
							{game.seller?.name !== 'Epic Dev Test Account' && (
								<p className="text-xs text-epic-gray dark:text-epic-lightGray line-clamp-1">
									{game.seller?.name}
								</p>
							)}
						</div>
					</CardTitle>
					{game.description !== game.title && (
						<CardDescription className="line-clamp-3">
							{game.description}
						</CardDescription>
					)}
				</CardContent>
				<CardFooter className="p-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-950/20">
					{isCurrentGame ? (
						<TimeDisplay gameId={game.id} />
					) : (
						<div className="flex items-center text-gray-600 dark:text-gray-400">
							<Calendar className="size-4 mr-1" />
							<span className="text-sm">{format(getGameDate(game), 'MMM d')}</span>
						</div>
					)}
					<span className="text-epic-gray dark:text-epic-lightGray text-sm">
						{isCurrentGame ? (
							<span
								className={`font-semibold ${
									timeLeft[game.id] === 'Expired' ||
									game.price.totalPrice.originalPrice === 0
										? ''
										: 'line-through'
								}`}
							>
								{game.price.totalPrice.originalPrice === 0
									? 'Free'
									: game.price.totalPrice.fmtPrice.originalPrice}
							</span>
						) : (
							<span className="dark:text-epic-lightGray">
								{game.price.totalPrice.originalPrice === 0
									? ''
									: game.price.totalPrice.fmtPrice.originalPrice}
							</span>
						)}
					</span>
				</CardFooter>
			</Card>
		)

		return (
			<motion.div
				layout
				key={game.id}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.4 }}
			>
				{pageSlug && pageSlug !== '[]' ? (
					<Link
						href={`https://store.epicgames.com/${linkPrefix}${pageSlug}`}
						target="_blank"
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

	const renderGameList = (games: GameItem[], isCurrentGames: boolean) => (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 z-50 relative">
			{games.length > 0 ? (
				games.map(game => renderGameCard(game, isCurrentGames))
			) : (
				<p className="text-lg text-epic-gray dark:text-epic-lightGray lg:col-span-3 col-span-full text-center lg:text-left">
					Failed to fetch offers. Check back later or check out the{' '}
					<Link href="https://store.epicgames.com/free-games" target="_blank">
						<span className="underline text-epic-blue">official site.</span>
					</Link>
				</p>
			)}
		</div>
	)

	const combinedView = () => (
		<div className="grid grid-cols-2 gap-6">
			<div className="z-50">
				<h2 className="text-3xl font-bold mb-4 text-epic-blue dark:text-epic-blue">
					Current
				</h2>
				{games.currentGames.map(game => renderGameCard(game, true))}
			</div>
			<div className="z-50">
				<h2 className="text-3xl font-bold mb-4 text-epic-lightBlue dark:text-white">
					Upcoming
				</h2>
				{games.nextGames.map(game => renderGameCard(game, false))}
			</div>
		</div>
	)

	return (
		<div className="p-4 lg:p-8 bg-gray-100 dark:bg-epic-darkBlue sm:rounded-lg rounded-none">
			<Tabs defaultValue="current" className="w-full lg:hidden">
				<TabsList className="grid w-full grid-cols-2 mb-4">
					<TabsTrigger value="current">Current</TabsTrigger>
					<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
				</TabsList>
				<TabsContent value="current">
					{renderGameList(games.currentGames, true)}
				</TabsContent>
				<TabsContent value="upcoming">
					{renderGameList(games.nextGames, false)}
				</TabsContent>
			</Tabs>

			<div className="hidden lg:block">
				{isSingleGame ? (
					<section>{combinedView()}</section>
				) : (
					<>
						<section>
							<h2 className="text-3xl font-bold mb-4 text-epic-blue dark:text-epic-blue">
								Current
							</h2>
							{renderGameList(games.currentGames, true)}
						</section>
						<section className="mt-8">
							<h2 className="text-3xl font-bold mb-4 text-epic-lightBlue dark:text-white">
								Upcoming
							</h2>
							{renderGameList(games.nextGames, false)}
						</section>
					</>
				)}
			</div>
		</div>
	)
}
