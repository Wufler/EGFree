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
