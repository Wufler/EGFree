import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { webhookUrl, jsonData } = await request.json()

    if (!webhookUrl || !jsonData) {
        return NextResponse.json({ message: 'Missing webhookUrl or jsonData' }, { status: 400 })
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
            return NextResponse.json({ message: 'Successfully sent embed to Discord.' })
        } else {
            throw new Error('Failed to send data to Discord')
        }
    } catch (error) {
        console.error('Failed to send to Discord: ', error)
        return NextResponse.json({ message: 'Failed to send embed to Discord.' }, { status: 500 })
    }
}