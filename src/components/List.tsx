'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { unstable_noStore as noStore } from 'next/cache'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
		const pageSlug = game.catalogNs?.mappings?.[0]?.pageSlug || game.urlSlug
		const isBundleGame = game.categories?.some(
			(category: any) => category.path === 'bundles'
		)
		const linkPrefix = isBundleGame ? '/bundles/' : '/p/'

		return (
			<motion.div
				key={game.id}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Link
					href={`https://store.epicgames.com/en-US${linkPrefix}${pageSlug}`}
					target="_blank"
				>
					<Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white dark:bg-epic-darkBlue border-epic-lightGray dark:border-epic-gray">
						<CardHeader className="p-0 relative">
							<Image
								src={
									game.keyImages.find((img: any) => img.type === 'OfferImageWide')?.url
								}
								alt={game.title}
								width={640}
								height={360}
								className={`w-full h-48 lg:h-60 object-cover rounded-t-lg ${
									timeLeft[game.id] === 'Expired' ? 'grayscale' : ''
								}`}
							/>
							<Badge
								variant={isCurrentGame ? 'default' : 'secondary'}
								className={`absolute top-1 right-3 text-white dark:hover:text-black ${
									timeLeft[game.id] === 'Expired' ? 'hidden' : ''
								} ${
									isCurrentGame
										? 'bg-epic-blue'
										: 'dark:hover:text-white text-black dark:text-white'
								}`}
							>
								{isCurrentGame
									? 'FREE NOW'
									: `Coming ${format(
											new Date(
												game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
											),
											'MMM d'
									  )}`}
							</Badge>
						</CardHeader>
						<CardContent className="p-4 pb-1">
							<CardTitle className="text-xl mb-2 text-epic-black dark:text-white line-clamp-1">
								{game.title}
							</CardTitle>
							<p className="text-sm text-epic-gray dark:text-epic-lightGray mb-2 line-clamp-3">
								{game.description}
							</p>
						</CardContent>
						<CardFooter className="p-4 pt-0 flex justify-between items-center mt-auto">
							{isCurrentGame ? (
								<span className="text-epic-blue font-semibold">
									{timeLeft[game.id] || 'Loading...'}
								</span>
							) : (
								<span className="text-epic-gray dark:text-epic-lightGray text-sm">
									{format(
										new Date(
											game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
										),
										'MMM d'
									)}
								</span>
							)}
							<span className="text-epic-gray dark:text-epic-lightGray text-sm">
								{isCurrentGame ? (
									<span
										className={`font-semibold ${
											timeLeft[game.id] === 'Expired' ? '' : 'line-through'
										}`}
									>
										{game.price.totalPrice.fmtPrice.originalPrice}
									</span>
								) : (
									<span className=" dark:text-epic-lightGray">
										{game.price.totalPrice.fmtPrice.originalPrice}
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
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{games.map((game: any) => renderGameCard(game, isCurrentGames))}
		</div>
	)

	return (
		<div className="sm:space-y-0 space-y-12 p-4 lg:p-8 bg-gray-100 dark:bg-epic-darkBlue rounded-lg">
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
					<h2 className="text-3xl font-bold mb-5 text-epic-blue dark:text-epic-blue">
						Current
					</h2>
					{renderGameList(games.currentGames, true)}
				</section>
				<section className="mt-8">
					<h2 className="text-3xl font-bold mb-5 text-epic-lightBlue dark:text-epic-white">
						Upcoming
					</h2>
					{renderGameList(games.nextGames, false)}
				</section>
			</div>
		</div>
	)
}
