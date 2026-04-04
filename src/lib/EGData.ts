// Fetch from egdata.app API, mostly for the mobile games (thank you!)
const EGDATA_API = 'https://api.egdata.app'

export function parseGameUrl(url: string): string | null {
    try {
        const urlObj = new URL(url)
        if (urlObj.hostname !== 'egdata.app') return null
        const match = urlObj.pathname.match(/\/offers\/([a-f0-9]{32})/)
        return match ? match[1] : null
    } catch {
        return null
    }
}

function getPlatform(tags: EgDataTag[]): 'ios' | 'android' | null {
    for (const tag of tags) {
        if (tag.id === '39070' || tag.name === 'iOS') return 'ios'
        if (tag.id === '39071' || tag.name === 'Android') return 'android'
    }
    return null
}

function isMobileTag(tags: EgDataTag[] | undefined): boolean {
    return getPlatform(tags || []) !== null
}

export async function getMobileGame(
    offerId: string,
): Promise<{ gameData: MobileGameData; enteredPlatform: 'ios' | 'android' | null } | null> {
    try {
        const logs = false
        if (logs) console.log('Fetching mobile game data for offerId:', offerId)

        const offerRes = await fetch(`${EGDATA_API}/offers/${offerId}`)
        if (!offerRes.ok) return null
        const offer: EgDataOffer = await offerRes.json()
        if (logs) console.log('Offer title:', offer.title)
        const enteredPlatform = getPlatform(offer.tags || [])

        const [priceRes, sandboxRes] = await Promise.all([
            fetch(`${EGDATA_API}/offers/${offerId}/price`),
            fetch(`${EGDATA_API}/sandboxes/${offer.namespace}/offers?offerType=BASE_GAME`)
        ])

        if (!priceRes.ok) return null
        const priceData: EgDataPrice = await priceRes.json()

        if (logs) console.log('Price data appliedRules:', priceData.appliedRules)

        const freeRules = priceData.appliedRules.filter(rule =>
            rule.discountSetting.discountPercentage === 0
        )
        if (logs) console.log('Free rules found:', freeRules.length, freeRules)

        const promoRule = freeRules.length > 0
            ? freeRules.reduce((latest, current) => {
                const latestDate = new Date(latest.endDate)
                const currentDate = new Date(current.endDate)
                return currentDate > latestDate ? current : latest
            })
            : null
        if (logs) console.log('Selected promo rule:', promoRule)

        const promoEndDate = promoRule?.endDate || ''
        if (logs) {
            console.log('Final promoEndDate:', promoEndDate, promoEndDate ? new Date(promoEndDate).toISOString() : 'empty')
        }

        const fallbackPageSlug = offer.offerMappings?.[0]?.pageSlug || ''
        let iosOffer: MobileGameData['iosOffer'] = enteredPlatform === 'ios'
            ? { id: offer.id, pageSlug: fallbackPageSlug }
            : null
        let androidOffer: MobileGameData['androidOffer'] = enteredPlatform === 'android'
            ? { id: offer.id, pageSlug: fallbackPageSlug }
            : null

        if (sandboxRes.ok) {
            const sandboxData: EgDataSandboxResponse = await sandboxRes.json()

            for (const item of sandboxData.elements || []) {
                const platform = getPlatform(item.tags || [])
                const pageSlug = item.offerMappings?.[0]?.pageSlug || ''

                if (platform === 'ios' && !iosOffer) {
                    iosOffer = { id: item.id, pageSlug }
                } else if (platform === 'android' && !androidOffer) {
                    androidOffer = { id: item.id, pageSlug }
                }

                if (iosOffer && androidOffer) break
            }
        } else {
            console.warn(
                `Sandbox lookup failed for namespace ${offer.namespace} (${sandboxRes.status}); using fallback offer mapping.`
            )
        }

        const imageUrl = (offer.keyImages || []).find(img =>
            img.type === 'OfferImageWide' ||
            img.type === 'DieselStoreFrontWide'
        )?.url || offer.keyImages?.[0]?.url || ''

        const gameData: MobileGameData = {
            title: offer.title,
            namespace: offer.namespace,
            imageUrl: imageUrl + '?w=720&quality=high&resize=1',
            originalPrice: priceData.price.originalPrice,
            currencyCode: priceData.price.currencyCode,
            promoEndDate,
            seller: offer.seller ? { name: offer.seller.name } : undefined,
            iosOffer,
            androidOffer
        }
        if (logs) console.log('Final gameData:', gameData)
        return { gameData, enteredPlatform }
    } catch (error) {
        console.error('Error fetching mobile game data:', error)
        return null
    }
}

