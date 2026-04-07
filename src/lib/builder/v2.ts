import {
	COMPONENT_TYPES,
	EPIC_ICON,
	IS_COMPONENTS_V2,
	buildPayloadContext,
	epicMobileProductPageUrl,
	escapeDiscordMarkdownLinkLabel,
	getDiscordTimestamp,
	getGameLinkMeta,
	getPreferredGameImageUrl,
	isCurrentlyFree,
	isDiscountedGame,
	isPermanentlyFree,
	parseAllowedMentions,
} from '@/lib/builder/shared'

function buildDesktopComponentsV2Card(
	game: GameItem,
	settings: EgFreeSettings,
	normalizedCheckoutLink: string,
	selectedCurrentGames: GameItem[],
): Record<string, unknown> {
	const isCurrent = game.promotions.promotionalOffers.length > 0
	const dateInfo = isCurrent
		? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
		: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
	const endDate = new Date(dateInfo)
	const { browserUrl, isValidPageSlug, isBundleGame, linkPrefix, pageSlug } =
		getGameLinkMeta(game)
	const imageUrl = getPreferredGameImageUrl(game)

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

	const resolveClaimHref = (): string | null => {
		if (!settings.includeClaimGame) return null
		if (isCurrent) {
			if (isCurrentlyFree(game)) {
				const checkoutUrl = getCheckoutUrl()
				if (isPermanentlyFree(game)) {
					if (!isValidPageSlug || !pageSlug) return null
					return `https://store.epicgames.com/${linkPrefix}${pageSlug}`
				}
				if (
					settings.includeCheckout &&
					normalizedCheckoutLink &&
					selectedCurrentGames.length === 1 &&
					selectedCurrentGames[0].id === game.id
				) {
					return normalizedCheckoutLink
				}
				return checkoutUrl
			}
			if (!isValidPageSlug || !pageSlug) return null
			return `https://store.epicgames.com/${linkPrefix}${pageSlug}`
		}
		return null
	}

	const resolveClaimLabel = () =>
		isCurrent &&
			!isCurrentlyFree(game) &&
			isDiscountedGame(game) &&
			isValidPageSlug
			? 'Store Page'
			: getClaimText()

	const priceText = getDesktopPriceText(game, settings, isCurrent)
	const titleContent = browserUrl
		? `## [${escapeDiscordMarkdownLinkLabel(game.title)}](${browserUrl})`
		: `## ${game.title}`
	const textBlocks: Record<string, unknown>[] = [
		{
			type: COMPONENT_TYPES.TEXT_DISPLAY,
			content: titleContent,
		},
	]

	if (!game.title.toLowerCase().includes('mystery')) {
		const priceAndDateParts: string[] = []
		if (priceText) priceAndDateParts.push(priceText)
		if (settings.includeFooter) {
			priceAndDateParts.push(
				`${isCurrent ? 'until' : 'starts'} ${getDiscordTimestamp(endDate)}`,
			)
		}
		if (priceAndDateParts.length > 0) {
			textBlocks.push({
				type: COMPONENT_TYPES.TEXT_DISPLAY,
				content: priceAndDateParts.join(' '),
			})
		}
	}

	const cardComponents: Record<string, unknown>[] = []

	if (settings.includeImage && imageUrl) {
		cardComponents.push({
			type: COMPONENT_TYPES.MEDIA_GALLERY,
			items: [{ media: { url: encodeURI(imageUrl) } }],
		})
	}

	cardComponents.push({
		type: COMPONENT_TYPES.SECTION,
		components: textBlocks,
		accessory: {
			type: COMPONENT_TYPES.THUMBNAIL,
			media: { url: EPIC_ICON },
		},
	})

	const actionButtons: Record<string, unknown>[] = []

	if (browserUrl) {
		actionButtons.push({
			type: COMPONENT_TYPES.BUTTON,
			style: COMPONENT_TYPES.BUTTON_LINK,
			label: 'Open in browser',
			url: browserUrl,
		})
	}

	const claimHref = resolveClaimHref()
	if (claimHref) {
		actionButtons.push({
			type: COMPONENT_TYPES.BUTTON,
			style: COMPONENT_TYPES.BUTTON_LINK,
			label: resolveClaimLabel(),
			url: claimHref,
		})
	}

	if (actionButtons.length > 0) {
		cardComponents.push({
			type: COMPONENT_TYPES.ACTION_ROW,
			components: actionButtons,
		})
	}

	return {
		type: COMPONENT_TYPES.CONTAINER,
		components: cardComponents,
	}
}

