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

            if (promotionalOffers?.length > 0 && promotionalOffers[0]?.promotionalOffers?.length > 0) {
                const offer = promotionalOffers[0].promotionalOffers[0]
                const now = new Date().getTime()
                const start = new Date(offer.startDate).getTime()
                const end = new Date(offer.endDate).getTime()

                if (now >= start && now < end && offer.discountSetting?.discountPercentage === 0) {
                    currentGames.push(game as GameItem)
                }
            }

            if (upcomingPromotionalOffers?.length > 0 && upcomingPromotionalOffers[0]?.promotionalOffers?.length > 0) {
                const offer = upcomingPromotionalOffers[0].promotionalOffers[0]
                const now = new Date().getTime()
                const start = new Date(offer.startDate).getTime()

                if (now < start && offer.discountSetting?.discountPercentage === 0) {
                    nextGames.push(game as GameItem)
                }
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