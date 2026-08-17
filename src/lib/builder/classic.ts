import {
	buildPayloadContext,
	epicMobileProductPageUrl,
	getGameLinkMeta,
	getPreferredGameImageUrl,
	isCurrentlyFree,
	isDiscountedGame,
	isPermanentlyFree,
	isMysteryGame,
	getCheckoutUrl,
	getMobileCheckoutUrl,
	formatMobileGamePrice,
} from '@/lib/builder/shared'

export function buildClassicEmbedPayload(
	games: Game,
	settings: EgFreeSettings,
	checkoutLink: string,
	parsedMobileGames: MobileGame[],
): object {
	const {
		selectedGames,
		selectedCurrentGames,
		selectedMobileGames,
		bulkCheckoutUrl,
		normalizedCheckoutLink,
	} = buildPayloadContext(games, settings, checkoutLink, parsedMobileGames)

	const embeds: DiscordEmbed[] = selectedGames.map(game => {
		const isCurrent = game.promotions.promotionalOffers.length > 0
		const dateInfo = isCurrent
			? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
			: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
		const endDate = new Date(dateInfo)
		const { browserUrl, isValidPageSlug, isBundleGame, linkPrefix, pageSlug } =
			getGameLinkMeta(game)

		const getClaimText = () =>
			game.offerType === 'ADD_ON'
				? 'Claim Add-on'
				: isBundleGame
					? 'Claim Bundle'
					: 'Claim Game'

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
			if (isPermanentlyFree(game)) return ''
			if (game.price.totalPrice.discountPrice !== game.price.totalPrice.originalPrice) {
				return `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **${game.price.totalPrice.fmtPrice.discountPrice}**`
			}
			return game.price.totalPrice.fmtPrice.originalPrice
		}

		const getClaimLink = () => {
			if (!settings.includeClaimGame) return ''
			if (isCurrent) {
				if (isCurrentlyFree(game)) {
					const checkoutUrl = getCheckoutUrl(game)
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

		const isMystery = isMysteryGame(game)
		const description = isMystery
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
					text: isCurrent ? 'Offer ends' : 'Free offer starts',
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
		const mobileCheckoutUrl = getMobileCheckoutUrl(game)
		const priceFormatted = formatMobileGamePrice(game)
		const descriptionParts: string[] = []
		if (mobileCheckoutUrl && settings.includeClaimGame) {
			descriptionParts.push(`[Claim Game](${mobileCheckoutUrl})`)
		}
		if (settings.includePrice) {
			if (game.originalPrice > 0) {
				descriptionParts.push(`~~${priceFormatted}~~ **Free**`)
			} else {
				descriptionParts.push(`**Free**`)
			}
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

	const claimablePCGamesCount = selectedCurrentGames.filter(
		g => !isMysteryGame(g) && g.namespace && g.id,
	).length
	const claimableMobileOffersCount = selectedMobileGames.reduce(
		(acc, mg) => acc + (mg.iosOffer || mg.androidOffer ? 1 : 0),
		0,
	)
	const totalSelectedGames =
		selectedCurrentGames.length + selectedMobileGames.length
	const totalClaimable = claimablePCGamesCount + claimableMobileOffersCount
	if (totalClaimable > 0 && totalSelectedGames > 1 && settings.includeCheckout) {
		if (bulkCheckoutUrl || normalizedCheckoutLink) {
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
		content: settings.embedContent || '',
		embeds,
	}
}
