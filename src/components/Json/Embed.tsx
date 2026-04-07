import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { epicMobileProductPageUrl } from '@/lib/builder/shared'
import { getEffectiveGames, getMobileGameKey } from '@/lib/utils'
import Discord from '../ui/discord'

const defaultContent = '<@&847939354978811924>'
const EMPTY_MOBILE_GAMES: MobileGameDataLocal[] = []

function PreviewLinkButton({
	href,
	label,
}: {
	href: string
	label: string
}) {
	return (
		<a
			href={href}
			className="inline-flex items-center gap-1.5 rounded-md border border-[#d4d7dc] bg-[#ffffff] px-3 py-1.5 text-sm font-medium text-[#2e3338] hover:bg-[#f2f3f5] dark:border-[#4e5058] dark:bg-[#2b2d31] dark:text-[#f2f3f5] dark:hover:bg-[#393c41]"
			target="_blank"
		>
			<span>{label}</span>
			<ExternalLink className="size-3.5" />
		</a>
	)
}

function PreviewTimestampChip({
	label,
	date,
}: {
	label?: string
	date: Date
}) {
	return (
		<span className="inline-flex items-baseline gap-1 text-black dark:text-white">
			{label && <span>{label}</span>}
			<span className="rounded px-0.5 text-[13px] font-light text-black dark:text-white bg-[#eeeef0] dark:bg-[#404249]">
				{format(date, 'dd/MM/yyyy')}
			</span>
		</span>
	)
}