function buildMobileComponentsV2Card(
	game: MobileGameDataLocal,
	settings: EgFreeSettings,
): Record<string, unknown> {
	const iosUrl = epicMobileProductPageUrl(game.iosOffer?.pageSlug)
	const androidUrl = epicMobileProductPageUrl(game.androidOffer?.pageSlug)
	const isCombined = Boolean(game.iosOffer && game.androidOffer)
	const offerParams: string[] = []
	if (game.iosOffer) offerParams.push(`1-${game.namespace}-${game.iosOffer.id}--`)
	if (game.androidOffer)
		offerParams.push(`1-${game.namespace}-${game.androidOffer.id}--`)
	const checkoutUrl =
		offerParams.length > 0
			? `https://store.epicgames.com/purchase?offers=${offerParams.join('&offers=')}#/`
			: null
	const endDate = game.promoEndDate ? new Date(game.promoEndDate) : null
	const priceFormatted = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: game.currencyCode,
		minimumFractionDigits: 2,
	}).format(game.originalPrice / 100)

	const textBlocks: Record<string, unknown>[] = [
		{
			type: COMPONENT_TYPES.TEXT_DISPLAY,
			content: `## ${game.title}`,
		},
	]

	const mobilePriceParts: string[] = []
	if (settings.includePrice) {
		mobilePriceParts.push(`~~${priceFormatted}~~ **Free**`)
	}
	if (settings.includeFooter && endDate) {
		mobilePriceParts.push(`until ${getDiscordTimestamp(endDate)}`)
	}
	if (mobilePriceParts.length > 0) {
		textBlocks.push({
			type: COMPONENT_TYPES.TEXT_DISPLAY,
			content: mobilePriceParts.join(' '),
		})
	}

	const cardComponents: Record<string, unknown>[] = []

	if (settings.includeImage && game.imageUrl) {
		cardComponents.push({
			type: COMPONENT_TYPES.MEDIA_GALLERY,
			items: [{ media: { url: game.imageUrl } }],
		})
	}

	cardComponents.push({
		type: COMPONENT_TYPES.SECTION,
		components: textBlocks,
		accessory: {
			type: COMPONENT_TYPES.THUMBNAIL,
			media: { url: EPIC_ICON },
		},
	})

	const actionButtons: Record<string, unknown>[] = []


	if (isCombined && iosUrl) {
		actionButtons.push({
			type: COMPONENT_TYPES.BUTTON,
			style: COMPONENT_TYPES.BUTTON_LINK,
			label: 'iOS',
			url: iosUrl,
		})
	}

	if (isCombined && androidUrl) {
		actionButtons.push({
			type: COMPONENT_TYPES.BUTTON,
			style: COMPONENT_TYPES.BUTTON_LINK,
			label: 'Android',
			url: androidUrl,
		})
	}

	if (checkoutUrl && settings.includeClaimGame) {
		actionButtons.push({
			type: COMPONENT_TYPES.BUTTON,
			style: COMPONENT_TYPES.BUTTON_LINK,
			label: 'Claim Game',
			url: checkoutUrl,
		})
	}

	if (actionButtons.length > 0) {
		cardComponents.push({
			type: COMPONENT_TYPES.ACTION_ROW,
			components: actionButtons,
		})
	}

	return {
		type: COMPONENT_TYPES.CONTAINER,
		components: cardComponents,
	}
}

function getDesktopPriceText(
	game: GameItem,
	settings: EgFreeSettings,
	isCurrent: boolean,
): string {
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

export function buildComponentsV2MessagePayload(
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

	const components: Record<string, unknown>[] = []
	const messageContent = settings.embedContent || '<@&847939354978811924>'

	if (messageContent.trim()) {
		components.push({
			type: COMPONENT_TYPES.TEXT_DISPLAY,
			content: messageContent,
		})
	}

	for (const game of selectedGames) {
		components.push(
			buildDesktopComponentsV2Card(
				game,
				settings,
				normalizedCheckoutLink,
				selectedCurrentGames,
			),
		)
	}

	for (const game of selectedMobileGames) {
		components.push(buildMobileComponentsV2Card(game, settings))
	}

	const totalClaimable = selectedCurrentGames.length + selectedMobileGames.length
	if (totalClaimable > 1 && settings.includeCheckout) {
		if (!mysteryGames || normalizedCheckoutLink) {
			const checkoutHref = normalizedCheckoutLink || bulkCheckoutUrl
			if (checkoutHref) {
				components.push({
					type: COMPONENT_TYPES.ACTION_ROW,
					components: [
						{
							type: COMPONENT_TYPES.BUTTON,
							style: COMPONENT_TYPES.BUTTON_LINK,
							label: '🎁 Claim All Games',
							url: checkoutHref,
						},
					],
				})
			}
		}
	}

	const payload: Record<string, unknown> = {
		flags: IS_COMPONENTS_V2,
		components,
	}

	const allowedMentions = parseAllowedMentions(messageContent)
	if (allowedMentions) {
		payload.allowed_mentions = allowedMentions
	}

	return payload
}
