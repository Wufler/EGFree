import { format } from 'date-fns'
import Image from 'next/image'
import Discord from './ui/discord'

const defaultContent = '<@&847939354978811924>'

export default function DiscordPreview({
	games,
	settings,
}: {
	games: Game
	settings: EgFreeSettings
}) {
	const selectedGames = [...games.currentGames, ...games.nextGames].filter(
		game => settings.selectedGames[game.id]
	)

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
		<div className="bg-[#ffffff] dark:bg-[#313338] dark:text-white rounded-md p-4 [overflow-wrap:anywhere]">
			<div className="flex gap-4">
				<div className="flex-shrink-0">
					<div className="dark:bg-[#6263ed] bg-[#5865f2] rounded-full size-10 mt-1 flex items-center justify-center">
						<Discord className="filter invert brightness-0 size-[23px]" />
					</div>
				</div>
				<div className="flex-grow">
					<div className="flex items-center gap-1 mb-1">
						<div className="font-medium">Captain Hook</div>
						<div className="dark:bg-[#6263ed] bg-[#5865f2] ml-0.5 text-white rounded-sm px-[5px] font-semibold text-xs mt-0.5">
							APP
						</div>
						<div className="text-xs ml-1 mt-0.5 text-[#616366] dark:text-[#949b9d]">
							Today at {format(new Date(), 'HH:mm')}
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
						const pageSlug =
							game.urlSlug || game.offerMappings?.[0]?.pageSlug || game.productSlug
						const isBundleGame = game.categories?.some(
							(category: { path: string }) => category.path === 'bundles'
						)
						const linkPrefix = isBundleGame ? 'bundles/' : 'p/'
						const imageUrl = game.keyImages.find(
							(img: { type: string; url: string }) =>
								img.type === 'VaultClosed' ||
								img.type === 'DieselStoreFrontWide' ||
								img.type === 'OfferImageWide'
						)?.url
						const isAddOn = game.offerType === 'ADD_ON'
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
										<h1 className="font-semibold flex items-center gap-1">
											{game.title}
										</h1>
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
										<a
											href={`https://store.epicgames.com/${linkPrefix}${pageSlug}`}
											className="text-[#4e80eb] dark:text-[#00A8FC] hover:underline self-start"
											target="_blank"
										>
											{isCurrent && isCurrentlyFree(game)
												? isAddOn
													? 'Claim Add-on'
													: isBundleGame
													? 'Claim Bundle'
													: 'Claim Game'
												: 'Store Page'}
										</a>
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
				</div>
			</div>
		</div>
	)
}
