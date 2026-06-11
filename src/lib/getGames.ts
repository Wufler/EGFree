export async function getEpicFreeGames(): Promise<Game> {
	try {
		const logs = false
		const response = await fetch(
			'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions',
		)
		const api = await response.json()

		const games = api?.data?.Catalog?.searchStore?.elements || []

		const currentGames: GameItem[] = []
		const nextGames: GameItem[] = []

		games.forEach((game: Partial<GameItem> & { offerType: string }) => {
			if (!game.promotions) return
			if (!game.price) return

			const { promotionalOffers, upcomingPromotionalOffers } = game.promotions
			const now = new Date().getTime()

			const allPromotionalOffers = [
				...(promotionalOffers?.[0]?.promotionalOffers || []),
				...(upcomingPromotionalOffers?.[0]?.promotionalOffers || []),
			]

			const freeOffers = allPromotionalOffers.filter(
				offer => offer.discountSetting?.discountPercentage === 0,
			)

			const currentFreeOffer = freeOffers.find(offer => {
				const start = new Date(offer.startDate).getTime()
				const end = new Date(offer.endDate).getTime()
				return now >= start && now < end
			})

			const nextFreeOffer = freeOffers
				.filter(offer => {
					const start = new Date(offer.startDate).getTime()
					return now < start
				})
				.sort(
					(a, b) =>
						new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
				)[0]

			const currentOfferStatus = currentFreeOffer
				? '✅ Currently FREE!'
				: 'Not currently free'
			const upcomingOfferStatus = nextFreeOffer
				? '🔜 Will be FREE soon!'
				: 'No upcoming free offers'

			const freeCurrentOffers = freeOffers
				.filter(o => {
					const start = new Date(o.startDate).getTime()
					const end = new Date(o.endDate).getTime()
					return now >= start && now < end
				})
				.map(o => `[${o.startDate} to ${o.endDate}]: FREE`)

			const freeUpcomingOffers = freeOffers
				.filter(o => new Date(o.startDate).getTime() > now)
				.map(o => `[${o.startDate} to ${o.endDate}]: Will be FREE`)

			if (logs) {
				console.log(
					`\nGame: ${game.title}\n` +
						`Status: ${currentOfferStatus} | ${upcomingOfferStatus}\n` +
						`Current Free Offers: ${freeCurrentOffers.join(', ') || 'None'}\n` +
						`Upcoming Free Offers: ${freeUpcomingOffers.join(', ') || 'None'}`,
				)
				console.log('JSON: ', game)
			}

			if (currentFreeOffer) {
				const gameCopy = {
					...game,
					promotions: {
						...game.promotions,
						promotionalOffers: [
							{
								promotionalOffers: [currentFreeOffer],
							},
						],
						upcomingPromotionalOffers: [],
					},
				}
				currentGames.push(gameCopy as GameItem)
			} else if (nextFreeOffer) {
				const gameCopy = {
					...game,
					promotions: {
						...game.promotions,
						promotionalOffers: [],
						upcomingPromotionalOffers: [
							{
								promotionalOffers: [nextFreeOffer],
							},
						],
					},
				}
				nextGames.push(gameCopy as GameItem)
			}
		})

		return {
			currentGames,
			nextGames,
		}
	} catch (error) {
		console.error('Error fetching games:', error)
		return {
			currentGames: [],
			nextGames: [],
		}
	}
}
