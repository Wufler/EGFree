type EgDataKeyImage = {
    type: string
    url: string
    md5?: string
}

type EgDataTag = {
    id: string
    name: string
}

type EgDataOfferMapping = {
    pageSlug: string
    pageType: string
}

type EgDataAppliedRule = {
    id: string
    name: string
    namespace: string
    promotionStatus: string
    startDate: string
    endDate: string
    saleType: string
    discountSetting: {
        discountType: string
        discountPercentage: number
    }
    promotionSetting: {
        promotionType: string
        discountOffers: Array<{ offerId: string }>
    }
}

type EgDataPrice = {
    country: string
    namespace: string
    offerId: string
    appliedRules: EgDataAppliedRule[]
    price: {
        currencyCode: string
        discount: number
        discountPrice: number
        originalPrice: number
    }
    region: string
    updatedAt: string
}

type EgDataOffer = {
    _id: string
    id: string
    namespace: string
    title: string
    description: string
    longDescription?: string
    offerType: string
    effectiveDate: string
    creationDate: string
    lastModifiedDate: string
    isCodeRedemptionOnly: boolean
    keyImages: EgDataKeyImage[]
    seller: {
        id: string
        name: string
    }
    productSlug: string | null
    urlSlug: string
    url: string | null
    tags: EgDataTag[]
    items: Array<{ id: string; namespace: string }>
    customAttributes: Record<string, { type: string; value: string }>
    categories: string[]
    developerDisplayName: string
    publisherDisplayName: string
    releaseDate: string
    pcReleaseDate: string
    viewableDate: string
    refundType: string
    offerMappings: EgDataOfferMapping[]
}

type EgDataSandboxResponse = {
    elements: EgDataOffer[]
    page: number
    limit: number
    count: number
}

type MobileGameData = {
    title: string
    namespace: string
    imageUrl: string
    originalPrice: number
    currencyCode: string
    promoEndDate: string
    seller?: { name: string }
    iosOffer: {
        id: string
        pageSlug: string
    } | null
    androidOffer: {
        id: string
        pageSlug: string
    } | null
}

type EgDataDiscordEmbed = {
    color: number
    title: string
    description?: string
    url?: string
    fields?: { name: string; value: string; inline?: boolean }[]
    author?: { name: string; url: string; icon_url: string }
    footer?: { text: string }
    timestamp?: string
    image?: { url: string }
}