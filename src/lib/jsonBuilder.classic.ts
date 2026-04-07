import {
	buildPayloadContext,
	epicMobileProductPageUrl,
	getGameLinkMeta,
	getPreferredGameImageUrl,
	isCurrentlyFree,
	isDiscountedGame,
	isPermanentlyFree,
} from '@/lib/jsonBuilder.shared'

export function buildClassicEmbedPayload(
	games: Game,
	settings: EgFreeSettings,
	checkoutLink: string,
	parsedMobileGames: MobileGameDataLocal[],
): object {
	const {
		selectedGames,
		selectedCurrentGames,
		selectedMobileGames,
		mysteryGames,
		bulkCheckoutUrl,
		normalizedCheckoutLink,
	} = buildPayloadContext(games, settings, checkoutLink, parsedMobileGames)

	const embeds: DiscordEmbed[] = selectedGames.map(game => {
		const isCurrent = game.promotions.promotionalOffers.length > 0
		const dateInfo = isCurrent
			? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
			: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
				.startDate
		const endDate = new Date(dateInfo)
		const { browserUrl, isValidPageSlug, isBundleGame, linkPrefix, pageSlug } =
			getGameLinkMeta(game)

		const getClaimText = () =>
			game.offerType === 'ADD_ON'
				? 'Claim Add-on'
				: isBundleGame
					? 'Claim Bundle'
					: 'Claim Game'

		const getCheckoutUrl = () => {
			if (!game.namespace || !game.id) return null
			return `https://store.epicgames.com/purchase?offers=1-${game.namespace}-${game.id}-#`
		}

		const getPriceText = () => {
			if (!settings.includePrice) return ''
			if (isCurrent) {
				if (isCurrentlyFree(game)) {
					return isPermanentlyFree(game)
						? 'Free'
						: `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**`
				}
				if (isDiscountedGame(game)) {
					return `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **${game.price.totalPrice.fmtPrice.discountPrice}**`
				}
				return game.price.totalPrice.fmtPrice.originalPrice
			}
			return isPermanentlyFree(game)
				? 'Free'
				: game.price.totalPrice.fmtPrice.originalPrice
		}

		const getClaimLink = () => {
			if (!settings.includeClaimGame) return ''
			if (isCurrent) {
				if (isCurrentlyFree(game)) {
					const checkoutUrl = getCheckoutUrl()
					if (isPermanentlyFree(game)) {
						if (!isValidPageSlug || !pageSlug) return ''
						return `[${getClaimText()}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
					}
					if (
						settings.includeCheckout &&
						normalizedCheckoutLink &&
						selectedCurrentGames.length === 1 &&
						selectedCurrentGames[0].id === game.id
					) {
						return `[${getClaimText()}](${normalizedCheckoutLink})`
					}
					if (!checkoutUrl) return ''
					return `[${getClaimText()}](${checkoutUrl})`
				}
				if (!isValidPageSlug || !pageSlug) return ''
				return `[${isDiscountedGame(game) ? 'Store Page' : getClaimText()}](https://store.epicgames.com/${linkPrefix}${pageSlug})`
			}
			return ''
		}

		const description = game.title.toLowerCase().includes('mystery')
			? ''
			: [getPriceText(), getClaimLink()].filter(Boolean).join('\n')

		const imageUrl = getPreferredGameImageUrl(game)

		return {
			color: parseInt(settings.embedColor.replace('#', ''), 16),
			author: {
				name: 'Epic Games Store',
				url: 'https://free.wolfey.me/',
				icon_url: 'https://up.wolfey.me/mFG3IGgV',
			},
			title: game.title,
			...(browserUrl && { url: browserUrl }),
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

	for (const game of selectedMobileGames) {
		const isCombined = Boolean(game.iosOffer && game.androidOffer)
		const iosUrl = epicMobileProductPageUrl(game.iosOffer?.pageSlug)
		const androidUrl = epicMobileProductPageUrl(game.androidOffer?.pageSlug)
		const offerParams: string[] = []
		if (game.iosOffer) offerParams.push(`1-${game.namespace}-${game.iosOffer.id}--`)
		if (game.androidOffer)
			offerParams.push(`1-${game.namespace}-${game.androidOffer.id}--`)
		const mobileCheckoutUrl =
			offerParams.length > 0
				? `https://store.epicgames.com/purchase?offers=${offerParams.join('&offers=')}#/`
				: null
		const priceFormatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: game.currencyCode,
			minimumFractionDigits: 2,
		}).format(game.originalPrice / 100)
		const descriptionParts: string[] = []
		if (mobileCheckoutUrl && settings.includeClaimGame) {
			descriptionParts.push(`[Claim Game](${mobileCheckoutUrl})`)
		}
		if (settings.includePrice) {
			descriptionParts.push(`~~${priceFormatted}~~ **Free**`)
		}
		if (isCombined && iosUrl) {
			descriptionParts.push(`[iOS](${iosUrl})`)
		}
		if (isCombined && androidUrl) {
			descriptionParts.push(`[Android](${androidUrl})`)
		}

		embeds.push({
			color: parseInt(settings.embedColor.replace('#', ''), 16),
			author: {
				name: 'Epic Games Store Mobile',
				url: 'https://free.wolfey.me/',
				icon_url: 'https://up.wolfey.me/mFG3IGgV',
			},
			title: game.title,
			description: descriptionParts.join('\n'),
			...(settings.includeFooter &&
				game.promoEndDate && {
				footer: { text: 'Offer ends' },
				timestamp: new Date(game.promoEndDate).toISOString(),
			}),
			...(settings.includeImage &&
				game.imageUrl && { image: { url: game.imageUrl } }),
		})
	}

	const totalClaimable = selectedCurrentGames.length + selectedMobileGames.length
	if (totalClaimable > 1 && settings.includeCheckout) {
		if (!mysteryGames || normalizedCheckoutLink) {
			embeds.push({
				color: parseInt(settings.embedColor.replace('#', ''), 16),
				title: '🛒 Checkout Link',
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
