export async function getEpicFreeGames(): Promise<Game> {
    try {
        const logs = false
        const response = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions')
        const api = await response.json()

        const games = api?.data?.Catalog?.searchStore?.elements || []

        const currentGames: GameItem[] = []
        const nextGames: GameItem[] = []

        games.forEach((game: Partial<GameItem> & { offerType: string }) => {
            if (!game.promotions) return
            if (!game.price) return

            const { promotionalOffers, upcomingPromotionalOffers } = game.promotions
            const now = new Date().getTime()

            const allOffers = promotionalOffers?.[0]?.promotionalOffers || []
            const allUpcomingOffers = upcomingPromotionalOffers?.[0]?.promotionalOffers || []

            const currentFreeOffer = allOffers
                .filter(offer => offer.discountSetting?.discountPercentage === 0)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .find(offer => {
                    const start = new Date(offer.startDate).getTime()
                    const end = new Date(offer.endDate).getTime()
                    return now >= start && now < end
                })

            const nextFreeOffer = allUpcomingOffers
                .filter(offer => offer.discountSetting?.discountPercentage === 0)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .find(offer => {
                    const start = new Date(offer.startDate).getTime()
                    return now < start
                })

            const currentOfferStatus = currentFreeOffer ? '✅ Currently FREE!' : 'Not currently free'
            const upcomingOfferStatus = nextFreeOffer ? '🔜 Will be FREE soon!' : 'No upcoming free offers'

            const freeCurrentOffers = allOffers
                .filter(o => o.discountSetting?.discountPercentage === 0)
                .map(o => `[${o.startDate} to ${o.endDate}]: FREE`)

            const freeUpcomingOffers = allUpcomingOffers
                .filter(o => o.discountSetting?.discountPercentage === 0)
                .map(o => `[${o.startDate} to ${o.endDate}]: Will be FREE`)

            if (logs) {
                console.log(
                    `\nGame: ${game.title}\n` +
                    `Status: ${currentOfferStatus} | ${upcomingOfferStatus}\n` +
                    `Current Free Offers: ${freeCurrentOffers.join(', ') || 'None'}\n` +
                    `Upcoming Free Offers: ${freeUpcomingOffers.join(', ') || 'None'}`
                )
            }

            if (currentFreeOffer) {
                game.promotions = {
                    ...game.promotions,
                    promotionalOffers: [{
                        promotionalOffers: [currentFreeOffer]
                    }]
                }
                currentGames.push(game as GameItem)
            }
            if (nextFreeOffer) {
                game.promotions = {
                    ...game.promotions,
                    upcomingPromotionalOffers: [{
                        promotionalOffers: [nextFreeOffer]
                    }]
                }
                nextGames.push(game as GameItem)
            }
        })

        return {
            currentGames,
            nextGames
        }
    } catch (error) {
        console.error('Error fetching games:', error)
        return {
            currentGames: [],
            nextGames: []
        }
    }
}