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
    webhookUrl: string
    showDiscordPreview: boolean
}

type EmbedField = {
    name: string
    value: string
    inline?: boolean
}

type EmbedAuthor = {
    name: string
    url?: string
    icon_url?: string
}

type EmbedFooter = {
    text: string
    icon_url?: string
}

type EmbedImage = {
    url: string
}

type EmbedData = {
    content?: string
    title?: string
    description?: string
    url?: string
    color?: string
    fields: EmbedField[]
    footer?: EmbedFooter
    timestamp?: string
    image?: EmbedImage
    thumbnail?: EmbedImage
    author?: EmbedAuthor
}

type EmbedValue = string | EmbedField[] | EmbedFooter | EmbedImage | EmbedAuthor | { url: string } | number