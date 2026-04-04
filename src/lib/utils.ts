import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getMobileGameKey(game: MobileGameDataLocal): string {
	const hasBoth = Boolean(game.iosOffer && game.androidOffer)
	if (hasBoth) return `mobile-${game.namespace}-${game.title}`
	const platform = game.iosOffer ? 'ios' : 'android'
	return `mobile-${game.namespace}-${game.title}-${platform}`
}

export function mergeMobile(
	apiGames: MobileGameDataLocal[],
	storedGames: MobileGameDataLocal[],
): MobileGameDataLocal[] {
	const byNs = new Map<string, MobileGameDataLocal>()
	for (const g of apiGames) {
		byNs.set(g.namespace, g)
	}
	for (const g of storedGames) {
		if (!byNs.has(g.namespace)) {
			byNs.set(g.namespace, g)
		}
	}
	return [...byNs.values()]
}

function parseDate(value: string | undefined): Date | null {
	if (!value) return null
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function getCurrentOfferEndDate(game: GameItem): Date | null {
	const endDate =
		game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]?.endDate
	return parseDate(endDate)
}

function getUpcomingOfferStartDate(game: GameItem): Date | null {
	const startDate =
		game.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
			?.startDate
	return parseDate(startDate)
}

export function getEffectiveGames(
	games: Game,
	referenceDate: Date = new Date(),
): Game {
	const activeCurrentGames = games.currentGames.filter(game => {
		const endDate = getCurrentOfferEndDate(game)
		return endDate ? endDate > referenceDate : true
	})

	const promotedUpcomingGames = games.nextGames.filter(game => {
		const startDate = getUpcomingOfferStartDate(game)
		return startDate ? startDate <= referenceDate : false
	})

	const upcomingGames = games.nextGames.filter(game => {
		const startDate = getUpcomingOfferStartDate(game)
		return startDate ? startDate > referenceDate : true
	})

	const existingIds = new Set(activeCurrentGames.map(game => game.id))
	const uniquePromotedGames = promotedUpcomingGames.filter(
		game => !existingIds.has(game.id),
	)

	return {
		currentGames: [...activeCurrentGames, ...uniquePromotedGames],
		nextGames: upcomingGames,
	}
}
