import { format } from 'date-fns'
import Image from 'next/image'
import Discord from './ui/discord'

const defaultContent = '<@&847939354978811924>'

export default function DiscordPreview({
	games,
	settings,
	checkoutLink = '',
}: {
	games: Game
	settings: EgFreeSettings
	checkoutLink?: string
}) {
	const selectedGames = [...games.currentGames, ...games.nextGames].filter(
		game => settings.selectedGames[game.id]
	)

	const mysteryGames = games.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account'
	)

	const generateBulkCheckoutUrl = () => {
		if (mysteryGames) return null

		const offers = games.currentGames
			.map(game => {
				if (!game.namespace || !game.id) return null
				return `1-${game.namespace}-${game.id}-`
			})
			.filter(Boolean)

		if (offers.length === 0) return null

		const offersParam = offers.map(offer => `offers=${offer}`).join('&')
		return `https://store.epicgames.com/purchase?${offersParam}#/purchase/payment-methods`
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
			return `https://store.epicgames.com/purchase?${offersParam}#/purchase/payment-methods`
		} catch {
			return url
		}
	}

	const normalizedCheckoutLink = normalizeCheckoutUrl(checkoutLink)

	const isCurrentlyFree = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage === 0 &&
				game.promotions?.promotionalOffers.length > 0
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
				game.promotions?.promotionalOffers.length > 0
		)
	}

	return (
		<div className="bg-[#ffffff] dark:bg-[#313338] dark:text-white p-4 wrap-anywhere w-full">
			<div className="flex gap-4">
				<div className="flex-shrink-0">
					{settings.webhookAvatar ? (
						<img
							src={settings.webhookAvatar}
							alt="Webhook Avatar"
							className="rounded-full size-10 mt-1"
						/>
					) : (
						<div className="dark:bg-[#6263ed] bg-[#5865f2] rounded-full size-10 mt-1 flex items-center justify-center">
							<Discord className="filter invert brightness-0 size-[23px]" />
						</div>
					)}
				</div>
				<div className="flex-grow">
					<div className="flex items-center gap-1 mb-1">
						<div className="font-medium">
							{settings.webhookName || 'Captain Hook'}
						</div>
						<div className="dark:bg-[#6263ed] bg-[#5865f2] ml-0.5 text-white rounded-sm px-[5px] font-semibold text-xs mt-0.5">
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
						const isBundleGame = game.categories?.some(
							(category: { path: string }) => category.path === 'bundles'
						)
						const linkPrefix = isBundleGame ? 'bundles/' : 'p/'
						const imageUrl = game.keyImages.find(
							(img: { type: string; url: string }) =>
								img.type === 'VaultClosed' ||
								img.type === 'DieselStoreFrontWide' ||
								img.type === 'OfferImageWide' ||
								img.type === 'DieselGameBoxWide'
						)?.url
						const isAddOn = game.offerType === 'ADD_ON'

						const getCheckoutUrl = (game: GameItem) => {
							if (!game.namespace || !game.id) return null
							const offerParam = `offers=1-${game.namespace}-${game.id}-`
							return `https://store.epicgames.com/purchase?${offerParam}#/purchase/payment-methods`
						}

						return (
							<div
								key={game.id}
								className="flex mt-1 rounded-sm overflow-hidden"
								style={{ borderLeft: `4px solid ${settings.embedColor}` }}
							>
								<div className="max-w-md bg-[#f2f3f5] dark:bg-[#2B2D31] p-3.5 pr-4">
									<div className="flex items-center mb-2">
										<Image
											width={1280}
											height={720}
											src="https://wolfey.s-ul.eu/YcyMXrI1"
											alt="Epic Games Store"
											className="size-7 rounded-full mr-2.5"
										/>
										<p className="hover:underline text-sm font-medium cursor-pointer">
											Epic Games Store
										</p>
									</div>
									<div className="flex flex-col text-sm gap-0.5">
										<a
											href={`https://store.epicgames.com/${linkPrefix}${pageSlug}`}
											className="font-semibold flex items-center mb-2 text-[16px] text-[#4e80eb] dark:text-[#00A8FC] hover:underline"
											target="_blank"
										>
											{game.title}
										</a>
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
										{isCurrent && isCurrentlyFree(game) && settings.includeClaimGame && (
											<a
												href={
													getCheckoutUrl(game) ||
													`https://store.epicgames.com/${linkPrefix}${pageSlug}`
												}
												className="text-[#4e80eb] dark:text-[#00A8FC] hover:underline self-start"
												target="_blank"
											>
												{isAddOn
													? 'Claim Add-on'
													: isBundleGame
													? 'Claim Bundle'
													: 'Claim Game'}
											</a>
										)}
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
										<div className="text-xs font-light !mt-2">
											{isCurrent ? 'Offer ends' : 'Offer starts'} •{' '}
											{format(endDate, 'dd/MM/yyyy')}
										</div>
									)}
								</div>
							</div>
						)
					})}

					{games.currentGames.filter(game => settings.selectedGames[game.id])
						.length > 1 &&
						settings.includeCheckout && (
							<div
								className="flex mt-1 rounded-sm overflow-hidden"
								style={{ borderLeft: `4px solid ${settings.embedColor}` }}
							>
								<div className="max-w-md bg-[#f2f3f5] dark:bg-[#2B2D31] p-3.5 pr-4">
									<div className="flex flex-col text-sm gap-0.5">
										<h1 className="font-semibold">🛒 Checkout Link</h1>
										{normalizedCheckoutLink ? (
											<a
												href={normalizedCheckoutLink}
												className="text-[#4e80eb] dark:text-[#00A8FC] hover:underline self-start font-medium"
												target="_blank"
											>
												{settings.includeClaimGame ? 'Claim All Games' : 'Checkout'}
											</a>
										) : mysteryGames ? (
											<>
												<span>Currently disabled due to mystery games</span>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													This will not appear in the JSON data
												</span>
											</>
										) : bulkCheckoutUrl ? (
											<a
												href={bulkCheckoutUrl}
												className="text-[#4e80eb] dark:text-[#00A8FC] hover:underline self-start font-medium"
												target="_blank"
											>
												{settings.includeClaimGame ? 'Claim All Games' : 'Checkout'}
											</a>
										) : (
											<span className="text-gray-500 dark:text-gray-400">
												No claimable games available
											</span>
										)}
									</div>
								</div>
							</div>
						)}
				</div>
			</div>
		</div>
	)
}
