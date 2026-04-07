import { buildClassicEmbedPayload } from '@/lib/json/builder.classic'
import { buildComponentsV2MessagePayload } from '@/lib/json/builder.v2'

export function buildDiscordMessagePayload(
	games: Game,
	settings: EgFreeSettings,
	checkoutLink: string,
	parsedMobileGames: MobileGameDataLocal[],
): object {
	if (settings.componentsV2) {
		return buildComponentsV2MessagePayload(
			games,
			settings,
			checkoutLink,
			parsedMobileGames,
		)
	}

	return buildClassicEmbedPayload(
		games,
		settings,
		checkoutLink,
		parsedMobileGames,
	)
}
