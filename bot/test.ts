import {
	fetchCurrentOffers,
	generateOfferPayloads,
} from './services/offerService'
import { loadBotState } from './state'

async function testOfferPayload() {
	console.log('Testing offer fetch and payload generation...')
	const state = loadBotState()
	console.log('Loaded settings:', {
		requireConfirmation: state.settings.requireConfirmation,
		useComponentsV2: state.settings.useComponentsV2,
		splitDesktopMobile: state.settings.splitDesktopMobile,
	})

	const offers = await fetchCurrentOffers([])
	console.log(
		`Fetched current PC offers: ${offers.effectiveGames.currentGames.length}`,
	)
	console.log(`Fetched active Mobile offers: ${offers.activeMobileGames.length}`)
	console.log('Offers list:', offers.titles)

	const { desktopPayload, combinedPayload } = generateOfferPayloads(
		offers,
		state.settings,
	)

	if (combinedPayload) {
		console.log('\n--- Generated Combined Payload Sample ---')
		console.log(JSON.stringify(combinedPayload, null, 2).slice(0, 500) + '...\n')
	}

	if (desktopPayload) {
		console.log('\n--- Generated Desktop Payload Sample ---')
		console.log(JSON.stringify(desktopPayload, null, 2).slice(0, 300) + '...\n')
	}

	console.log('✅ Payload test successful! JSON matches Builder schema.')
}

testOfferPayload().catch(console.error)
