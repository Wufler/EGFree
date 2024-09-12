import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { webhookUrl, jsonData } = await request.json()

    if (!webhookUrl || !jsonData) {
        return NextResponse.json({ message: 'Missing webhook or data' }, { status: 400 })
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })

        if (response.ok) {
            return NextResponse.json({ message: 'Successfully sent embed.' })
        } else {
            throw new Error('Failed to send JSON Data.')
        }
    } catch (error) {
        console.error('Could not send:', error)
        return NextResponse.json({ message: 'Failed to send JSON Data.' }, { status: 500 })
    }
}