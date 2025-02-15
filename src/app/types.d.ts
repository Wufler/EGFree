type GameItem = {
    id: string
    title: string
    description: string
    keyImages: Array<{ type: string; url: string }>
    offerType: 'BASE_GAME' | 'ADD_ON'
    price: {
        totalPrice: {
            originalPrice: number
            discountPrice: number
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