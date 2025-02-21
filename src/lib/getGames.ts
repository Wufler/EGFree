export async function getEpicFreeGames(): Promise<Game> {
    try {
        const logs = false;
        const response = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions')
        const api = await response.json()

        const games = api?.data?.Catalog?.searchStore?.elements || []

        const currentGames: GameItem[] = []
        const nextGames: GameItem[] = []

        games.forEach((game: Partial<GameItem> & { offerType: string }) => {
            if (!game.promotions) return
            if (!game.price) return

            const { promotions, price } = game
            const { promotionalOffers, upcomingPromotionalOffers } = promotions
            const now = new Date().getTime()

            const currentOffers = promotionalOffers?.[0]?.promotionalOffers || []
            const freeCurrentOffers = currentOffers.filter(offer => offer.discountSetting?.discountPercentage === 0)
            const sortedCurrentOffers = [...freeCurrentOffers].sort((a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            )

            const currentFreeOffer = sortedCurrentOffers.find(offer => {
                const start = new Date(offer.startDate).getTime()
                const end = new Date(offer.endDate).getTime()
                const isFree = offer.discountSetting?.discountPercentage === 0
                const isCurrently = now >= start && now < end

                if (logs) {
                    console.log({
                        gameName: game.title,
                        offerType: 'current',
                        start: new Date(offer.startDate).toLocaleString(),
                        end: new Date(offer.endDate).toLocaleString(),
                        discountPercentage: offer.discountSetting?.discountPercentage,
                        originalPrice: price.totalPrice.originalPrice,
                        isFree,
                        isCurrently,
                        isValid: isFree && isCurrently
                    })
                }

                return isFree && isCurrently
            })

            if (currentFreeOffer) {
                currentGames.push(game as GameItem)
            }

            const nextOffers = upcomingPromotionalOffers?.[0]?.promotionalOffers || []
            const freeNextOffers = nextOffers.filter(offer => offer.discountSetting?.discountPercentage === 0)
            const sortedNextOffers = [...freeNextOffers].sort((a, b) =>
                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            )

            const nextFreeOffer = sortedNextOffers.find(offer => {
                const start = new Date(offer.startDate).getTime()
                const isFree = offer.discountSetting?.discountPercentage === 0
                const isUpcoming = now < start
                return isFree && isUpcoming
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