export default function DiscordPreview({
	games,
	settings,
	checkoutLink = '',
	parsedMobileGames = EMPTY_MOBILE_GAMES,
}: {
	games: Game
	settings: EgFreeSettings
	checkoutLink?: string
	parsedMobileGames?: MobileGameDataLocal[]
}) {
	const effectiveGames = getEffectiveGames(games)
	const selectedGames = [
		...effectiveGames.currentGames,
		...effectiveGames.nextGames,
	].filter(
		game => settings.selectedGames[game.id],
	)

	const mysteryGames = effectiveGames.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account',
	)

	const selectedMobileCount = parsedMobileGames.filter(
		game => settings.selectedGames[getMobileGameKey(game)],
	).length

	const generateBulkCheckoutUrl = () => {
		if (mysteryGames) return null

		const pcOffers = effectiveGames.currentGames
			.filter(game => settings.selectedGames[game.id])
			.map(game => {
				if (!game.namespace || !game.id) return null
				return `1-${game.namespace}-${game.id}-`
			})
			.filter(Boolean)

		const mobileOffers = parsedMobileGames
			.filter(game => settings.selectedGames[getMobileGameKey(game)])
			.flatMap(mg => {
				const offers: string[] = []
				if (mg.iosOffer) offers.push(`1-${mg.namespace}-${mg.iosOffer.id}--`)
				if (mg.androidOffer)
					offers.push(`1-${mg.namespace}-${mg.androidOffer.id}--`)
				return offers
			})

		const offers = [...pcOffers, ...mobileOffers]
		if (offers.length === 0) return null

		const offersParam = offers.map(offer => `offers=${offer}`).join('&')
		return `https://store.epicgames.com/purchase?${offersParam}#`
	}

	const bulkCheckoutUrl = generateBulkCheckoutUrl()

	const normalizeCheckoutUrl = (url: string) => {
		if (!url.trim()) return ''

		try {
			let fullUrl = url.trim()

			if (fullUrl.startsWith('/purchase')) {
				fullUrl = `https://store.epicgames.com${fullUrl}`
			} else if (!fullUrl.startsWith('http')) {
				fullUrl = `https://store.epicgames.com/${fullUrl}`
			}

			const urlObj = new URL(fullUrl)
			const offers = urlObj.searchParams.getAll('offers')

			if (offers.length === 0) return fullUrl

			const offersParam = offers.map(offer => `offers=${offer}`).join('&')
			return `https://store.epicgames.com/purchase?${offersParam}#`
		} catch {
			return url
		}
	}

	const normalizedCheckoutLink = normalizeCheckoutUrl(checkoutLink)
	const selectedCurrentGamesCount = effectiveGames.currentGames.filter(
		game => settings.selectedGames[game.id],
	).length
	const componentsV2CheckoutHref =
		settings.includeCheckout &&
			selectedCurrentGamesCount + selectedMobileCount > 1 &&
			(!mysteryGames || normalizedCheckoutLink)
			? normalizedCheckoutLink || bulkCheckoutUrl
			: null

	const isCurrentlyFree = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage === 0 &&
			game.promotions?.promotionalOffers.length > 0,
		)
	}

	const isPermanentlyFree = (game: GameItem) => {
		return game.price.totalPrice.originalPrice === 0
	}

	const isDiscountedGame = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage > 0 &&
			game.promotions?.promotionalOffers.length > 0,
		)
	}

	return (
		<div className="bg-[#ffffff] dark:bg-[#313338] dark:text-white p-4 wrap-anywhere w-full">
			<div className="flex gap-4">
				<div className="shrink-0">
					{settings.webhookAvatar ? (
						<Image
							src={settings.webhookAvatar}
							alt="Webhook Avatar"
							className="rounded-full size-10 mt-1"
							width={40}
							height={40}
							unoptimized
						/>
					) : (
						<div className="dark:bg-[#6263ed] bg-[#5865f2] rounded-full size-10 mt-1 flex items-center justify-center">
							<Discord className="filter invert brightness-0 size-5.75" />
						</div>
					)}
				</div>
				<div className="grow">
					<div className="flex items-center gap-1 mb-1">
						<div className="font-medium">
							{settings.webhookName || 'Captain Hook'}
						</div>
						<div className="dark:bg-[#6263ed] bg-[#5865f2] ml-0.5 text-white rounded-sm px-1.25 font-semibold text-xs mt-0.5">
							APP
						</div>
						<div className="text-xs ml-1 mt-0.5 text-[#616366] dark:text-[#949b9d]">
							{format(new Date(), 'HH:mm')}
						</div>
					</div>
					<div className="mb-2 text-sm">
						{(settings.embedContent || defaultContent)
							.split(/(<@&\d+>)/)
							.map((part, i) => {
								const roleMatch = part.match(/^<@&(\d+)>$/)
								if (roleMatch) {
									return (
										<span
											key={i}
											className="text-[#535ec8] dark:text-[#c9cdfb] bg-[#e6e8fd] dark:bg-[#3c4270] rounded-sm py-0.5 px-1"
										>
											@role
										</span>
									)
								}
								return part
							})}
					</div>
					{selectedGames.map((game: GameItem) => {
						const isCurrent = game.promotions.promotionalOffers.length > 0
						const dateInfo = isCurrent
							? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
							: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
								.startDate
						const endDate = new Date(dateInfo)
						const rawPageSlug =
							game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
						const pageSlug = rawPageSlug?.replace(/\/[^/]*$/, '') || rawPageSlug
						const isValidPageSlug =
							pageSlug && pageSlug !== '[]' && pageSlug.trim() !== ''
						const isBundleGame = game.categories?.some(
							(category: { path: string }) => category.path === 'bundles',
						)
						const linkPrefix = isBundleGame ? 'bundles/' : 'p/'
						const imageUrl = game.keyImages.find(
							(img: { type: string; url: string }) =>
								img.type === 'VaultClosed' ||
								img.type === 'DieselStoreFrontWide' ||
								img.type === 'OfferImageWide' ||
								img.type === 'DieselGameBoxWide',
						)?.url
						const isAddOn = game.offerType === 'ADD_ON'

						const getCheckoutUrl = (game: GameItem) => {
							if (!game.namespace || !game.id) return null
							const offerParam = `offers=1-${game.namespace}-${game.id}-`
							return `https://store.epicgames.com/purchase?${offerParam}#`
						}

						const browserHref = isValidPageSlug
							? `https://store.epicgames.com/${linkPrefix}${pageSlug}`
							: null
						const checkoutUrlForGame = getCheckoutUrl(game)
						let claimHrefV2: string | null = null
						let claimLabelV2 = 'Claim Game'
						if (settings.includeClaimGame && isCurrent) {
							if (isCurrentlyFree(game)) {
								if (isPermanentlyFree(game)) {
									claimHrefV2 = isValidPageSlug
										? `https://store.epicgames.com/${linkPrefix}${pageSlug}`
										: null
								} else if (
									settings.includeCheckout &&
									normalizedCheckoutLink &&
									selectedCurrentGamesCount === 1
								) {
									claimHrefV2 = normalizedCheckoutLink
								} else {
									claimHrefV2 = checkoutUrlForGame
								}
								claimLabelV2 = isAddOn
									? 'Claim Add-on'
									: isBundleGame
										? 'Claim Bundle'
										: 'Claim Game'
							} else if (isValidPageSlug) {
								claimHrefV2 = `https://store.epicgames.com/${linkPrefix}${pageSlug}`
								claimLabelV2 = isDiscountedGame(game)
									? 'Store Page'
									: isAddOn
										? 'Claim Add-on'
										: isBundleGame
											? 'Claim Bundle'
											: 'Claim Game'
							}
						}

						if (settings.componentsV2) {
							return (
								<div key={game.id} className="mt-2">
									<div className="max-w-[600px] overflow-hidden rounded-md border border-[#d4d7dc] dark:border-[#4e5058] px-4 pt-4 bg-[#ffffff] dark:bg-[#242429]">
										{settings.includeImage && imageUrl && (
											<Image
												width={1280}
												height={720}
												src={imageUrl}
												alt={game.title}
												className="w-full object-cover rounded-md"
												unoptimized
											/>
										)}
										<div>
											<div className="flex items-start justify-between gap-3 mt-3">
												<div className="min-w-0 flex-1">
													{isValidPageSlug ? (
														<a
															href={browserHref!}
															className="block text-[19px] font-bold leading-7 text-[#216ad0] dark:text-[#5593eb] hover:underline"
															target="_blank"
														>
															{game.title}
														</a>
													) : (
														<span className="block text-[19px] font-bold leading-7 text-black dark:text-white">
															{game.title}
														</span>
													)}
													<div className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-sm">
														{settings.includePrice &&
															(!isCurrent ? (
																<span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
																	{game.price.totalPrice.originalPrice === 0 ? (
																		<span className="font-light text-black dark:text-white">Free</span>
																	) : (
																		<span className="font-light text-black dark:text-white">
																			{game.price.totalPrice.fmtPrice.originalPrice}
																		</span>
																	)}
																</span>
															) : (
																<span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
																	{isCurrentlyFree(game) ? (
																		game.price.totalPrice.originalPrice === 0 ? (
																			<span className="font-light text-black dark:text-white">Free</span>
																		) : (
																			<>
																				<span className="font-light line-through text-black dark:text-white">
																					{game.price.totalPrice.fmtPrice.originalPrice}
																				</span>
																				<span className="font-semibold text-black dark:text-white">Free</span>
																			</>
																		)
																	) : isPermanentlyFree(game) ? (
																		<span className="font-semibold text-black dark:text-white">Free</span>
																	) : isDiscountedGame(game) ? (
																		<>
																			<span className="font-light line-through text-black dark:text-white">
																				{game.price.totalPrice.fmtPrice.originalPrice}
																			</span>
																			<span className="font-semibold text-black dark:text-white">
																				{game.price.totalPrice.fmtPrice.discountPrice}
																			</span>
																		</>
																	) : (
																		<span className="font-semibold text-black dark:text-white">
																			{game.price.totalPrice.fmtPrice.originalPrice}
																		</span>
																	)}
																</span>
															))}
														{settings.includeFooter && (
															<PreviewTimestampChip
																label={isCurrent ? 'until' : 'starts'}
																date={endDate}
															/>
														)}
													</div>
												</div>
												<Image
													width={1280}
													height={720}
													src="https://up.wolfey.me/gO16VwIQ"
													alt=""
													className="size-21 shrink-0 rounded-md bg-[#3a3c43]"
												/>
											</div>
											<div className="mt-2.5 mb-4 flex flex-wrap gap-2">
												{browserHref && (
													<PreviewLinkButton
														href={browserHref}
														label="Open in browser"
													/>
												)}
												{claimHrefV2 && (
													<PreviewLinkButton
														href={claimHrefV2}
														label={claimLabelV2}
													/>
												)}
											</div>
										</div>
									</div>
								</div>
							)
						}

						return (
							<div
								key={game.id}
								className="flex mt-1 rounded-sm overflow-hidden"
								style={{ borderLeft: `4px solid ${settings.embedColor}` }}
							>
								<div className="max-w-md bg-[#ffffff] dark:bg-[#2B2D31] border border-[#d4d7dc] dark:border-[#4e5058] rounded-r-sm p-3.5 pr-4">
									<div className="flex items-center mb-2">
										<Image
											width={1280}
											height={720}
											src="https://up.wolfey.me/mFG3IGgV"
											alt="Epic Games Store"
											className="size-7 rounded-full mr-2.5"
										/>
										<p className="hover:underline text-sm font-medium cursor-pointer">
											Epic Games Store
										</p>
									</div>
									<div className="flex flex-col text-sm gap-0.5">
										{isValidPageSlug ? (
											<a
												href={`https://store.epicgames.com/${linkPrefix}${pageSlug}`}
												className="font-semibold flex items-center mb-2 text-[16px] text-[#2b71d2] dark:text-[#5593eb] hover:underline"
												target="_blank"
											>
												{game.title}
											</a>
										) : (
											<span className="font-semibold flex items-center mb-2 text-[16px]">
												{game.title}
											</span>
										)}
										{settings.includePrice &&
											(!isCurrent ? (
												<span>
													{game.price.totalPrice.originalPrice === 0 ? (
														<span className="font-light">Free</span>
													) : (
														<span>{game.price.totalPrice.fmtPrice.originalPrice}</span>
													)}
												</span>
											) : (
												<>
													{isCurrentlyFree(game) ? (
														<span>
															{game.price.totalPrice.originalPrice === 0 ? (
																<span className="font-light">Free</span>
															) : (
																<span>
																	<span className="line-through font-extralight">
																		{game.price.totalPrice.fmtPrice.originalPrice}
																	</span>{' '}
																	<span className="font-semibold">Free</span>
																</span>
															)}
														</span>
													) : isPermanentlyFree(game) ? (
														<span className="font-semibold">Free</span>
													) : isDiscountedGame(game) ? (
														<span>
															<span className="line-through font-extralight">
																{game.price.totalPrice.fmtPrice.originalPrice}
															</span>{' '}
															<span className="font-semibold">
																{game.price.totalPrice.fmtPrice.discountPrice}
															</span>
														</span>
													) : (
														<span className="font-semibold">
															{game.price.totalPrice.fmtPrice.originalPrice}
														</span>
													)}
												</>
											))}
										{isCurrent &&
											isCurrentlyFree(game) &&
											settings.includeClaimGame &&
											(() => {
												const checkoutUrl = getCheckoutUrl(game)
												const manualCheckoutUrl =
													settings.includeCheckout &&
														normalizedCheckoutLink &&
														selectedCurrentGamesCount === 1
														? normalizedCheckoutLink
														: null
												const claimUrl =
													manualCheckoutUrl ||
													checkoutUrl ||
													(isValidPageSlug
														? `https://store.epicgames.com/${linkPrefix}${pageSlug}`
														: null)
												if (!claimUrl) return null
												return (
													<a
														href={claimUrl}
														className="text-[#4e80eb] dark:text-[#00A8FC] hover:underline self-start"
														target="_blank"
													>
														{isAddOn
															? 'Claim Add-on'
															: isBundleGame
																? 'Claim Bundle'
																: 'Claim Game'}
													</a>
												)
											})()}
										{settings.includeImage && imageUrl && (
											<Image
												width={1280}
												height={720}
												src={imageUrl}
												alt={game.title}
												className="w-full h-full object-cover rounded-md mt-4"
											/>
										)}
									</div>
									{settings.includeFooter && (
										<div className="text-xs font-light mt-2!">
											{isCurrent ? 'Offer ends' : 'Offer starts'} •{' '}
											{format(endDate, 'dd/MM/yyyy')}
										</div>
									)}
								</div>
							</div>
						)
					})}

					{parsedMobileGames
						.filter(game => settings.selectedGames[getMobileGameKey(game)])
						.map(game => {
							const endDate = game.promoEndDate ? new Date(game.promoEndDate) : null
							const isCombined = Boolean(game.iosOffer && game.androidOffer)
							const iosLink = epicMobileProductPageUrl(game.iosOffer?.pageSlug)
							const androidLink = epicMobileProductPageUrl(
								game.androidOffer?.pageSlug,
							)
							const storeUrl = iosLink ?? androidLink

							const offerParams: string[] = []
							if (game.iosOffer)
								offerParams.push(`1-${game.namespace}-${game.iosOffer.id}--`)
							if (game.androidOffer)
								offerParams.push(`1-${game.namespace}-${game.androidOffer.id}--`)
							const checkoutUrl =
								offerParams.length > 0
									? `https://store.epicgames.com/purchase?offers=${offerParams.join('&offers=')}#/`
									: null

							const priceFormatted = new Intl.NumberFormat('en-US', {
								style: 'currency',
								currency: game.currencyCode,
								minimumFractionDigits: 2,
							}).format(game.originalPrice / 100)

							if (settings.componentsV2) {
								return (
									<div key={getMobileGameKey(game)} className="mt-2">
										<div className="max-w-[600px] overflow-hidden rounded-md border border-[#d4d7dc] dark:border-[#4e5058] px-4 pt-4 bg-[#ffffff] dark:bg-[#242429]">
											{settings.includeImage && game.imageUrl && (
												<Image
													width={1280}
													height={720}
													src={game.imageUrl}
													alt={game.title}
													className="w-full object-cover rounded-md"
													unoptimized
												/>
											)}
											<div>
												<div className="flex items-start justify-between gap-3 mt-3">
													<div className="min-w-0 flex-1">
														<span className="block text-[19px] font-bold leading-7 text-black dark:text-white">
															{game.title}
														</span>
														<div className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-sm">
															{settings.includePrice && (
																<span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
																	<span className="font-light line-through text-black dark:text-white">
																		{priceFormatted}
																	</span>
																	<span className="font-semibold text-black dark:text-white">Free</span>
																</span>
															)}
															{settings.includeFooter && endDate && (
																<PreviewTimestampChip label="until" date={endDate} />
															)}
														</div>
													</div>
													<Image
														width={1280}
														height={720}
														src="https://up.wolfey.me/gO16VwIQ"
														alt="Epic Games Store Mobile"
														className="size-21 shrink-0 rounded-md bg-[#3a3c43]"
													/>
												</div>
												<div className="mt-2.5 mb-4 flex flex-wrap gap-2">
													{isCombined && iosLink && (
														<PreviewLinkButton href={iosLink} label="iOS" />
													)}
													{isCombined && androidLink && (
														<PreviewLinkButton
															href={androidLink}
															label="Android"
														/>
													)}
													{checkoutUrl && settings.includeClaimGame && (
														<PreviewLinkButton
															href={checkoutUrl}
															label="Claim Game"
														/>
													)}
												</div>
											</div>
										</div>
									</div>
								)
							}

							return (
								<div
									key={getMobileGameKey(game)}
									className="flex mt-1 rounded-sm overflow-hidden"
									style={{
										borderLeft: `4px solid ${settings.embedColor}`,
									}}
								>
									<div className="max-w-md bg-[#ffffff] dark:bg-[#2B2D31] border border-[#d4d7dc] dark:border-[#4e5058] rounded-r-sm p-3.5 pr-4">
										<div className="flex items-center mb-2">
											<Image
												width={1280}
												height={720}
												src="https://up.wolfey.me/mFG3IGgV"
												alt="Epic Games Store Mobile"
												className="size-7 rounded-full mr-2.5"
											/>
											<p className="hover:underline text-sm font-medium cursor-pointer">
												Epic Games Store Mobile
											</p>
										</div>
										<div className="flex flex-col text-sm gap-0.5">
											{isCombined ? (
												<span className="font-semibold flex items-center mb-2 text-[16px]">
													{game.title}
												</span>
											) : storeUrl ? (
												<a
													href={storeUrl}
													className="font-semibold flex items-center mb-2 text-[16px] text-[#2b71d2] dark:text-[#5593eb] hover:underline"
													target="_blank"
												>
													{game.title}
												</a>
											) : (
												<span className="font-semibold flex items-center mb-2 text-[16px]">
													{game.title}
												</span>
											)}
											{checkoutUrl && settings.includeClaimGame && (
												<a
													href={checkoutUrl}
													className="text-[#2b71d2] dark:text-[#5593eb] hover:underline self-start"
													target="_blank"
												>
													Claim Game
												</a>
											)}
											{settings.includePrice && (
												<span>
													<span className="line-through font-extralight">
														{priceFormatted}
													</span>{' '}
													<span className="font-semibold">Free</span>
												</span>
											)}
											{isCombined && iosLink && (
												<a
													href={iosLink}
													className="text-[#2b71d2] dark:text-[#5593eb] hover:underline self-start"
													target="_blank"
												>
													iOS
												</a>
											)}
											{isCombined && androidLink && (
												<a
													href={androidLink}
													className="text-[#2b71d2] dark:text-[#5593eb] hover:underline self-start"
													target="_blank"
												>
													Android
												</a>
											)}
											{settings.includeImage && game.imageUrl && (
												<Image
													width={1280}
													height={720}
													src={game.imageUrl}
													alt={game.title}
													className="w-full h-full object-cover rounded-md mt-4"
												/>
											)}
										</div>
										{settings.includeFooter && endDate && (
											<div className="text-xs font-light mt-2!">
												Offer ends • {format(endDate, 'dd/MM/yyyy')}
											</div>
										)}
									</div>
								</div>
							)
						})}

					{!settings.componentsV2 &&
						selectedCurrentGamesCount + selectedMobileCount > 1 &&
						settings.includeCheckout && (
							<div
								className="flex mt-1 rounded-sm overflow-hidden"
								style={{ borderLeft: `4px solid ${settings.embedColor}` }}
							>
								<div className="max-w-md bg-[#ffffff] dark:bg-[#2B2D31] border border-[#d4d7dc] dark:border-[#4e5058] rounded-r-sm p-3.5 pr-4">
									<div className="flex flex-col text-sm gap-0.5">
										<h1 className="font-semibold">🛒 Checkout Link</h1>
										{normalizedCheckoutLink ? (
											<a
												href={normalizedCheckoutLink}
												className="text-[#2b71d2] dark:text-[#5593eb] hover:underline self-start font-medium"
												target="_blank"
											>
												{settings.includeClaimGame ? 'Claim All Games' : 'Checkout'}
											</a>
										) : mysteryGames ? (
											<>
												<span>Currently disabled due to mystery games</span>
												<span className="text-xs text-black dark:text-white">
													This will not appear in the JSON data
												</span>
											</>
										) : bulkCheckoutUrl ? (
											<a
												href={bulkCheckoutUrl}
												className="text-[#2b71d2] dark:text-[#5593eb] hover:underline self-start font-medium"
												target="_blank"
											>
												{settings.includeClaimGame ? 'Claim All Games' : 'Checkout'}
											</a>
										) : (
											<span className="text-black dark:text-white">
												No claimable games available
											</span>
										)}
									</div>
								</div>
							</div>
						)}
					{settings.componentsV2 && componentsV2CheckoutHref && (
						<div className="mt-2">
							<PreviewLinkButton
								href={componentsV2CheckoutHref}
								label="🎁 Claim All Games"
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
