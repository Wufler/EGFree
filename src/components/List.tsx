'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Gem, Gift, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import ClaimTab from '@/components/ClaimTab'

export default function List({ games }: { games: Game }) {
	const router = useRouter()
	const hasToastShown = useRef(false)

	const NoOffers = () => (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="rounded-full bg-muted p-4 mb-4">
				<Gift className="size-8 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-semibold">No offers available</h3>
			<p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
				Check back later or visit the{' '}
				<Link
					href="https://store.epicgames.com/en-US/free-games"
					className="text-epic-blue hover:underline"
					target="_blank"
				>
					Epic Games Store
				</Link>
			</p>
		</div>
	)

	if (games.currentGames.length === 0 && games.nextGames.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[50vh]">
				<NoOffers />
			</div>
		)
	}

	const TimeDisplay = ({
		date,
		type,
	}: {
		date: Date
		type: 'end' | 'start'
	}) => {
		const [timeLeft, setTimeLeft] = useState<string>('')

		useEffect(() => {
			const updateTime = () => {
				const time = calculateTimeLeft(date)
				setTimeLeft(time)

				if (time === 'Expired' && !hasToastShown.current) {
					hasToastShown.current = true
					toast.promise(
						new Promise(resolve => {
							setTimeout(() => {
								router.refresh()
								resolve(true)
							}, 5000)
						}),
						{
							loading: 'Offers updating...',
							success: 'Offers updated!',
							error: 'Failed to update. Please refresh.',
						}
					)
				}
			}

			updateTime()
			const timer = setInterval(updateTime, 1000)
			return () => clearInterval(timer)
		}, [date])

		if (!timeLeft) return null

		return (
			<div
				className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
					type === 'end' ? 'bg-epic-blue/90 text-white' : 'bg-black/60 text-white'
				}`}
			>
				<Clock className="size-3.5" />
				<span>{timeLeft === 'Expired' ? 'Loading...' : timeLeft}</span>
			</div>
		)
	}

	const renderGameCard = (game: GameItem, isCurrentGame: boolean) => {
		const rawPageSlug =
			game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
		const pageSlug = rawPageSlug?.replace(/\/[^/]*$/, '') || rawPageSlug
		const isBundleGame = game.categories?.some(
			category => category.path === 'bundles'
		)
		const isAddOn = game.offerType === 'ADD_ON'
		const linkPrefix = isBundleGame ? 'bundles/' : 'p/'

		const getGameDate = (game: GameItem) => {
			if (isCurrentGame) {
				return new Date(
					game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]?.endDate ??
						''
				)
			}
			return new Date(
				game.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
					?.startDate ?? ''
			)
		}

		const gameDate = getGameDate(game)

		const cardContent = (
			<div className="h-full border-0 bg-transparent shadow-none group overflow-hidden">
				<div className="relative aspect-video overflow-hidden lg:rounded-lg bg-muted shadow-md rounded-none">
					{isAddOn && (
						<div className="absolute right-2 top-2 z-10 flex items-center rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
							ADD-ON
						</div>
					)}
					{game.keyImages.find(
						img =>
							img.type === 'OfferImageWide' ||
							img.type === 'DieselStoreFrontWide' ||
							img.type === 'DieselGameBoxWide' ||
							img.type === 'VaultClosed'
					) ? (
						<Image
							src={
								game.keyImages.find(
									img =>
										img.type === 'OfferImageWide' ||
										img.type === 'DieselStoreFrontWide' ||
										img.type === 'DieselGameBoxWide' ||
										img.type === 'VaultClosed'
								)?.url || ''
							}
							width={1280}
							height={720}
							priority
							alt={game.title}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
							<Gift className="size-20 text-epic-blue/50" />
						</div>
					)}

					<div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-0" />

					<div className="absolute top-3 left-3 z-10">
						<TimeDisplay date={gameDate} type={isCurrentGame ? 'end' : 'start'} />
					</div>

					<div className="absolute bottom-0 left-0 right-0 p-5 z-10">
						<div className="flex items-end justify-between gap-4">
							<div className="flex-1 min-w-0">
								<h3 className="truncate text-lg font-bold text-white group-hover:text-epic-blue transition-colors">
									{game.title}
								</h3>
								{game.seller?.name !== 'Epic Dev Test Account' && (
									<p className="truncate text-sm text-gray-300">{game.seller?.name}</p>
								)}
							</div>
							<div className="flex flex-col items-end shrink-0">
								{isCurrentGame && (
									<span className="rounded-md bg-epic-blue px-2 py-0.5 text-xs font-bold text-white shadow-sm">
										FREE
									</span>
								)}
								{game.price.totalPrice.originalPrice !== 0 && (
									<div className="mt-1 flex items-center gap-1.5">
										{!isCurrentGame &&
											game.price.totalPrice.discountPrice !==
												game.price.totalPrice.originalPrice && (
												<span className="text-sm font-bold text-white">
													{game.price.totalPrice.fmtPrice.discountPrice}
												</span>
											)}
										<span
											className={`text-xs font-medium text-gray-400 ${
												isCurrentGame ||
												game.price.totalPrice.discountPrice !==
													game.price.totalPrice.originalPrice
													? 'line-through'
													: ''
											}`}
										>
											{game.price.totalPrice.fmtPrice.originalPrice}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		)

		return (
			<div
				key={game.id}
				className="h-full z-50 animate-in fade-in slide-in-from-bottom-4 duration-500"
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
			</div>
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
		<div className="lg:px-8 lg:py-6 py-0">
			<>
				<Tabs defaultValue="current" className="w-full lg:hidden gap-0">
					<TabsList className="w-full h-auto rounded-none bg-transparent p-0">
						<TabsTrigger
							value="current"
							className="flex-1 text-epic-blue! relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
						>
							<Gem className="size-4" /> Free Now
						</TabsTrigger>
						<TabsTrigger
							value="upcoming"
							className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
						>
							<Calendar className="size-4" /> Upcoming
						</TabsTrigger>
						{games.currentGames.length > 0 && (
							<TabsTrigger
								value="claim"
								className="flex-1 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
							>
								<ShoppingCart className="size-4" /> Claim
							</TabsTrigger>
						)}
					</TabsList>
					<TabsContent value="current">
						{games.currentGames.length > 0 ? (
							<div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-4 gap-0 lg:px-4 px-0 lg:pb-4 pb-0 lg:pt-4 pt-0">
								{games.currentGames.map(game => renderGameCard(game, true))}
							</div>
						) : (
							<NoOffers />
						)}
					</TabsContent>
					<TabsContent value="upcoming">
						{games.nextGames.length > 0 ? (
							<div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-4 gap-0 lg:px-4 px-0 lg:pb-4 pb-0 lg:pt-4 pt-0">
								{games.nextGames.map(game => renderGameCard(game, false))}
							</div>
						) : (
							<NoOffers />
						)}
					</TabsContent>
					{games.currentGames.length > 0 && (
						<TabsContent value="claim">
							<ClaimTab games={games} />
						</TabsContent>
					)}
				</Tabs>

				<div className="hidden lg:block">
					<div className="space-y-6 container mx-auto">
						{isSingleGame ? (
							<div>
								<div className={gridClassName}>
									<div>
										<div className="mb-4 flex items-center gap-3">
											<div className="rounded-lg bg-epic-blue/10 p-2">
												<Gem className="size-5 text-epic-blue" />
											</div>
											<div>
												<h2 className="text-2xl font-bold text-epic-blue">Free Now</h2>
											</div>
										</div>
										{games.currentGames.map(game => renderGameCard(game, true))}
									</div>
									<div>
										<div className="mb-4 flex items-center gap-3">
											<div className="rounded-lg bg-muted p-2">
												<Calendar className="size-5" />
											</div>
											<div>
												<h2 className="text-2xl font-bold">Upcoming</h2>
											</div>
										</div>
										{games.nextGames.map(game => renderGameCard(game, false))}
									</div>
								</div>
							</div>
						) : (
							<>
								<div>
									<div className="mb-4 flex items-center gap-3">
										<div className="rounded-lg bg-epic-blue/10 p-2">
											<Gem className="size-5 text-epic-blue" />
										</div>
										<div>
											<h2 className="text-2xl font-bold text-epic-blue">Free Now</h2>
										</div>
									</div>
									{games.currentGames.length > 0 ? (
										<div className={gridClassName}>
											{games.currentGames.map(game => renderGameCard(game, true))}
										</div>
									) : (
										<NoOffers />
									)}
								</div>
								<div>
									<div className="mb-4 flex items-center gap-3">
										<div className="rounded-lg bg-muted p-2">
											<Calendar className="size-5" />
										</div>
										<div>
											<h2 className="text-2xl font-bold">Upcoming</h2>
										</div>
									</div>
									{games.nextGames.length > 0 ? (
										<div className={gridClassName}>
											{games.nextGames.map(game => renderGameCard(game, false))}
										</div>
									) : (
										<NoOffers />
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</>
		</div>
	)
}
