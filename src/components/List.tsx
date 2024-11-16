'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { unstable_noStore as noStore } from 'next/cache'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Calendar, Clock } from 'lucide-react'

export default function List({ games }: { games: any }) {
	noStore()
	const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({})
	const router = useRouter()
	const hasToastShown = useRef(false)

	const updateTimeLeft = useCallback(() => {
		const newTimeLeft: { [key: string]: string } = {}
		let hasExpired = false

		games.currentGames.forEach((game: any) => {
			const endDate = new Date(
				game.promotions.promotionalOffers[0]?.promotionalOffers[0]?.endDate ?? ''
			)
			const timeLeftForGame = calculateTimeLeft(endDate)
			newTimeLeft[game.id] = timeLeftForGame

			if (timeLeftForGame === 'Expired' && !hasExpired && !hasToastShown.current) {
				hasExpired = true
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
						position: 'bottom-center',
					}
				)
			}
		})

		setTimeLeft(newTimeLeft)
	}, [games.currentGames, router])

	useEffect(() => {
		updateTimeLeft()
		const timer = setInterval(updateTimeLeft, 1000)

		return () => clearInterval(timer)
	}, [updateTimeLeft])

	const renderGameCard = (game: any, isCurrentGame: boolean) => {
		const pageSlug = game.offerMappings?.pageSlug || game.urlSlug
		const isBundleGame = game.categories?.some(
			(category: any) => category.path === 'bundles'
		)
		const linkPrefix = isBundleGame ? '/bundles/' : '/p/'

		return (
			<motion.div
				layout
				key={game.id}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.4 }}
			>
				<Link
					href={`https://store.epicgames.com/en-US${linkPrefix}${pageSlug}`}
					target="_blank"
				>
					<Card className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white dark:bg-epic-darkBlue flex flex-col">
						<div className="relative overflow-hidden">
							<Image
								src={
									game.keyImages.find((img: any) => img.type === 'OfferImageWide')?.url
								}
								alt={game.title}
								width={640}
								height={360}
								className={`w-full h-48 lg:h-60 object-cover transition-all duration-300 group-hover:scale-105 ${
									timeLeft[game.id] === 'Expired' ? 'grayscale' : ''
								}`}
							/>
						</div>
						<CardContent className="p-4 py-3 flex-grow">
							<CardTitle className="text-xl mb-2 text-epic-black dark:text-white">
								<div className="flex flex-col">
									<p className="text-lg font-bold line-clamp-1 text-gray-900 dark:text-white group-hover:text-epic-blue transition-colors">
										{game.title}
									</p>
									<p className="text-xs text-epic-gray dark:text-epic-lightGray line-clamp-1">
										{game.seller.name}
									</p>
								</div>
							</CardTitle>
							<CardDescription className="line-clamp-3">
								{game.description}
							</CardDescription>
						</CardContent>
						<CardFooter className="p-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-950/20">
							{isCurrentGame ? (
								<div className="flex items-center text-epic-blue">
									<Clock className="size-4 mr-1" />
									<span className="font-semibold">
										{timeLeft[game.id] || 'Loading...'}
									</span>
								</div>
							) : (
								<div className="flex items-center text-gray-600 dark:text-gray-400">
									<Calendar className="size-4 mr-1" />
									<span className="text-sm">
										{format(
											new Date(
												game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
											),
											'MMM d'
										)}
									</span>
								</div>
							)}
							<span className="text-epic-gray dark:text-epic-lightGray text-sm">
								{isCurrentGame ? (
									<span
										className={`font-semibold ${
											timeLeft[game.id] === 'Expired' ? '' : 'line-through'
										}`}
									>
										{game.price.totalPrice.originalPrice === 0
											? 'Free'
											: game.price.totalPrice.fmtPrice.originalPrice}
									</span>
								) : (
									<span className="dark:text-epic-lightGray">
										{game.price.totalPrice.originalPrice === 0
											? 'Free'
											: game.price.totalPrice.fmtPrice.originalPrice}
									</span>
								)}
							</span>
						</CardFooter>
					</Card>
				</Link>
			</motion.div>
		)
	}

	const renderGameList = (games: any[], isCurrentGames: boolean) => (
		<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{games.length > 0 ? (
				games.map((game: any) => renderGameCard(game, isCurrentGames))
			) : (
				<p className="text-lg text-epic-gray dark:text-epic-lightGray lg:col-span-3 col-span-full text-center lg:text-left">
					Failed to fetch offers. Check back later or check out the official site.
				</p>
			)}
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
			</div>
		</div>
	)
}
