export async function getEpicFreeGames(): Promise<Game> {
    try {
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

            const currentFreeOffer = allOffers
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .find(offer => {
                    const start = new Date(offer.startDate).getTime()
                    const end = new Date(offer.endDate).getTime()
                    return now >= start && now < end && offer.discountSetting?.discountPercentage === 0
                })

            if (currentFreeOffer) {
                currentGames.push(game as GameItem)
            }

            const allUpcomingOffers = upcomingPromotionalOffers?.[0]?.promotionalOffers || []

            const nextFreeOffer = allUpcomingOffers
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .find(offer => {
                    const start = new Date(offer.startDate).getTime()
                    return now < start && offer.discountSetting?.discountPercentage === 0
                })

            if (nextFreeOffer) {
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