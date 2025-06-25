import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { webhookUrl } = await request.json()

    if (!webhookUrl) {
        return NextResponse.json({ message: 'Missing webhook URL' }, { status: 400 })
    }

    try {
        const webhookUrlMatch = webhookUrl.match(/(?:discord\.com|discordapp\.com)\/api\/webhooks\/(\d+)\/([a-zA-Z0-9_-]+)/)
        if (!webhookUrlMatch) {
            return NextResponse.json({ message: 'Invalid webhook URL format' }, { status: 400 })
        }

        const [, webhookId, webhookToken] = webhookUrlMatch
        const webhookInfoUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`

        const response = await fetch(webhookInfoUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch webhook info')
        }

        const webhookInfo = await response.json()

        return NextResponse.json({
            name: webhookInfo.name || 'Captain Hook',
            avatar: webhookInfo.avatar
                ? `https://cdn.discordapp.com/avatars/${webhookInfo.id}/${webhookInfo.avatar}.png`
                : null
        })
    } catch (error) {
        console.error('Webhook info fetch error:', error)
        return NextResponse.json({
            message: 'Failed to fetch webhook info',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
} 