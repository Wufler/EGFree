'use client'
import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { getEffectiveGames, getMobileGameKey, mergeMobile } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
	Calendar,
	CalendarOff,
	Clock,
	Gem,
	Gift,
	Smartphone,
	ShoppingCart,
	XCircle,
	Home as HomeIcon,
} from 'lucide-react'
import Image from 'next/image'
import ClaimTab from '@/components/ClaimTab'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function NoOffers() {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/30">
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
}

function TimeDisplay({
	date,
	type,
	onExpired,
}: {
	date: Date
	type: 'end' | 'start'
	onExpired?: () => void
}) {
	const [timeLeft, setTimeLeft] = useState<string>('')

	useEffect(() => {
		const updateTime = () => {
			const time = calculateTimeLeft(date)
			setTimeLeft(time)

			if (time === 'Expired' && onExpired) {
				onExpired()
			}
		}

		updateTime()
		const timer = setInterval(updateTime, 1000)
		return () => clearInterval(timer)
	}, [date, onExpired])

	if (!timeLeft) return null

	return (
		<div
			className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${type === 'end' ? 'bg-epic-blue/90 text-white' : 'bg-black/60 text-white'
				}`}
		>
			<Clock className="size-3.5" />
			<span>{timeLeft === 'Expired' ? 'Loading...' : timeLeft}</span>
		</div>
	)
}

function SectionHeader({
	icon: Icon,
	title,
	primary = false,
}: {
	icon: typeof Gem
	title: string
	primary?: boolean
}) {
	return (
		<div className="mb-5 flex items-center gap-3">
			<div
				className={`rounded-xl p-2.5 shadow-sm ${primary ? 'bg-epic-blue text-white' : 'bg-secondary text-foreground'
					}`}
			>
				<Icon className="size-5" />
			</div>
			<div>
				<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
			</div>
		</div>
	)
}

function DesktopHome({
	games,
	activeMobileGames,
	expiredMobileGames,
	gridClassName,
	renderGameCard,
	renderMobileGameCard,
}: {
	games: Game
	activeMobileGames: MobileGameDataLocal[]
	expiredMobileGames: MobileGameDataLocal[]
	gridClassName: string
	renderGameCard: (game: GameItem, isCurrentGame: boolean) => ReactNode
	renderMobileGameCard: (
		game: MobileGameDataLocal,
		isExpired?: boolean,
	) => ReactNode
}) {
	return (
		<div className="space-y-10">
			{games.currentGames.length > 0 && (
				<div>
					<SectionHeader icon={Gem} title="Desktop" />
					<div className={gridClassName}>
						{games.currentGames.map(game => renderGameCard(game, true))}
					</div>
				</div>
			)}
			{activeMobileGames.length > 0 && (
				<div>
					<SectionHeader icon={Smartphone} title="Mobile" />
					<div className={gridClassName}>
						{activeMobileGames.map(game => renderMobileGameCard(game, false))}
					</div>
				</div>
			)}
			{games.nextGames.length > 0 && (
				<div>
					<SectionHeader icon={Calendar} title="Upcoming" />
					<div className={gridClassName}>
						{games.nextGames.map(game => renderGameCard(game, false))}
					</div>
				</div>
			)}
			{expiredMobileGames.length > 0 && (
				<div>
					<SectionHeader icon={XCircle} title="Expired" />
					<div className={gridClassName}>
						{expiredMobileGames.map(game => renderMobileGameCard(game, true))}
					</div>
				</div>
			)}
		</div>
	)
}

export default function List({
	games,
	mobile,
}: {
	games: Game
	mobile: MobileGameData[]
}) {
	const router = useRouter()
	const hasToastShown = useRef(false)
	const [parsedMobileGames, setParsedMobileGames] = useState<
		MobileGameDataLocal[]
	>([])
	const [activeTab, setActiveTab] = useState('home')

	const mobileGames = useMemo(
		() => mergeMobile(mobile, parsedMobileGames),
		[mobile, parsedMobileGames],
	)
	const effectiveGames = useMemo(() => getEffectiveGames(games), [games])

	useEffect(() => {
		if (typeof window === 'undefined') return
		const checkDesktop = () => {
			const isLg = window.innerWidth >= 1024
			if (isLg && !localStorage.getItem('tabState')) {
				setActiveTab('home')
			}
		}

		checkDesktop()

		const loadParsedGames = () => {
			try {
				const stored = localStorage.getItem('parsedMobileGames')
				const parsed = stored ? JSON.parse(stored) : []
				setParsedMobileGames(Array.isArray(parsed) ? parsed : [])
			} catch (error) {
				console.error('Failed to load parsed games:', error)
				setParsedMobileGames([])
			}
		}

		loadParsedGames()
		const handleStorage = (event: StorageEvent) => {
			if (event.key === 'parsedMobileGames') {
				loadParsedGames()
			}
		}
		const handleParsedGamesUpdate = () => loadParsedGames()
		const handleResize = () => checkDesktop()

		window.addEventListener('storage', handleStorage)
		window.addEventListener('parsedMobileGamesUpdated', handleParsedGamesUpdate)
		window.addEventListener('resize', handleResize)
		return () => {
			window.removeEventListener('storage', handleStorage)
			window.removeEventListener(
				'parsedMobileGamesUpdated',
				handleParsedGamesUpdate,
			)
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	const handleExpired = useCallback(() => {
		if (!hasToastShown.current) {
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
				},
			)
		}
	}, [router])

	const renderGameCard = (game: GameItem, isCurrentGame: boolean) => {
		const rawPageSlug =
			game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
		const pageSlug = rawPageSlug?.replace(/\/[^/]*$/, '') || rawPageSlug
		const isBundleGame = game.categories?.some(
			category => category.path === 'bundles',
		)
		const isAddOn = game.offerType === 'ADD_ON'
		const linkPrefix = isBundleGame ? 'bundles/' : 'p/'
		const imageTypes = [
			'OfferImageWide',
			'DieselStoreFrontWide',
			'DieselGameBoxWide',
			'VaultClosed',
		]
		const gameImage = game.keyImages.find(img => imageTypes.includes(img.type))

		const getGameDate = (game: GameItem) => {
			if (isCurrentGame) {
				return new Date(
					game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]?.endDate ??
					'',
				)
			}
			return new Date(
				game.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
					?.startDate ?? '',
			)
		}

		const gameDate = getGameDate(game)

		const cardContent = (
			<div className="h-full border-0 bg-transparent shadow-none group overflow-hidden">
				<div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10">
					{isAddOn && (
						<div className="absolute right-2 top-2 z-10 flex items-center rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
							ADD-ON
						</div>
					)}
					{gameImage ? (
						<Image
							src={gameImage.url}
							width={1280}
							height={720}
							priority
							alt={game.title}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
							<Gift className="size-20 text-epic-blue/50" />
						</div>
					)}

					<div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

					<div className="absolute top-3 left-3 z-10">
						<TimeDisplay
							date={gameDate}
							type={isCurrentGame ? 'end' : 'start'}
							onExpired={handleExpired}
						/>
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
											className={`text-xs font-medium text-gray-400 ${isCurrentGame ||
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
				className="h-full z-50 animate-in fade-in zoom-in-95 duration-300"
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

	const renderMobileGameCard = (
		game: MobileGameDataLocal,
		isExpired = false,
	) => {
		const iosUrl = game.iosOffer?.pageSlug
			? `https://store.epicgames.com/p/${game.iosOffer.pageSlug}`
			: null
		const androidUrl = game.androidOffer?.pageSlug
			? `https://store.epicgames.com/p/${game.androidOffer.pageSlug}`
			: null
		const storeUrl = iosUrl || androidUrl
		const hasBothPlatforms = Boolean(iosUrl && androidUrl)
		const endDate = game.promoEndDate ? new Date(game.promoEndDate) : null

		const mobileTag =
			game.iosOffer && game.androidOffer
				? 'iOS & Android'
				: game.iosOffer
					? 'iOS'
					: game.androidOffer
						? 'Android'
						: null
		const cardContent = (
			<div className="h-full border-0 bg-transparent shadow-none group overflow-hidden">
				<div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10">
					{mobileTag && (
						<div className="absolute right-2 top-2 z-10 flex items-center rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
							{mobileTag}
						</div>
					)}
					{game.imageUrl ? (
						<Image
							src={game.imageUrl}
							width={1280}
							height={720}
							priority
							alt={game.title}
							className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isExpired ? 'grayscale' : ''
								}`}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
							<Gift className="size-20 text-epic-blue/50" />
						</div>
					)}

					<div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

					{isExpired ? (
						<div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm bg-black text-white">
							<CalendarOff className="size-3.5" />
							<span>Ended</span>
						</div>
					) : (
						endDate && (
							<div className="absolute top-3 left-3 z-10">
								<TimeDisplay date={endDate} type="end" onExpired={handleExpired} />
							</div>
						)
					)}

					<div className="absolute bottom-0 left-0 right-0 p-5 z-10">
						<div className="flex items-end justify-between gap-4">
							<div className="flex-1 min-w-0">
								<h3 className="truncate text-lg font-bold text-white group-hover:text-epic-blue transition-colors">
									{game.title}
								</h3>
								{game.seller?.name && game.seller.name !== 'Epic Dev Test Account' && (
									<p className="truncate text-sm text-gray-300">{game.seller.name}</p>
								)}
							</div>
							<div className="flex flex-col items-end shrink-0">
								{!isExpired && (
									<span className="rounded-md bg-epic-blue px-2 py-0.5 text-xs font-bold text-white shadow-sm">
										FREE
									</span>
								)}
								{game.originalPrice !== 0 && (
									<div className="mt-1 flex items-center gap-1.5">
										<span
											className={`text-xs font-medium text-gray-400 ${!isExpired ? 'line-through' : ''
												}`}
										>
											{new Intl.NumberFormat('en-US', {
												style: 'currency',
												currency: game.currencyCode,
											}).format(game.originalPrice / 100)}
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
				key={getMobileGameKey(game)}
				className="h-full z-50 animate-in fade-in zoom-in-95 duration-300"
			>
				{hasBothPlatforms ? (
					<Dialog>
						<DialogTrigger asChild>
							<button type="button" className="block h-full w-full text-left">
								{cardContent}
							</button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Open mobile offer</DialogTitle>
								<DialogDescription>
									Choose which platform store page you want to open.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-3">
								<Button asChild className="w-full">
									<Link href={iosUrl as string} target="_blank">
										Open iOS Offer
									</Link>
								</Button>
								<Button asChild variant="secondary" className="w-full">
									<Link href={androidUrl as string} target="_blank">
										Open Android Offer
									</Link>
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				) : storeUrl ? (
					<Link href={storeUrl} target="_blank" className="block h-full">
						{cardContent}
					</Link>
				) : (
					cardContent
				)}
			</div>
		)
	}

	const now = new Date()
	const activeMobileGames = mobileGames.filter(
		g => g.promoEndDate && new Date(g.promoEndDate) > now,
	)
	const expiredMobileGames = mobileGames.filter(
		g => !g.promoEndDate || new Date(g.promoEndDate) <= now,
	)

	const totalFreeNow = effectiveGames.currentGames.length
	const isSingleGame = totalFreeNow === 1 && effectiveGames.nextGames.length === 1
	const isTwoCurrentGames = totalFreeNow <= 2
	const isTwoUpcomingGames = effectiveGames.nextGames.length <= 2

	const gridClassName = `grid gap-4 ${isSingleGame
		? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
		: isTwoCurrentGames && isTwoUpcomingGames
			? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
			: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
		}`

	const mobileTabTriggerClass =
		'shrink-0 relative rounded-none py-3 px-3 sm:px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-epic-blue text-sm font-medium data-[state=active]:text-epic-blue text-muted-foreground inline-flex items-center justify-center gap-2'

	const desktopSidebarTriggerClass =
		'w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-semibold'

	const tabGridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4'

	const isEmpty =
		effectiveGames.currentGames.length === 0 &&
		effectiveGames.nextGames.length === 0 &&
		mobileGames.length === 0

	if (isEmpty) {
		return (
			<div className="flex justify-center items-center min-h-[50vh]">
				<NoOffers />
			</div>
		)
	}

	const renderContent = (section: string) => {
		switch (section) {
			case 'current':
				return effectiveGames.currentGames.length > 0 ? (
					<div className={tabGridClass}>
						{effectiveGames.currentGames.map(game => renderGameCard(game, true))}
					</div>
				) : (
					<NoOffers />
				)
			case 'mobile':
				return activeMobileGames.length > 0 ? (
					<div className={tabGridClass}>
						{activeMobileGames.map(game => renderMobileGameCard(game, false))}
					</div>
				) : (
					<NoOffers />
				)
			case 'upcoming':
				return effectiveGames.nextGames.length > 0 ? (
					<div className={tabGridClass}>
						{effectiveGames.nextGames.map(game => renderGameCard(game, false))}
					</div>
				) : (
					<NoOffers />
				)
			case 'expired':
				return expiredMobileGames.length > 0 ? (
					<div className={tabGridClass}>
						{expiredMobileGames.map(game => renderMobileGameCard(game, true))}
					</div>
				) : (
					<NoOffers />
				)
			case 'claim':
				return <ClaimTab games={effectiveGames} parsedMobileGames={activeMobileGames} />
			default:
				return null
		}
	}

	return (
		<div className="w-full min-w-0">
			<Tabs
				defaultValue="home"
				value={activeTab}
				onValueChange={value => {
					setActiveTab(value)
					if (typeof window !== 'undefined') {
						localStorage.setItem('tabState', value)
					}
				}}
				className="w-full min-h-0 flex flex-col gap-0 lg:grid lg:grid-cols-[16rem_1fr] lg:items-start"
			>
				{/* Mobile Tabs */}
				<div className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
					<TabsList className="w-full h-auto rounded-none bg-transparent p-0 flex flex-nowrap justify-center overflow-x-auto [&::-webkit-scrollbar]:h-0">
						<TabsTrigger value="home" className={mobileTabTriggerClass}>
							<HomeIcon className="size-4" />
							{activeTab === 'home' && <span>Home</span>}
						</TabsTrigger>
						<TabsTrigger value="current" className={mobileTabTriggerClass}>
							<Gem className="size-4" />
							{activeTab === 'current' && <span>Free Now</span>}
						</TabsTrigger>
						{activeMobileGames.length > 0 && (
							<TabsTrigger value="mobile" className={mobileTabTriggerClass}>
								<Smartphone className="size-4" />
								{activeTab === 'mobile' && <span>Mobile</span>}
							</TabsTrigger>
						)}
						<TabsTrigger value="upcoming" className={mobileTabTriggerClass}>
							<Calendar className="size-4" />
							{activeTab === 'upcoming' && <span>Upcoming</span>}
						</TabsTrigger>
						{expiredMobileGames.length > 0 && (
							<TabsTrigger value="expired" className={mobileTabTriggerClass}>
								<XCircle className="size-4" />
								{activeTab === 'expired' && <span>Expired</span>}
							</TabsTrigger>
						)}
						{(effectiveGames.currentGames.length > 0 || activeMobileGames.length > 0) && (
							<TabsTrigger value="claim" className={mobileTabTriggerClass}>
								<ShoppingCart className="size-4" />
								{activeTab === 'claim' && <span>Claim Games</span>}
							</TabsTrigger>
						)}
					</TabsList>
				</div>

				{/* Desktop Sidebar */}
				<aside className="hidden lg:flex lg:flex-col lg:self-stretch lg:min-h-[calc(100dvh-10rem)] border-r bg-background/50">
					<div className="p-6 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:h-full lg:min-h-0">
						<div className="space-y-6">
							<TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
								<TabsTrigger value="home" className={desktopSidebarTriggerClass}>
									<HomeIcon className="size-4" /> Home
								</TabsTrigger>
							</TabsList>
							<div className="space-y-1">
								<h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
									Games
								</h4>
								<TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
									<TabsTrigger value="current" className={desktopSidebarTriggerClass}>
										<Gem className="size-4" /> Free Now
									</TabsTrigger>
									<TabsTrigger value="upcoming" className={desktopSidebarTriggerClass}>
										<Calendar className="size-4" /> Upcoming
									</TabsTrigger>
								</TabsList>
							</div>

							{(activeMobileGames.length > 0 || expiredMobileGames.length > 0) && (
								<div className="space-y-1">
									<h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
										Mobile
									</h4>
									<TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
										{activeMobileGames.length > 0 && (
											<TabsTrigger value="mobile" className={desktopSidebarTriggerClass}>
												<Smartphone className="size-4" /> Free Now
											</TabsTrigger>
										)}
										{expiredMobileGames.length > 0 && (
											<TabsTrigger value="expired" className={desktopSidebarTriggerClass}>
												<XCircle className="size-4" /> Expired
											</TabsTrigger>
										)}
									</TabsList>
								</div>
							)}

							<div className="space-y-1">
								<h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
									Actions
								</h4>
								<TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
									<TabsTrigger value="claim" className={desktopSidebarTriggerClass}>
										<ShoppingCart className="size-4" /> Claim Games
									</TabsTrigger>
								</TabsList>
							</div>
						</div>
					</div>
				</aside>

				{/* Content Area */}
				<main className="min-w-0 flex-1 p-4 lg:p-8 overflow-x-hidden">
					<div className="max-w-6xl mx-auto">
						<TabsContent
							value="home"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<DesktopHome
								games={effectiveGames}
								activeMobileGames={activeMobileGames}
								expiredMobileGames={expiredMobileGames}
								gridClassName={gridClassName}
								renderGameCard={renderGameCard}
								renderMobileGameCard={renderMobileGameCard}
							/>
						</TabsContent>
						<TabsContent
							value="current"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">{renderContent('current')}</div>
							<div className="hidden lg:block">
								<SectionHeader icon={Gem} title="Desktop" />
								{renderContent('current')}
							</div>
						</TabsContent>
						<TabsContent
							value="mobile"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">{renderContent('mobile')}</div>
							<div className="hidden lg:block">
								<SectionHeader icon={Smartphone} title="Mobile" />
								{renderContent('mobile')}
							</div>
						</TabsContent>
						<TabsContent
							value="upcoming"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">{renderContent('upcoming')}</div>
							<div className="hidden lg:block">
								<SectionHeader icon={Calendar} title="Upcoming" />
								{renderContent('upcoming')}
							</div>
						</TabsContent>
						<TabsContent
							value="expired"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">{renderContent('expired')}</div>
							<div className="hidden lg:block">
								<SectionHeader icon={XCircle} title="Expired Offers" />
								{renderContent('expired')}
							</div>
						</TabsContent>
						<TabsContent
							value="claim"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">
								<ClaimTab games={effectiveGames} parsedMobileGames={activeMobileGames} />
							</div>
							<div className="hidden lg:block max-w-2xl">
								<SectionHeader icon={ShoppingCart} title="Claim Games" />
								<ClaimTab games={effectiveGames} parsedMobileGames={activeMobileGames} />
							</div>
						</TabsContent>
					</div>
				</main>
			</Tabs>
		</div>
	)
}
