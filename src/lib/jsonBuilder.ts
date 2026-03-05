import { getMobileGameKey } from '@/lib/utils'

export function generateJsonPayload(
	games: Game,
	settings: EgFreeSettings,
	checkoutLink: string,
	parsedMobileGames: MobileGameDataLocal[],
): object {
	const selectedGames = [...games.currentGames, ...games.nextGames].filter(
		game => settings.selectedGames[game.id],
	)
	const mysteryGames = games.currentGames.some(
		game => game.seller?.name === 'Epic Dev Test Account',
	)
	const now = new Date()
	const selectedMobileGames = parsedMobileGames.filter(
		game =>
			settings.selectedGames[getMobileGameKey(game)] &&
			game.promoEndDate &&
			new Date(game.promoEndDate) > now,
	)
	const selectedCurrentGames = games.currentGames.filter(
		game => settings.selectedGames[game.id],
	)

	const generateBulkCheckoutUrl = () => {
		if (mysteryGames) return null
		const pcOffers = selectedCurrentGames
			.map(game => {
				if (!game.namespace || !game.id) return null
				return `1-${game.namespace}-${game.id}-`
			})
			.filter(Boolean)
		const mobileOffers = selectedMobileGames.flatMap(mg => {
			const offers: string[] = []
			if (mg.iosOffer) offers.push(`1-${mg.namespace}-${mg.iosOffer.id}--`)
			if (mg.androidOffer)
				offers.push(`1-${mg.namespace}-${mg.androidOffer.id}--`)
			return offers
		})
		const offers = [...pcOffers, ...mobileOffers]
		if (offers.length === 0) return null
		const offersParam = offers.map(offer => `offers=${offer}`).join('&')
		return `https://store.epicgames.com/purchase?${offersParam}#`
	}

	const normalizeCheckoutUrl = (url: string) => {
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

	const bulkCheckoutUrl = generateBulkCheckoutUrl()
	const normalizedCheckoutLink = normalizeCheckoutUrl(checkoutLink)

	const isCurrentlyFree = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage === 0 &&
			game.promotions?.promotionalOffers.length > 0,
		)
	}
	const isPermanentlyFree = (game: GameItem) =>
		game.price.totalPrice.originalPrice === 0
	const isDiscountedGame = (game: GameItem) => {
		const currentPromo =
			game.promotions?.promotionalOffers[0]?.promotionalOffers[0]
		return Boolean(
			currentPromo?.discountSetting?.discountPercentage > 0 &&
			game.promotions?.promotionalOffers.length > 0,
		)
	}

	const imageTypes = [
		'VaultClosed',
		'DieselStoreFrontWide',
		'OfferImageWide',
		'DieselGameBoxWide',
	]

	const embeds: DiscordEmbed[] = selectedGames.map((game: GameItem) => {
		const isCurrent = game.promotions.promotionalOffers.length > 0
		const dateInfo = isCurrent
			? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
			: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
				.startDate
		const endDate = new Date(dateInfo)
		const rawPageSlug =
			game.productSlug || game.offerMappings?.[0]?.pageSlug || game.urlSlug
		const pageSlug = rawPageSlug?.replace(/\/[^/]*$/, '') || rawPageSlug
		const isValidPageSlug =
			pageSlug && pageSlug !== '[]' && pageSlug.trim() !== ''
		const isBundleGame = game.categories?.some(
			(category: { path: string }) => category.path === 'bundles',
		)
		const linkPrefix = isBundleGame ? 'bundles/' : 'p/'

		const getClaimText = (g: GameItem) =>
			g.offerType === 'ADD_ON'
				? 'Claim Add-on'
				: isBundleGame
					? 'Claim Bundle'
					: 'Claim Game'

		const getCheckoutUrl = (g: GameItem) => {
			if (!g.namespace || !g.id) return null
			return `https://store.epicgames.com/purchase?offers=1-${g.namespace}-${g.id}-#`
		}

		const getPriceText = (g: GameItem) => {
			if (!settings.includePrice) return ''
			if (isCurrent) {
				if (isCurrentlyFree(g)) {
					return isPermanentlyFree(g)
						? 'Free'
						: `~~${g.price.totalPrice.fmtPrice.originalPrice}~~ **Free**`
				}
				if (isDiscountedGame(g)) {
					return `~~${g.price.totalPrice.fmtPrice.originalPrice}~~ **${g.price.totalPrice.fmtPrice.discountPrice}**`
				}
				return g.price.totalPrice.fmtPrice.originalPrice
			}
			return isPermanentlyFree(g)
				? 'Free'
				: g.price.totalPrice.fmtPrice.originalPrice
		}

		const getClaimLink = (g: GameItem): string => {
			if (!settings.includeClaimGame) return ''
			if (isCurrent) {
				if (isCurrentlyFree(g)) {
					const checkoutUrl = getCheckoutUrl(g)
					if (isPermanentlyFree(g)) {
						if (!isValidPageSlug) return ''
						return `[${getClaimText(g)}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
					}
					if (!checkoutUrl) return ''
					return `[${getClaimText(g)}](${checkoutUrl})`
				}
				if (!isValidPageSlug) return ''
				return `[${isDiscountedGame(g) ? 'Store Page' : getClaimText(g)}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
			}
			return ''
		}

		const description =
			game.title.toLowerCase().includes('mystery')
				? ''
				: [getPriceText(game), getClaimLink(game)].filter(Boolean).join('\n')

		const imageUrl = game.keyImages.find((img: { type: string; url: string }) =>
			imageTypes.includes(img.type),
		)?.url

		const gameUrl = isValidPageSlug
			? `https://store.epicgames.com/${linkPrefix}${pageSlug}`
			: null

		return {
			color: parseInt(settings.embedColor.replace('#', ''), 16),
			author: {
				name: 'Epic Games Store',
				url: 'https://free.wolfey.me/',
				icon_url: 'https://up.wolfey.me/tTq6cwfU',
			},
			title: game.title,
			...(gameUrl && { url: gameUrl }),
			description,
			...(settings.includeFooter && {
				footer: {
					text: isCurrent ? 'Offer ends' : 'Offer starts',
				},
				timestamp: endDate.toISOString(),
			}),
			...(settings.includeImage &&
				imageUrl && { image: { url: encodeURI(imageUrl) } }),
		}
	})

	for (const mg of selectedMobileGames) {
		const isCombined = Boolean(mg.iosOffer && mg.androidOffer)
		const storeUrl = mg.iosOffer?.pageSlug
			? `https://store.epicgames.com/en-US/p/${mg.iosOffer.pageSlug}`
			: mg.androidOffer?.pageSlug
				? `https://store.epicgames.com/en-US/p/${mg.androidOffer.pageSlug}`
				: null
		const offerParams: string[] = []
		if (mg.iosOffer) offerParams.push(`1-${mg.namespace}-${mg.iosOffer.id}--`)
		if (mg.androidOffer)
			offerParams.push(`1-${mg.namespace}-${mg.androidOffer.id}--`)
		const mobileCheckoutUrl =
			offerParams.length > 0
				? `https://store.epicgames.com/purchase?offers=${offerParams.join('&offers=')}#/`
				: null
		const priceFormatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: mg.currencyCode,
			minimumFractionDigits: 2,
		}).format(mg.originalPrice / 100)
		const descParts: string[] = []
		if (mobileCheckoutUrl && settings.includeClaimGame)
			descParts.push(`[Claim Game](${mobileCheckoutUrl})`)
		if (settings.includePrice) descParts.push(`~~${priceFormatted}~~ **Free**`)
		if (isCombined && mg.iosOffer?.pageSlug)
			descParts.push(
				`[iOS](https://store.epicgames.com/en-US/p/${mg.iosOffer.pageSlug})`,
			)
		if (isCombined && mg.androidOffer?.pageSlug)
			descParts.push(
				`[Android](https://store.epicgames.com/en-US/p/${mg.androidOffer.pageSlug})`,
			)
		embeds.push({
			color: parseInt(settings.embedColor.replace('#', ''), 16),
			author: {
				name: 'Epic Games Store Mobile',
				url: 'https://free.wolfey.me/',
				icon_url: 'https://up.wolfey.me/tTq6cwfU',
			},
			title: mg.title,
			...(isCombined ? {} : storeUrl && { url: storeUrl }),
			description: descParts.join('\n'),
			...(settings.includeFooter &&
				mg.promoEndDate && {
				footer: { text: 'Offer ends' },
				timestamp: new Date(mg.promoEndDate).toISOString(),
			}),
			...(settings.includeImage &&
				mg.imageUrl && { image: { url: mg.imageUrl } }),
		})
	}

	const totalClaimable =
		selectedCurrentGames.length + selectedMobileGames.length
	if (totalClaimable > 1 && settings.includeCheckout) {
		if (!mysteryGames || normalizedCheckoutLink) {
			embeds.push({
				color: parseInt(settings.embedColor.replace('#', ''), 16),
				title: 'Checkout Link',
				description: normalizedCheckoutLink
					? `[Claim All Games](${normalizedCheckoutLink})`
					: bulkCheckoutUrl
						? `[Claim All Games](${bulkCheckoutUrl})`
						: 'No claimable games available',
			})
		}
	}

	return {
		content: settings.embedContent || '<@&847939354978811924>',
		embeds,
	}
}
