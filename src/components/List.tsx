'use client'

import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	type ReactNode,
} from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateTimeLeft } from '@/lib/calculateTime'
import { getEffectiveGames, getMobileGameKey } from '@/lib/utils'
import {
	isMysteryGame,
	getCheckoutUrl,
	getMobileCheckoutUrl,
	getMobileCheckoutUrlForPlatform,
	formatMobileGamePrice,
	getGameLinkMeta,
	getPreferredGameImageUrl,
	buildBulkCheckoutUrl,
} from '@/lib/builder/shared'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
	Calendar,
	CalendarOff,
	Clock,
	Gift,
	Monitor,
	Smartphone,
	ShoppingCart,
	XCircle,
	Home as HomeIcon,
	Check,
	Copy,
	ExternalLink,
	AlertTriangle,
} from 'lucide-react'
import Image from 'next/image'
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet'
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

function MobilePlaceholder() {
	return (
		<div className="relative aspect-video overflow-hidden rounded-xl bg-epic-dark-blue/30 border border-dashed border-epic-blue/30 flex flex-col justify-between p-6 hover:border-epic-blue/50 hover:bg-epic-dark-blue/40 transition-all duration-300 group">
			<div className="flex-1 flex items-center justify-center">
				<div className="relative flex items-center justify-center size-16 rounded-full bg-epic-blue/5 border border-epic-blue/10 group-hover:scale-110 group-hover:bg-epic-blue/10 group-hover:border-epic-blue/20 transition-all duration-500">
					<Smartphone className="size-8 text-epic-blue/70 group-hover:text-epic-blue transition-colors" />
				</div>
			</div>

			<div className="space-y-1">
				<h3 className="text-base font-extrabold text-foreground group-hover:text-epic-blue transition-colors duration-300">
					Coming soon!
				</h3>
				<p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
					Free mobile games will be available soon.
				</p>
			</div>
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
			className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold text-white ${
				type === 'end' ? 'bg-epic-blue' : 'bg-black'
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
	titleSuffix,
	primary = false,
}: {
	icon: typeof Monitor
	title: string
	titleSuffix?: ReactNode
	primary?: boolean
}) {
	return (
		<div className="mb-5 flex items-center gap-3">
			<div
				className={`rounded-xl p-2.5 shadow-sm ${
					primary ? 'bg-epic-blue text-white' : 'bg-secondary text-foreground'
				}`}
			>
				<Icon className="size-5" />
			</div>
			<div>
				<div className="flex items-center gap-2">
					<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
					{titleSuffix}
				</div>
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
	copiedUrl,
	copyToClipboard,
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
	copiedUrl: string
	copyToClipboard: (url: string) => void
}) {
	const bulkCheckoutUrl = buildBulkCheckoutUrl(
		games.currentGames,
		activeMobileGames,
	)
	const totalClaimable =
		games.currentGames.filter(g => !isMysteryGame(g) && g.namespace && g.id)
			.length +
		activeMobileGames.reduce(
			(acc, mg) => acc + (mg.iosOffer || mg.androidOffer ? 1 : 0),
			0,
		)

	return (
		<>
			{bulkCheckoutUrl &&
				totalClaimable > 0 &&
				games.currentGames.length + activeMobileGames.length > 1 && (
					<div className="bg-epic-blue/10 flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between p-4 border border-epic-blue/20 rounded-xl">
						<div>
							<h4 className="font-extrabold text-epic-blue flex items-center gap-2">
								<ShoppingCart className="size-5" /> Claim All Free Games
							</h4>
							<p className="text-xs text-muted-foreground mt-0.5">
								There are currently {totalClaimable} available games that can be
								automatically claimed.
							</p>
						</div>
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<Button
								variant="outline"
								size="sm"
								onClick={() => copyToClipboard(bulkCheckoutUrl)}
								className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-4 px-4 transition-all duration-200 ${
									copiedUrl === bulkCheckoutUrl
										? 'border-green-500 text-green-500 bg-green-500/10'
										: ''
								}`}
							>
								{copiedUrl === bulkCheckoutUrl ? (
									<>
										<Check className="size-4 animate-in zoom-in duration-300" />
										<span>Copied!</span>
									</>
								) : (
									<>
										<Copy className="size-4" />
										<span>Copy Link</span>
									</>
								)}
							</Button>
							<Button
								size="sm"
								className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-epic-blue hover:bg-epic-blue/90 text-white font-bold py-4 px-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
								asChild
							>
								<a href={bulkCheckoutUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="size-4" />
									<span>Claim All</span>
								</a>
							</Button>
						</div>
					</div>
				)}
			<div className="space-y-10">
				{games.currentGames.length > 0 && (
					<div>
						<SectionHeader icon={Monitor} title="Desktop" />
						<div className={gridClassName}>
							{games.currentGames.map(game => renderGameCard(game, true))}
						</div>
					</div>
				)}
				<div>
					<SectionHeader
						icon={Smartphone}
						title="Mobile"
						titleSuffix={
							<Link
								href="https://egdata.app"
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs font-medium text-muted-foreground transition-colors hover:text-epic-blue"
							>
								via egdata.app
							</Link>
						}
					/>
					<div className={gridClassName}>
						{activeMobileGames.length > 0 ? (
							activeMobileGames.map(game => renderMobileGameCard(game, false))
						) : (
							<MobilePlaceholder />
						)}
					</div>
				</div>
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
		</>
	)
}

const isMobileGame = (
	game: GameItem | MobileGameDataLocal,
): game is MobileGameDataLocal => {
	return 'iosOffer' in game || 'androidOffer' in game
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
	const [activeTab, setActiveTab] = useState('home')

	const mobileGames = mobile
	const effectiveGames = useMemo(() => getEffectiveGames(games), [games])

	const now = new Date()
	const activeMobileGames = mobileGames.filter(
		g => !g.promoEndDate || new Date(g.promoEndDate) > now,
	)
	const expiredMobileGames = mobileGames.filter(
		g => g.promoEndDate && new Date(g.promoEndDate) <= now,
	)

	const [selectedGame, setSelectedGame] = useState<
		GameItem | MobileGameDataLocal | null
	>(null)
	const [copiedUrl, setCopiedUrl] = useState<string>('')

	const copyToClipboard = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url)
			setCopiedUrl(url)
			toast.success('Link copied to clipboard!')
			setTimeout(() => setCopiedUrl(''), 2000)
		} catch (err) {
			console.error(err)
			toast.error('Failed to copy URL')
		}
	}

	useEffect(() => {
		if (typeof window === 'undefined') return
		const checkDesktop = () => {
			const isLg = window.innerWidth >= 1024
			if (isLg && !localStorage.getItem('tabState')) {
				setActiveTab('home')
			}
		}

		checkDesktop()

		const handleResize = () => checkDesktop()

		window.addEventListener('resize', handleResize)
		return () => {
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
		const isAddOn = game.offerType === 'ADD_ON'
		const gameImageUrl = getPreferredGameImageUrl(game)

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
					{gameImageUrl ? (
						<Image
							src={gameImageUrl}
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

					<div className="absolute inset-0 bg-linear-to-t dark:from-black/95 from-black/70 via-black/20 dark:via-black/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

					<div className="absolute top-4 left-4 z-10">
						<TimeDisplay
							date={gameDate}
							type={isCurrentGame ? 'end' : 'start'}
							onExpired={handleExpired}
						/>
					</div>

					<div className="absolute bottom-0 left-0 right-0 p-4 z-10">
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
			<button
				type="button"
				key={game.id}
				className="w-full text-left h-full z-50 animate-in fade-in zoom-in-95 duration-300 block focus-visible:outline-hidden"
				onClick={() => setSelectedGame(game)}
			>
				{cardContent}
			</button>
		)
	}

	const renderMobileGameCard = (
		game: MobileGameDataLocal,
		isExpired = false,
	) => {
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
						<div className="absolute right-4 top-4 z-10 flex items-center rounded-md bg-black px-2 py-0.5 text-[10px] font-bold text-white">
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
							className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
								isExpired ? 'grayscale' : ''
							}`}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
							<Gift className="size-20 text-epic-blue/50" />
						</div>
					)}

					<div className="absolute inset-0 bg-linear-to-t dark:from-black/95 from-black/70 dark:via-black/30 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

					{isExpired ? (
						<div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-black text-white">
							<CalendarOff className="size-3.5" />
							<span>Ended</span>
						</div>
					) : (
						endDate && (
							<div className="absolute top-4 left-4 z-10">
								<TimeDisplay date={endDate} type="end" onExpired={handleExpired} />
							</div>
						)
					)}

					<div className="absolute bottom-0 left-0 right-0 p-4 z-10">
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
											className={`text-xs font-medium text-gray-400 ${
												!isExpired ? 'line-through' : ''
											}`}
										>
											{formatMobileGamePrice(game)}
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
			<button
				type="button"
				key={getMobileGameKey(game)}
				className="w-full text-left h-full z-50 animate-in fade-in zoom-in-95 duration-300 block focus-visible:outline-hidden"
				onClick={() => setSelectedGame(game)}
			>
				{cardContent}
			</button>
		)
	}

	const totalFreeNow = effectiveGames.currentGames.length
	const isSingleGame =
		totalFreeNow === 1 && effectiveGames.nextGames.length === 1
	const isTwoCurrentGames = totalFreeNow <= 2
	const isTwoUpcomingGames = effectiveGames.nextGames.length <= 2

	const gridClassName = `grid gap-4 ${
		isSingleGame
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
					<div className={tabGridClass}>
						<MobilePlaceholder />
					</div>
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
			default:
				return null
		}
	}

	return (
		<div className="w-full min-w-0 flex-1 flex flex-col">
			<Tabs
				defaultValue="home"
				value={activeTab}
				onValueChange={value => {
					setActiveTab(value)
					if (typeof window !== 'undefined') {
						localStorage.setItem('tabState', value)
					}
				}}
				className="w-full min-h-0 flex flex-col gap-0 flex-1 lg:grid lg:grid-cols-[16rem_1fr]"
			>
				{/* Mobile Tabs */}
				<div className="lg:hidden sticky top-0 z-60 bg-background/80 backdrop-blur-md border-b">
					<TabsList className="w-full h-auto rounded-none bg-transparent p-0 flex flex-nowrap justify-center overflow-x-auto [&::-webkit-scrollbar]:h-0">
						<TabsTrigger value="home" className={mobileTabTriggerClass}>
							<HomeIcon className="size-4" />
							{activeTab === 'home' && <span>Home</span>}
						</TabsTrigger>
						<TabsTrigger value="current" className={mobileTabTriggerClass}>
							<Monitor className="size-4" />
							{activeTab === 'current' && <span>Desktop</span>}
						</TabsTrigger>
						<TabsTrigger value="mobile" className={mobileTabTriggerClass}>
							<Smartphone className="size-4" />
							{activeTab === 'mobile' && <span>Mobile</span>}
						</TabsTrigger>
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
					</TabsList>
				</div>

				{/* Desktop Sidebar */}
				<aside className="hidden lg:block lg:self-stretch border-r bg-background/50">
					<div className="p-6 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto">
						<div className="space-y-1">
							<TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
								<TabsTrigger value="home" className={desktopSidebarTriggerClass}>
									<HomeIcon className="size-4 text-epic-blue" />{' '}
									<span className="text-epic-blue">Home</span>
								</TabsTrigger>
							</TabsList>
							<TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
								<TabsTrigger value="current" className={desktopSidebarTriggerClass}>
									<Monitor className="size-4" /> Desktop
								</TabsTrigger>
								<TabsTrigger value="mobile" className={desktopSidebarTriggerClass}>
									<Smartphone className="size-4" /> Mobile
								</TabsTrigger>
								{expiredMobileGames.length > 0 && (
									<TabsTrigger value="expired" className={desktopSidebarTriggerClass}>
										<XCircle className="size-4" /> Expired
									</TabsTrigger>
								)}
								<TabsTrigger value="upcoming" className={desktopSidebarTriggerClass}>
									<Calendar className="size-4" /> Upcoming
								</TabsTrigger>
							</TabsList>
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
								copiedUrl={copiedUrl}
								copyToClipboard={copyToClipboard}
							/>
						</TabsContent>
						<TabsContent
							value="current"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">{renderContent('current')}</div>
							<div className="hidden lg:block">
								<SectionHeader icon={Monitor} title="Desktop" />
								{renderContent('current')}
							</div>
						</TabsContent>
						<TabsContent
							value="mobile"
							className="mt-0 outline-none animate-in fade-in duration-300"
						>
							<div className="lg:hidden">{renderContent('mobile')}</div>
							<div className="hidden lg:block">
								<SectionHeader
									icon={Smartphone}
									title="Mobile"
									titleSuffix={
										<Link
											href="https://egdata.app"
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs font-medium text-muted-foreground transition-colors hover:text-epic-blue"
										>
											via egdata.app
										</Link>
									}
								/>
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
					</div>
				</main>
			</Tabs>

			{/* Game Details Sheet */}
			<Sheet
				open={selectedGame !== null}
				onOpenChange={open => {
					if (!open) {
						setSelectedGame(null)
					}
				}}
			>
				<SheetContent
					side="left"
					className="w-full sm:max-w-md overflow-y-auto h-full flex flex-col gap-0 p-0 bg-background/95 backdrop-blur-md border-l"
				>
					<SheetTitle className="sr-only">
						{selectedGame?.title || 'Game Details'}
					</SheetTitle>
					<SheetDescription className="sr-only">
						{selectedGame
							? `Details for ${selectedGame.title}`
							: 'Details of the selected game'}
					</SheetDescription>
					{selectedGame &&
						(() => {
							const isMobile = isMobileGame(selectedGame)
							const title = selectedGame.title
							let sellerName = selectedGame.seller?.name
							if (sellerName === 'Epic Dev Test Account') sellerName = undefined

							let imageUrl = ''
							let originalPriceFormatted = ''
							let isMystery = false
							let showDate = false
							let dateLabel = ''
							let dateValue: Date | null = null
							let isCurrent = false
							let isUpcoming = false
							let isExpired = false

							if (isMobile) {
								const mg = selectedGame as MobileGameDataLocal
								imageUrl = mg.imageUrl
								isExpired = Boolean(mg.promoEndDate) && new Date(mg.promoEndDate) <= now
								if (mg.originalPrice > 0) {
									originalPriceFormatted = formatMobileGamePrice(mg)
								}
								if (mg.promoEndDate) {
									showDate = true
									dateValue = new Date(mg.promoEndDate)
									dateLabel = isExpired ? 'Ended' : 'Ends'
								}
							} else {
								const game = selectedGame as GameItem
								isMystery = isMysteryGame(game)
								imageUrl = getPreferredGameImageUrl(game) || ''

								isCurrent = effectiveGames.currentGames.some(g => g.id === game.id)
								isUpcoming = effectiveGames.nextGames.some(g => g.id === game.id)

								if (game.price?.totalPrice?.originalPrice > 0) {
									originalPriceFormatted = game.price.totalPrice.fmtPrice.originalPrice
								}

								if (isCurrent) {
									const promo =
										game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]
									if (promo) {
										showDate = true
										dateValue = new Date(promo.endDate)
										dateLabel = 'Ends'
									}
								} else if (isUpcoming) {
									const promo =
										game.promotions?.upcomingPromotionalOffers?.[0]
											?.promotionalOffers?.[0]
									if (promo) {
										showDate = true
										dateValue = new Date(promo.startDate)
										dateLabel = 'Starts'
									}
								}
							}

							const formattedDate = dateValue
								? dateValue.toLocaleDateString('en-US', {
										weekday: 'short',
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: '2-digit',
									})
								: ''

							return (
								<div className="flex flex-col min-h-full">
									{/* Image Header */}
									<div className="relative w-full aspect-video bg-muted overflow-hidden shrink-0">
										{imageUrl ? (
											<Image
												src={imageUrl}
												width={1280}
												height={720}
												alt={title}
												className="w-full h-full object-cover"
												priority
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-epic-dark-blue">
												<Gift className="size-16 text-epic-blue/50" />
											</div>
										)}
										<div className="absolute inset-0 bg-linear-to-t from-background via-background/10 to-transparent" />

										{/* Top Badge */}
										<div className="absolute top-4 left-4 z-10 flex gap-2">
											{!isMobile && isUpcoming && (
												<span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-white">
													UPCOMING
												</span>
											)}
											{isMobile && (
												<span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-white">
													MOBILE
												</span>
											)}
											{isExpired && (
												<span className="rounded-md bg-red-600/90 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-white">
													EXPIRED
												</span>
											)}
										</div>
									</div>

									{/* Content Body */}
									<div className="flex-1 p-6 space-y-6">
										<div className="space-y-1">
											{sellerName && (
												<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
													{sellerName}
												</p>
											)}
											<h2 className="text-2xl font-extrabold tracking-tight leading-tight">
												{title}
											</h2>
										</div>

										{/* Price Section */}
										<div className="flex items-center gap-3">
											{isUpcoming ? (
												<span className="text-lg font-bold text-muted-foreground">
													Upcoming Offer
												</span>
											) : isExpired ? (
												<span className="text-lg font-bold text-red-500">
													Offer Expired
												</span>
											) : (
												<span className="rounded-md bg-epic-blue px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
													FREE
												</span>
											)}
											{originalPriceFormatted && (
												<span className="text-sm font-medium text-muted-foreground line-through">
													{originalPriceFormatted}
												</span>
											)}
										</div>

										{/* Date with countdown */}
										{showDate && dateValue && (
											<div
												className={`p-4 rounded-xl border flex flex-col gap-2 ${
													dateLabel === 'Ends'
														? 'bg-epic-blue/5 border-epic-blue/15'
														: 'bg-black/5 dark:bg-white/5 border-muted'
												}`}
											>
												<div className="flex items-center gap-2 text-sm font-semibold">
													<Calendar className="size-4 text-epic-blue" />
													<span className="text-foreground">
														{dateLabel === 'Ends' ? 'Free until' : 'Available starting'}:{' '}
														{formattedDate}
													</span>
												</div>
												{!isExpired && (
													<div className="flex items-center justify-between mt-1 pt-2 border-t border-muted/50">
														<span className="text-xs text-muted-foreground">
															Time remaining:
														</span>
														<TimeDisplay
															date={dateValue}
															type={dateLabel === 'Ends' ? 'end' : 'start'}
															onExpired={handleExpired}
														/>
													</div>
												)}
											</div>
										)}

										{/* Actions Section */}
										<div className="space-y-4 pt-4 border-t">
											{isMystery && !isUpcoming ? (
												<div className="space-y-4">
													{/* Mystery Banner */}
													<div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 text-xs leading-relaxed space-y-1">
														<p className="font-extrabold flex items-center gap-1.5 text-sm">
															<AlertTriangle className="size-4 shrink-0" /> Unable to generate
															checkout link
														</p>
														<p>
															This was a mystery game and cannot automatically make a checkout
															link. Checkout links will become active when the mystery game
															period is over.
														</p>
													</div>

													{/* Disabled buttons */}
													<Button
														disabled
														className="w-full flex items-center gap-2 py-6 text-base font-bold"
													>
														<ShoppingCart className="size-5" /> Claim Game
													</Button>
													<Button
														disabled
														variant="outline"
														className="w-full flex items-center gap-2 py-6"
													>
														<Copy className="size-4" /> Copy Link
													</Button>

													{/* Store page button */}
													<Button
														asChild
														variant="secondary"
														className="w-full flex items-center justify-center gap-2 py-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
													>
														<a
															href={
																getGameLinkMeta(selectedGame as GameItem).browserUrl ||
																'https://store.epicgames.com/en-US/free-games'
															}
															target="_blank"
															rel="noopener noreferrer"
														>
															<ExternalLink className="size-4" /> Store Page
														</a>
													</Button>
												</div>
											) : isMobile ? (
												// Mobile offers
												(() => {
													const mg = selectedGame as MobileGameDataLocal
													const iosCheckoutUrl = getMobileCheckoutUrlForPlatform(mg, 'ios')
													const androidCheckoutUrl = getMobileCheckoutUrlForPlatform(
														mg,
														'android',
													)
													const combinedCheckoutUrl = getMobileCheckoutUrl(mg)
													const hasBoth = Boolean(mg.iosOffer && mg.androidOffer)

													if (isExpired) {
														return (
															<div className="text-center p-4 text-sm text-muted-foreground">
																This mobile promotion has ended and cannot be claimed.
															</div>
														)
													}

													return (
														<div className="space-y-4">
															{hasBoth && combinedCheckoutUrl && (
																<div className="p-4 rounded-xl border bg-epic-blue/5 border-epic-blue/15 space-y-3">
																	<div>
																		<h4 className="font-extrabold text-sm text-epic-blue flex items-center gap-1.5">
																			<ShoppingCart className="size-4" /> iOS & Android Bundle
																		</h4>
																		<p className="text-xs text-muted-foreground mt-0.5">
																			Claim both platforms in a single transaction.
																		</p>
																	</div>
																	<div className="flex gap-2">
																		<Button
																			asChild
																			className="flex-1 bg-epic-blue hover:bg-epic-blue/90 text-white font-bold py-5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
																		>
																			<a
																				href={combinedCheckoutUrl}
																				target="_blank"
																				rel="noopener noreferrer"
																			>
																				<ExternalLink className="size-4" /> Claim
																			</a>
																		</Button>
																		<Button
																			variant="outline"
																			className={`flex-1 py-5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
																				copiedUrl === combinedCheckoutUrl
																					? 'border-green-500 text-green-500 bg-green-500/10'
																					: ''
																			}`}
																			onClick={() => copyToClipboard(combinedCheckoutUrl)}
																		>
																			{copiedUrl === combinedCheckoutUrl ? 'Copied!' : 'Copy Link'}
																		</Button>
																	</div>
																</div>
															)}

															{mg.iosOffer && (
																<div className="p-4 rounded-xl border bg-secondary/30 space-y-3">
																	<div className="flex justify-between items-center">
																		<h4 className="font-extrabold text-sm flex items-center gap-1.5">
																			<Smartphone className="size-4 text-muted-foreground" /> iOS
																			Version
																		</h4>
																		{mg.iosOffer.pageSlug && (
																			<a
																				href={`https://store.epicgames.com/p/${mg.iosOffer.pageSlug}`}
																				target="_blank"
																				rel="noopener noreferrer"
																				className="text-xs text-epic-blue hover:underline flex items-center gap-1"
																			>
																				Store Page <ExternalLink className="size-3" />
																			</a>
																		)}
																	</div>
																	<div className="flex gap-2">
																		<Button
																			asChild
																			variant="secondary"
																			className="flex-1 py-5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
																		>
																			<a
																				href={iosCheckoutUrl ?? '#'}
																				target="_blank"
																				rel="noopener noreferrer"
																			>
																				Claim
																			</a>
																		</Button>
																		<Button
																			variant="outline"
																			className={`flex-1 py-5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
																				copiedUrl === iosCheckoutUrl
																					? 'border-green-500 text-green-500 bg-green-500/10'
																					: ''
																			}`}
																			onClick={() =>
																				iosCheckoutUrl && copyToClipboard(iosCheckoutUrl)
																			}
																		>
																			{copiedUrl === iosCheckoutUrl ? 'Copied!' : 'Copy Link'}
																		</Button>
																	</div>
																</div>
															)}

															{mg.androidOffer && (
																<div className="p-4 rounded-xl border bg-secondary/30 space-y-3">
																	<div className="flex justify-between items-center">
																		<h4 className="font-extrabold text-sm flex items-center gap-1.5">
																			<Smartphone className="size-4 text-muted-foreground" />{' '}
																			Android Version
																		</h4>
																		{mg.androidOffer.pageSlug && (
																			<a
																				href={`https://store.epicgames.com/p/${mg.androidOffer.pageSlug}`}
																				target="_blank"
																				rel="noopener noreferrer"
																				className="text-xs text-epic-blue hover:underline flex items-center gap-1"
																			>
																				Store Page <ExternalLink className="size-3" />
																			</a>
																		)}
																	</div>
																	<div className="flex gap-2">
																		<Button
																			asChild
																			variant="secondary"
																			className="flex-1 py-5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
																		>
																			<a
																				href={androidCheckoutUrl ?? '#'}
																				target="_blank"
																				rel="noopener noreferrer"
																			>
																				Claim
																			</a>
																		</Button>
																		<Button
																			variant="outline"
																			className={`flex-1 py-5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
																				copiedUrl === androidCheckoutUrl
																					? 'border-green-500 text-green-500 bg-green-500/10'
																					: ''
																			}`}
																			onClick={() =>
																				androidCheckoutUrl && copyToClipboard(androidCheckoutUrl)
																			}
																		>
																			{copiedUrl === androidCheckoutUrl ? 'Copied!' : 'Copy Link'}
																		</Button>
																	</div>
																</div>
															)}
														</div>
													)
												})()
											) : (
												// PC offers
												(() => {
													const game = selectedGame as GameItem
													const checkoutUrl = getCheckoutUrl(game)
													const { browserUrl: storeUrl } = getGameLinkMeta(game)

													return (
														<div className="space-y-3">
															{isCurrent && checkoutUrl && (
																<>
																	<Button
																		asChild
																		className="w-full flex items-center justify-center gap-2 py-6 text-base font-bold bg-epic-blue hover:bg-epic-blue/90 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
																	>
																		<a
																			href={checkoutUrl}
																			target="_blank"
																			rel="noopener noreferrer"
																		>
																			<ShoppingCart className="size-5" /> Claim Game
																		</a>
																	</Button>
																	<Button
																		variant="outline"
																		className={`w-full flex items-center justify-center gap-2 py-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
																			copiedUrl === checkoutUrl
																				? 'border-green-500 text-green-500 bg-green-500/10'
																				: ''
																		}`}
																		onClick={() =>
																			copyToClipboard(copiedUrl === checkoutUrl ? '' : checkoutUrl)
																		}
																	>
																		{copiedUrl === checkoutUrl ? (
																			<>
																				<Check className="size-4 animate-in zoom-in duration-300" />
																				<span>Copied!</span>
																			</>
																		) : (
																			<>
																				<Copy className="size-4" />
																				<span>Copy Link</span>
																			</>
																		)}
																	</Button>
																</>
															)}

															{storeUrl && (
																<Button
																	asChild
																	variant="secondary"
																	className="w-full flex items-center justify-center gap-2 py-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
																>
																	<a href={storeUrl} target="_blank" rel="noopener noreferrer">
																		<ExternalLink className="size-4" /> Open Epic Games Store
																	</a>
																</Button>
															)}
														</div>
													)
												})()
											)}
										</div>
									</div>
								</div>
							)
						})()}
				</SheetContent>
			</Sheet>
		</div>
	)
}
