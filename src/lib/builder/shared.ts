import { getEffectiveGames, getMobileGameKey } from '@/lib/utils'

export const IS_COMPONENTS_V2 = 32768
export const EPIC_ICON = 'https://up.wolfey.me/gO16VwIQ'

export const COMPONENT_TYPES = {
	ACTION_ROW: 1,
	BUTTON: 2,
	BUTTON_LINK: 5,
	SECTION: 9,
	TEXT_DISPLAY: 10,
	THUMBNAIL: 11,
	MEDIA_GALLERY: 12,
	CONTAINER: 17,
} as const

export type PayloadBuildContext = {
	effectiveGames: Game
	selectedGames: GameItem[]
	selectedCurrentGames: GameItem[]
	selectedMobileGames: MobileGameDataLocal[]
	mysteryGames: boolean
	bulkCheckoutUrl: string | null
	normalizedCheckoutLink: string
}

export type GameLinkMeta = {
	pageSlug: string | undefined
	isValidPageSlug: boolean
	isBundleGame: boolean
	linkPrefix: string
	browserUrl: string | null
}

export function parseAllowedMentions(
	content: string,
): { roles: string[] } | undefined {
	const roles = [...content.matchAll(/<@&(\d+)>/g)].map(match => match[1])
	if (roles.length === 0) return undefined
	return { roles: [...new Set(roles)] }
}

export function getDiscordTimestamp(date: Date): string {
	return `<t:${Math.floor(date.getTime() / 1000)}:d>`
}

export function escapeDiscordMarkdownLinkLabel(label: string): string {
	return label
		.replace(/\\/g, '\\\\')
		.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]')
}

export function epicMobileProductPageUrl(
	pageSlug: string | undefined | null,
): string | null {
	const s = pageSlug?.trim()
	if (!s) return null
	return `https://store.epicgames.com/en-US/p/${encodeURIComponent(s)}`
}

export function normalizeEpicCheckoutLink(url: string): string {
	if (!url.trim()) return ''
	try {
		let fullUrl = url.trim()
		if (fullUrl.startsWith('/purchase')) {
			fullUrl = `https://store.epicgames.com${fullUrl}`
		} else if (!fullUrl.startsWith('http')) {
			fullUrl = `https://store.epicgames.com/${fullUrl}`
		}
		const urlObj = new URL(fullUrl)
		const offers = urlObj.searchParams.getAll('offers')
		if (offers.length === 0) return fullUrl
		const offersParam = offers.map(offer => `offers=${offer}`).join('&')
		return `https://store.epicgames.com/purchase?${offersParam}#`
	} catch {
		return url
	}
}

export function isCurrentlyFree(game: GameItem): boolean {
	const currentPromo = game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
	return Boolean(
		currentPromo?.discountSetting?.discountPercentage === 0 &&
		game.promotions?.promotionalOffers.length > 0,
	)
}

export function isPermanentlyFree(game: GameItem): boolean {
	return game.price.totalPrice.originalPrice === 0
}

export function isDiscountedGame(game: GameItem): boolean {
	const currentPromo = game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
	return Boolean(
		currentPromo?.discountSetting?.discountPercentage > 0 &&
		game.promotions?.promotionalOffers.length > 0,
	)
}

export function getGameLinkMeta(game: GameItem): GameLinkMeta {
	const rawPageSlug =
		game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
	const pageSlug = rawPageSlug?.replace(/\/[^/]*$/, '') || rawPageSlug
	const isValidPageSlug = Boolean(
		pageSlug && pageSlug !== '[]' && pageSlug.trim() !== '',
	)
	const isBundleGame = game.categories?.some(
		(category: { path: string }) => category.path === 'bundles',
	)
	const linkPrefix = isBundleGame ? 'bundles/' : 'p/'
	const browserUrl = isValidPageSlug
		? `https://store.epicgames.com/${linkPrefix}${pageSlug}`
		: null

	return {
		pageSlug,
		isValidPageSlug,
		isBundleGame,
		linkPrefix,
		browserUrl,
	}
}

export function getPreferredGameImageUrl(game: GameItem): string | undefined {
	const imageTypes = [
		'VaultClosed',
		'DieselStoreFrontWide',
		'OfferImageWide',
		'DieselGameBoxWide',
	]

	return game.keyImages.find((img: { type: string; url: string }) =>
		imageTypes.includes(img.type),
	)?.url
}

export function buildPayloadContext(
	games: Game,
	settings: EgFreeSettings,
	checkoutLink: string,
	parsedMobileGames: MobileGameDataLocal[],
): PayloadBuildContext {
	const effectiveGames = getEffectiveGames(games)
	const selectedGames = [
		...effectiveGames.currentGames,
		...effectiveGames.nextGames,
	].filter(game => settings.selectedGames[game.id])
	const mysteryGames = effectiveGames.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account',
	)
	const now = new Date()
	const selectedMobileGames = parsedMobileGames.filter(
		game =>
			settings.selectedGames[getMobileGameKey(game)] &&
			game.promoEndDate &&
			new Date(game.promoEndDate) > now,
	)
	const selectedCurrentGames = effectiveGames.currentGames.filter(
		game => settings.selectedGames[game.id],
	)
	const bulkCheckoutUrl = buildBulkCheckoutUrl(
		selectedCurrentGames,
		selectedMobileGames,
		mysteryGames,
	)

	return {
		effectiveGames,
		selectedGames,
		selectedCurrentGames,
		selectedMobileGames,
		mysteryGames,
		bulkCheckoutUrl,
		normalizedCheckoutLink: normalizeEpicCheckoutLink(checkoutLink),
	}
}

function buildBulkCheckoutUrl(
	selectedCurrentGames: GameItem[],
	selectedMobileGames: MobileGameDataLocal[],
	mysteryGames: boolean,
): string | null {
	if (mysteryGames) return null

	const pcOffers = selectedCurrentGames
		.map(game => {
			if (!game.namespace || !game.id) return null
			return `1-${game.namespace}-${game.id}-`
		})
		.filter((offer): offer is string => Boolean(offer))

	const mobileOffers = selectedMobileGames.flatMap(game => {
		const offers: string[] = []
		if (game.iosOffer) offers.push(`1-${game.namespace}-${game.iosOffer.id}--`)
		if (game.androidOffer)
			offers.push(`1-${game.namespace}-${game.androidOffer.id}--`)
		return offers
	})

	const offers = [...pcOffers, ...mobileOffers]
	if (offers.length === 0) return null

	const offersParam = offers.map(offer => `offers=${offer}`).join('&')
	return `https://store.epicgames.com/purchase?${offersParam}#`
}