export async function getMobileGames(): Promise<MobileGameData[]> {
    try {
        const res = await fetch(`${EGDATA_API}/free-games`)
        if (!res.ok) return []
        const offers: EgDataOffer[] = await res.json()
        if (!Array.isArray(offers)) return []

        const byNamespace = new Map<string, string>()
        for (const offer of offers) {
            if (!isMobileTag(offer.tags)) continue
            if (!byNamespace.has(offer.namespace)) {
                byNamespace.set(offer.namespace, offer.id)
            }
        }

        const results = await Promise.all(
            [...byNamespace.values()].map(offerId => getMobileGame(offerId)),
        )

        return results
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .map(r => r.gameData)
    } catch (error) {
        console.error('getMobileGames:', error)
        return []
    }
}

export function formatPrice(cents: number, currencyCode: string): string {
    const amount = cents / 100

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })

    return formatter.format(amount)
}

export function generateDiscordEmbed(gameData: MobileGameData): object {
    const { iosOffer, androidOffer, namespace, title, imageUrl, originalPrice, currencyCode, promoEndDate } = gameData

    const isCombined = Boolean(iosOffer && androidOffer)
    const storeUrl = iosOffer?.pageSlug
        ? `https://store.epicgames.com/en-US/p/${iosOffer.pageSlug}`
        : androidOffer?.pageSlug
            ? `https://store.epicgames.com/en-US/p/${androidOffer.pageSlug}`
            : null

    const offerParams: string[] = []
    if (iosOffer) offerParams.push(`1-${namespace}-${iosOffer.id}--`)
    if (androidOffer) offerParams.push(`1-${namespace}-${androidOffer.id}--`)

    const checkoutUrl = offerParams.length > 0
        ? `https://store.epicgames.com/purchase?offers=${offerParams.join('&offers=')}#/`
        : null

    const fieldParts: string[] = []

    if (checkoutUrl) {
        fieldParts.push(`[Claim Game ↗](${checkoutUrl})`)
    }

    const priceStr = formatPrice(originalPrice, currencyCode)
    fieldParts.push(`~~${priceStr}~~ **Free**`)

    if (isCombined && iosOffer?.pageSlug) {
        fieldParts.push(`[iOS ↗](https://store.epicgames.com/en-US/p/${iosOffer.pageSlug})`)
    }
    if (isCombined && androidOffer?.pageSlug) {
        fieldParts.push(`[Android ↗](https://store.epicgames.com/en-US/p/${androidOffer.pageSlug})`)
    }

    const embed: EgDataDiscordEmbed = {
        color: 8769099,
        ...(!isCombined && storeUrl && { url: storeUrl }),
        fields: [{
            name: '',
            value: fieldParts.join('\n'),
            inline: true
        }],
        author: {
            name: 'Epic Games Store Mobile',
            url: 'https://free.wolfey.me/',
            icon_url: 'https://up.wolfey.me/tTq6cwfU'
        },
        footer: {
            text: 'Offer ends'
        },
        timestamp: promoEndDate ? new Date(promoEndDate).toISOString() : undefined,
        image: imageUrl ? { url: imageUrl } : undefined,
        title
    }

    return {
        embeds: [embed],
        username: 'Free Games',
        avatar_url: 'https://cdn.discordapp.com/avatars/1281666373306814475/8a05bd91c9f0cda74c139c627cbe14ee.png'
    }
}
