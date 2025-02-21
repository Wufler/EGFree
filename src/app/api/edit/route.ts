import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
    try {
        const { webhookUrl, messageId, jsonData } = await request.json();

        if (!webhookUrl || !messageId) {
            return NextResponse.json({ message: 'Missing webhook URL or message ID' }, { status: 400 });
        }

        const webhookUrlMatch = webhookUrl.match(/(?:discord\.com|discordapp\.com)\/api\/webhooks\/(\d+)\/([a-zA-Z0-9_-]+)/);
        if (!webhookUrlMatch) {
            return NextResponse.json({ message: 'Invalid webhook URL format' }, { status: 400 });
        }

        const [, webhookId, webhookToken] = webhookUrlMatch;

        const webhookEditUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`;

        const response = await fetch(webhookEditUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({
                message: 'Failed to edit message',
                error: error
            }, {
                status: response.status
            });
        }

        return NextResponse.json({ message: 'Message edited successfully.' });
    } catch (error) {
        console.error('Edit message error:', error);
        return NextResponse.json({
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : String(error)
        }, {
            status: 500
        });
    }
}
