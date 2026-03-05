import { NextResponse } from 'next/server'
import { parseGameUrl, fetchMobileGameData, generateDiscordEmbed } from '@/lib/EGData'

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            )
        }

        const offerId = parseGameUrl(url)
        if (!offerId) {
            return NextResponse.json(
                { error: 'Invalid egdata.app URL' },
                { status: 400 }
            )
        }

        const result = await fetchMobileGameData(offerId)
        if (!result) {
            return NextResponse.json(
                { error: 'Could not fetch game data' },
                { status: 500 }
            )
        }

        const { gameData, enteredPlatform } = result
        const discordPayload = generateDiscordEmbed(gameData)

        return NextResponse.json({
            gameData,
            discordPayload,
            enteredPlatform
        })
    } catch (error) {
        console.error('Error parsing game:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
