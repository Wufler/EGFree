'use client'
import { Check, ClipboardCopy, Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Discord from '@/components/ui/discord'
import Link from 'next/link'
import DiscordPreview from './Embed'

export function JsonPreviewButtons({
	idSuffix = '',
	settings,
	updateSetting,
	copyToClipboard,
	isCopied,
	className = '',
}: {
	idSuffix?: string
	settings: EgFreeSettings
	updateSetting: <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => void
	copyToClipboard: () => void
	isCopied: boolean
	className?: string
}) {
	return (
		<div className={`flex flex-col sm:flex-row gap-2 w-full ${className}`}>
			<Button
				onClick={copyToClipboard}
				className="w-full sm:flex-1 sm:min-w-0"
				variant="outline"
				size="default"
			>
				{isCopied ? (
					<Check className="size-4" />
				) : (
					<ClipboardCopy className="size-4" />
				)}
				Copy JSON
			</Button>
			<Label
				htmlFor={`discord${idSuffix}`}
				className="relative w-full sm:flex-1 sm:min-w-0 flex h-9 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all items-center justify-center gap-2 rounded-md"
			>
				<Discord className="size-4" />
				Discord Preview
				<Checkbox
					id={`discord${idSuffix}`}
					checked={settings.showDiscordPreview}
					onCheckedChange={checked => {
						updateSetting('showDiscordPreview', checked as boolean)
					}}
					className="pointer-events-none"
				/>
			</Label>
		</div>
	)
}

export default function JsonPreviewContent({
	idSuffix = '',
	jsonData,
	settings,
	updateSetting,
	copyToClipboard,
	isCopied,
	games,
	checkoutLink,
	parsedMobileGames,
	inlineButtons = true,
}: {
	idSuffix?: string
	jsonData: object
	settings: EgFreeSettings
	updateSetting: <T extends keyof EgFreeSettings>(
		key: T,
		value: EgFreeSettings[T],
	) => void
	copyToClipboard: () => void
	isCopied: boolean
	games: Game
	checkoutLink: string
	parsedMobileGames: MobileGameDataLocal[]
	inlineButtons?: boolean
}) {
	const activeMobile = parsedMobileGames.filter(
		g => g.promoEndDate && new Date(g.promoEndDate) > new Date(),
	)
	const builderUrl = `https://builder.wolfey.me/?data=${Buffer.from(
		JSON.stringify(jsonData),
	)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')}`

	return (
		<div>
			{inlineButtons && (
				<JsonPreviewButtons
					idSuffix={idSuffix}
					settings={settings}
					updateSetting={updateSetting}
					copyToClipboard={copyToClipboard}
					isCopied={isCopied}
					className="px-4 pt-2 pb-4"
				/>
			)}
			{settings.showDiscordPreview ? (
				<DiscordPreview
					games={games}
					settings={settings}
					checkoutLink={checkoutLink}
					parsedMobileGames={activeMobile}
				/>
			) : (
				<pre className="bg-secondary text-secondary-foreground p-4 overflow-auto text-xs whitespace-pre-wrap break-all">
					{JSON.stringify(jsonData, null, 2)}
				</pre>
			)}
			<div className="flex justify-center py-4 lg:p-4 lg:pb-6">
				<Link href={builderUrl} target="_blank">
					<div className="flex items-center gap-2 text-blue-500 hover:underline">
						<Hammer className="size-5" />
						<span>Open in Builder</span>
					</div>
				</Link>
			</div>
		</div>
	)
}
