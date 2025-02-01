import { format } from 'date-fns'
import Image from 'next/image'

const defaultContent = '<@&847939354978811924>'

export default function DiscordPreview({
	games,
	settings,
}: {
	games: Game
	settings: EgFreeSettings
}) {
	const selectedGames = [
		...(settings.includeCurrent ? [games.currentGames[0]] : []),
		...(settings.includeUpcoming ? [games.nextGames[0]] : []),
	]

	return (
		<div className="bg-[#ffffff] dark:bg-[#313338] dark:text-white rounded-sm p-4 [overflow-wrap:anywhere]">
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
					game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
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
								<h1 className="font-semibold">{game.title}</h1>
								{settings.includePrice &&
									(!isCurrent ? (
										<span className="font-light">
											{game.price.totalPrice.fmtPrice.originalPrice}
										</span>
									) : (
										<span>
											<span className="line-through font-extralight">
												{game.price.totalPrice.fmtPrice.originalPrice}
											</span>{' '}
											<span className="font-semibold">Free</span>
										</span>
									))}
								<a
									href={`https://store.epicgames.com/${linkPrefix}${pageSlug}`}
									className="text-[#4e80eb] dark:text-[#00A8FC] hover:underline self-start"
									target="_blank"
								>
									{isCurrent ? 'Claim Game' : 'Game Link'}
								</a>
								{settings.includeImage && imageUrl && (
									<Image
										width={1280}
										height={720}
										src={imageUrl}
										alt={game.title}
										className="w-full h-full object-cover rounded-lg mt-4"
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
	)
}
