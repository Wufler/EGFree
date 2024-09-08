interface Game {
    id: string
    title: string
    description: string
    keyImages: Array<{ type: string; url: string }>
    price: {
        totalPrice: {
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
    catalogNs: {
        mappings: Array<{ pageSlug: string }>
    }
    urlSlug: string
    categories: Array<{ path: string }>
}