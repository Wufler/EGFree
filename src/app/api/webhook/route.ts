import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { webhookUrl, jsonData, messageId } = await request.json()

    if (!webhookUrl || !jsonData) {
        return NextResponse.json({ message: 'Missing webhook or data' }, { status: 400 })
    }

    try {
        const url = messageId?.trim() ? `${webhookUrl}/messages/${messageId}` : webhookUrl
        const method = messageId?.trim() ? 'PATCH' : 'POST'

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to ${messageId ? 'edit' : 'send'} message: ${errorText}`)
        }

        const responseText = await response.text()
        const responseData = responseText ? JSON.parse(responseText) : null

        return NextResponse.json({
            message: messageId ? 'Successfully updated message.' : 'Successfully sent message.',
            messageId: responseData?.id || null
        })
    } catch (error) {
        console.error('Could not send:', error)
        return NextResponse.json({
            message: `Failed to ${messageId ? 'edit' : 'send'} message.`
        }, { status: 500 })
    }
}