type GameItem = {
    id: string
    title: string
    description: string
    keyImages: Array<{ type: string; url: string }>
    price: {
        totalPrice: {
            originalPrice: number
            fmtPrice: {
                originalPrice: string
                discountPrice: string
            }
        }
    }
    promotions: {
        promotionalOffers: Array<{
            promotionalOffers: Array<{
                startDate: string
                endDate: string
            }>
        }>
        upcomingPromotionalOffers: Array<{
            promotionalOffers: Array<{
                startDate: string
                endDate: string
            }>
        }>
    }
    productSlug?: string
    offerMappings?: Array<{ pageSlug: string }>
    urlSlug: string
    seller?: {
        name: string
    }
    categories: Array<{ path: string }>
}

type Game = {
    currentGames: GameItem[]
    nextGames: GameItem[]
}

interface EgFreeSettings {
    includeCurrent: boolean
    includeUpcoming: boolean
    embedContent: string
    embedColor: string
    includeFooter: boolean
    includePrice: boolean
    includeImage: boolean
    webhookUrl: string
}