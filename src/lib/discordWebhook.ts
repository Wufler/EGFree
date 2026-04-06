export function buildWebhookExecuteUrl(webhookUrl: string, messageId?: string) {
	const base = webhookUrl.trim().replace(/\/?$/, '')
	const urlString = messageId?.trim()
		? `${base}/messages/${messageId.trim()}`
		: base
	const u = new URL(urlString)
	u.searchParams.set('with_components', 'true')
	if (!messageId?.trim()) {
		u.searchParams.set('wait', 'true')
	}
	return u.toString()
}
