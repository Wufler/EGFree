type GameItem = {
    id: string
    title: string
    description: string
    effectiveDate?: string
    namespace?: string
    viewableDate?: string
    status?: string
    isCodeRedemptionOnly?: boolean
    keyImages: Array<{ type: string; url: string }>
    offerType: 'BASE_GAME' | 'ADD_ON'
    expiryDate?: string | null
    items?: Array<{
        id: string
        namespace: string
    }>
    customAttributes?: Array<{
        key: string
        value: string
    }>
    price: {
        totalPrice: {
            originalPrice: number
            discountPrice: number
            voucherDiscount?: number
            discount?: number
            currencyCode?: string
            currencyInfo?: {
                decimals: number
            }
            fmtPrice: {
                originalPrice: string
                discountPrice: string
                intermediatePrice?: string
            }
        }
    }
    promotions: {
        promotionalOffers: Array<{
            promotionalOffers: Array<{
                startDate: string
                endDate: string
                discountSetting: {
                    discountType?: string
                    discountPercentage: number
                }
            }>
        }>
        upcomingPromotionalOffers: Array<{
            promotionalOffers: Array<{
                startDate: string
                endDate: string
                discountSetting: {
                    discountType?: string
                    discountPercentage: number
                }
            }>
        }>
    }
    productSlug?: string
    url?: string | null
    offerMappings?: Array<{ pageSlug: string }>
    catalogNs?: {
        mappings: Array<{
            pageSlug: string
            pageType: string
        }>
    }
    urlSlug: string
    seller?: {
        id?: string
        name: string
    }
    tags?: Array<{
        id: string
    }>
    categories: Array<{ path: string }>
}

type Game = {
    currentGames: GameItem[]
    nextGames: GameItem[]
}

type EgFreeSettings = {
    selectedGames: { [key: string]: boolean }
    embedContent: string
    embedColor: string
    includeFooter: boolean
    includePrice: boolean
    includeImage: boolean
    includeCheckout: boolean
    webhookUrl: string
    webhookName?: string
    webhookAvatar?: string
    showDiscordPreview: boolean
    openAccordions: string[]
    includeClaimGame: boolean
}

type DiscordEmbed = {
    color: number
    title: string
    description: string
    url?: string
    fields?: { name: string; value: string }[]
    author?: { name: string; url: string; icon_url: string }
    footer?: { text: string }
    timestamp?: string
    image?: { url: string }
}