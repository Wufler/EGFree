'use client'

import { useState } from 'react'
import {
	Check,
	Clipboard,
	ClipboardCopy,
	Loader2,
	Send,
	Trash2,
	Upload,
	Undo2,
	ArrowLeft,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Textarea } from './ui/textarea'
import { HexColorPicker } from 'react-colorful'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { Switch } from './ui/switch'
import Discord from './ui/discord'
import { format } from 'date-fns'
import { Calendar } from './ui/calendar'
import Theme from './Theme'
import Link from 'next/link'

const defaultColor = '#85ce4b'

const defaultEmbed = {
	color: parseInt(defaultColor.replace('#', ''), 16),
	fields: [
		{
			name: 'Game',
			value: '~~€~~ **Free**\n[Claim Game]()',
			inline: true,
		},
	],
	author: {
		name: 'Epic Games Store',
		url: 'https://free.wolfey.me/',
		icon_url: 'https://wolfey.s-ul.eu/YcyMXrI1',
	},
	footer: {
		text: 'Offer ends',
	},
	timestamp: format(
		new Date().setHours(0, 0, 0, 0),
		"yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
	),
	image: {
		url: '',
	},
}

export default function EmbedBuilder() {
	const [embedData, setEmbedData] = useState({
		content: '<@&847939354978811924>',
		embeds: [defaultEmbed],
		username: 'Free Games',
		avatar_url: 'https://wolfey.s-ul.eu/5nV1WPyv',
		attachments: [],
	})

	const [isCopied, setIsCopied] = useState(false)
	const [webhookUrl, setWebhookUrl] = useState('')
	const [isVisible, setIsVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const updateEmbed = (
		embedIndex: number,
		key: keyof typeof defaultEmbed,
		value: (typeof defaultEmbed)[keyof typeof defaultEmbed]
	) => {
		setEmbedData(prev => ({
			...prev,
			embeds: prev.embeds.map((embed, i) =>
				i === embedIndex ? { ...embed, [key]: value } : embed
			),
		}))
	}

	const updateMetadata = (
		key: keyof Omit<typeof embedData, 'embeds'>,
		value: string
	) => {
		setEmbedData(prev => ({
			...prev,
			[key]: value,
		}))
	}

	const addEmbed = () => {
		setEmbedData(prev => ({
			...prev,
			embeds: [...prev.embeds, { ...defaultEmbed }],
		}))
	}

	const removeEmbed = (index: number) => {
		setEmbedData(prev => ({
			...prev,
			embeds: prev.embeds.filter((_, i) => i !== index),
		}))
	}

	const addField = (embedIndex: number) => {
		setEmbedData(prev => ({
			...prev,
			embeds: prev.embeds.map((embed, i) =>
				i === embedIndex
					? {
							...embed,
							fields: [...embed.fields, { name: '', value: '', inline: true }],
					  }
					: embed
			),
		}))
	}

	const updateField = (
		embedIndex: number,
		fieldIndex: number,
		field: Partial<(typeof embedData.embeds)[0]['fields'][0]>
	) => {
		setEmbedData(prev => ({
			...prev,
			embeds: prev.embeds.map((embed, i) =>
				i === embedIndex
					? {
							...embed,
							fields: embed.fields.map((f, j) =>
								j === fieldIndex ? { ...f, ...field } : f
							),
					  }
					: embed
			),
		}))
	}

	const removeField = (embedIndex: number, fieldIndex: number) => {
		setEmbedData(prev => ({
			...prev,
			embeds: prev.embeds.map((embed, i) =>
				i === embedIndex
					? {
							...embed,
							fields: embed.fields.filter((_, j) => j !== fieldIndex),
					  }
					: embed
			),
		}))
	}

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(embedData, null, 2))
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 1000)
			toast.success('Copied to clipboard')
		} catch (err) {
			console.error('Failed to copy:', err)
			toast.error('Failed to copy to clipboard')
		}
	}

	const loadFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText()
			const parsed = JSON.parse(text)

			type EmbedType = (typeof embedData.embeds)[0]
			type FieldType = (typeof embedData.embeds)[0]['fields'][0]

			setEmbedData(prev => ({
				content: parsed.content ?? prev.content,
				embeds:
					parsed.embeds?.map((embed: Partial<EmbedType>) => ({
						color: embed.color ?? prev.embeds[0].color,
						fields: embed.fields
							? embed.fields.map((field: Partial<FieldType>) => ({
									name: field.name || '',
									value: field.value || '',
									inline: field.inline ?? true,
							  }))
							: prev.embeds[0].fields,
						author: {
							name: embed.author?.name ?? prev.embeds[0].author?.name,
							url: embed.author?.url ?? prev.embeds[0].author?.url,
							icon_url: embed.author?.icon_url ?? prev.embeds[0].author?.icon_url,
						},
						footer: {
							text: embed.footer?.text ?? prev.embeds[0].footer?.text,
						},
						timestamp: embed.timestamp ?? prev.embeds[0].timestamp,
						image: {
							url: embed.image?.url ?? prev.embeds[0].image?.url,
						},
					})) ?? prev.embeds,
				username: parsed.username ?? prev.username,
				avatar_url: parsed.avatar_url ?? prev.avatar_url,
				attachments: parsed.attachments ?? prev.attachments,
			}))
			toast.success('Loaded from clipboard')
		} catch (err) {
			console.error('Failed to load:', err)
			toast.error('Invalid embed data in clipboard')
		}
	}

	const handleWebhook = async () => {
		if (!webhookUrl) {
			toast.error('Insert a webhook.')
			return
		}

		try {
			setIsLoading(true)
			const response = await fetch('/api/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ webhookUrl, jsonData: embedData }),
			})

			if (response.ok) {
				toast.success('Successfully sent data.')
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to send JSON Data.')
			}
		} catch (error) {
			console.error('Failed to send:', error)
			toast.error('Failed to send JSON Data.', {
				description: 'The webhook or data might be invalid.',
			})
		}
		setIsLoading(false)
	}

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrl(text)
		} catch {
			console.error('Failed to paste text')
		}
	}

	return (
		<div className="container mx-auto py-4">
			<Button variant="ghost" className="mb-4" asChild>
				<Link href="/">
					<ArrowLeft className="size-4 mr-2" /> Back to Free Games
				</Link>
			</Button>
			<div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle className="flex justify-between items-center">
							Embed Builder <Theme />
						</CardTitle>
						<CardDescription>Create custom embeds</CardDescription>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[calc(100vh-16rem)]">
							<div className="space-y-6">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Webhook URL</Label>
										<div className="flex items-center gap-2">
											<div className="flex-grow flex">
												<Input
													type={isVisible ? 'text' : 'password'}
													onFocus={() => setIsVisible(true)}
													onBlur={() => setIsVisible(false)}
													placeholder="https://"
													value={webhookUrl}
													onChange={e => setWebhookUrl(e.target.value)}
													className="rounded-r-none border-r-0"
												/>
												<Button
													variant="outline"
													size="icon"
													className="px-2 rounded-l-none border-l-0"
													onClick={handlePaste}
												>
													<Clipboard className="size-4" />
												</Button>
											</div>
										</div>
										<Button
											onClick={handleWebhook}
											className="w-full dark:text-black"
											size="sm"
											disabled={isLoading}
										>
											{isLoading ? (
												<Loader2 className="size-4 mr-2 animate-spin" />
											) : (
												<Send className="size-4 mr-2" />
											)}
											Send
										</Button>
									</div>

									<div className="space-y-2">
										<Label>Bot Settings</Label>
										<div className="grid gap-2">
											<Input
												placeholder="Bot Username"
												value={embedData.username}
												onChange={e => updateMetadata('username', e.target.value)}
											/>
											<Input
												placeholder="Bot Avatar URL"
												value={embedData.avatar_url}
												onChange={e => updateMetadata('avatar_url', e.target.value)}
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label>Message Content</Label>
										<Textarea
											value={embedData.content}
											onChange={e => updateMetadata('content', e.target.value)}
											placeholder="Content above the embed"
										/>
									</div>

									<Separator />

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label>Embeds</Label>
											<Button
												variant="outline"
												size="sm"
												onClick={addEmbed}
												className="h-7"
											>
												Add Embed
											</Button>
										</div>
									</div>

									{embedData.embeds.map((embed, embedIndex) => (
										<div key={embedIndex} className="space-y-6 border-l-2 pl-4 mt-4">
											<div className="flex items-center justify-between">
												<Label>Embed {embedIndex + 1}</Label>
												{embedData.embeds.length > 1 && (
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() => removeEmbed(embedIndex)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												)}
											</div>

											<div className="space-y-2">
												<Label>Author</Label>
												<div className="grid gap-2">
													<Input
														placeholder="Name"
														value={embed.author?.name}
														onChange={e =>
															updateEmbed(embedIndex, 'author', {
																...embed.author,
																name: e.target.value,
															})
														}
													/>
													<Input
														placeholder="URL"
														value={embed.author?.url}
														onChange={e =>
															updateEmbed(embedIndex, 'author', {
																...embed.author,
																url: e.target.value,
															})
														}
													/>
													<Input
														placeholder="Icon URL"
														value={embed.author?.icon_url}
														onChange={e =>
															updateEmbed(embedIndex, 'author', {
																...embed.author,
																icon_url: e.target.value,
															})
														}
													/>
												</div>
											</div>

											<Separator />

											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label>Fields</Label>
													<Button
														variant="outline"
														size="sm"
														onClick={() => addField(embedIndex)}
														className="h-7"
													>
														Add Field
													</Button>
												</div>
												<div className="space-y-4">
													{embed.fields.map((field, fieldIndex) => (
														<div key={fieldIndex} className="space-y-2">
															<div className="flex items-center gap-2">
																<Label className="text-xs text-muted-foreground">
																	Field {fieldIndex + 1}
																</Label>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6"
																	onClick={() => removeField(embedIndex, fieldIndex)}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>
															<div className="grid gap-2">
																<Input
																	placeholder="Name"
																	value={field.name}
																	onChange={e =>
																		updateField(embedIndex, fieldIndex, {
																			name: e.target.value,
																		})
																	}
																/>
																<Input
																	placeholder="Value"
																	value={field.value}
																	onChange={e =>
																		updateField(embedIndex, fieldIndex, {
																			value: e.target.value,
																		})
																	}
																/>
																<div className="flex items-center space-x-2">
																	<Switch
																		id={`field-${embedIndex}-${fieldIndex}-inline`}
																		checked={field.inline}
																		onCheckedChange={checked =>
																			updateField(embedIndex, fieldIndex, {
																				inline: checked,
																			})
																		}
																	/>
																	<Label htmlFor={`field-${embedIndex}-${fieldIndex}-inline`}>
																		Inline
																	</Label>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>

											<Separator />

											<div className="space-y-2">
												<Label>Image</Label>
												<Input
													placeholder="Image URL"
													value={embed.image?.url || ''}
													onChange={e =>
														updateEmbed(embedIndex, 'image', { url: e.target.value })
													}
												/>
											</div>

											<div className="space-y-2">
												<Label>Footer</Label>
												<div className="grid gap-2">
													<Input
														placeholder="Footer text"
														value={embed.footer?.text}
														onChange={e =>
															updateEmbed(embedIndex, 'footer', {
																...embed.footer,
																text: e.target.value,
															})
														}
													/>
												</div>
											</div>

											<div className="space-y-2">
												<Label>Color</Label>
												<div className="flex items-center gap-2">
													<Popover>
														<PopoverTrigger asChild>
															<Button
																className="size-10"
																style={{
																	backgroundColor: `#${embed.color
																		.toString(16)
																		.padStart(6, '0')}`,
																}}
															/>
														</PopoverTrigger>
														<PopoverContent className="w-full p-3" align="start">
															<HexColorPicker
																color={`#${embed.color.toString(16).padStart(6, '0')}`}
																onChange={color =>
																	updateEmbed(
																		embedIndex,
																		'color',
																		parseInt(color.replace('#', ''), 16)
																	)
																}
																className="!w-full mb-2"
															/>
															<Button
																onClick={() =>
																	updateEmbed(
																		embedIndex,
																		'color',
																		parseInt(defaultColor.replace('#', ''), 16)
																	)
																}
																variant="outline"
																size="sm"
																className="w-full px-8"
															>
																<Undo2 className="size-4 mr-2" />
																Reset to Default
															</Button>
														</PopoverContent>
													</Popover>
													<Input
														value={`#${embed.color.toString(16).padStart(6, '0')}`}
														onChange={e =>
															updateEmbed(
																embedIndex,
																'color',
																parseInt(e.target.value.replace('#', ''), 16)
															)
														}
														maxLength={7}
														className="font-mono"
													/>
												</div>
											</div>

											<div className="space-y-2">
												<Label>Timestamp</Label>
												<div className="grid gap-2">
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="outline"
																className="w-full justify-start text-left font-normal"
															>
																{embed.timestamp ? (
																	format(new Date(embed.timestamp), 'PPP')
																) : (
																	<span>Pick a date</span>
																)}
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0">
															<Calendar
																mode="single"
																selected={
																	embed.timestamp ? new Date(embed.timestamp) : undefined
																}
																onSelect={date =>
																	date &&
																	updateEmbed(embedIndex, 'timestamp', date.toISOString())
																}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Preview</CardTitle>
						<CardDescription>
							Preview your embed and copy the JSON data
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[calc(100vh-16rem)]">
							<div className="space-y-4">
								<div className="flex gap-2">
									<Button variant="outline" className="w-full" onClick={copyToClipboard}>
										{isCopied ? (
											<Check className="mr-2 h-4 w-4" />
										) : (
											<ClipboardCopy className="mr-2 h-4 w-4" />
										)}
										Copy JSON
									</Button>
									<Button
										variant="outline"
										className="w-full"
										onClick={loadFromClipboard}
									>
										<Upload className="mr-2 h-4 w-4" />
										Load from Clipboard
									</Button>
								</div>

								<div className="rounded-lg overflow-hidden border bg-card">
									<div className="bg-muted p-3 border-b">
										<pre className="text-xs break-all whitespace-pre-wrap">
											{JSON.stringify(embedData, null, 2)}
										</pre>
									</div>
								</div>

								<div className="dark:bg-[#313338] bg-[#ffffff] rounded-md p-4 [overflow-wrap:anywhere]">
									<div className="flex gap-4">
										<div className="flex-shrink-0">
											<div className="size-10 mt-1 flex items-center justify-center">
												{embedData.avatar_url ? (
													<img
														src={`${embedData.avatar_url}`}
														alt={`${embedData.username}`}
													/>
												) : (
													<div className="dark:bg-[#6263ed] bg-[#5865f2] rounded-full size-10 mt-1 flex items-center justify-center">
														<Discord className="filter invert brightness-0 size-[23px]" />
													</div>
												)}
											</div>
										</div>
										<div className="flex-grow">
											<div className="flex items-center gap-1 mb-1">
												<div className="font-medium">{embedData.username}</div>
												<div className="dark:bg-[#6263ed] bg-[#5865f2] ml-0.5 text-white rounded-sm px-[5px] font-semibold text-xs mt-0.5">
													APP
												</div>
												<div className="text-xs ml-1 mt-0.5 text-[#616366] dark:text-[#949b9d]">
													Today at {format(new Date(), 'HH:mm')}
												</div>
											</div>
											{embedData.content && (
												<div className="mb-2 text-sm">
													{embedData.content.split(/(<@&\d+>)/).map((part, i) => {
														const roleMatch = part.match(/^<@&(\d+)>$/)
														if (roleMatch) {
															return (
																<span
																	key={i}
																	className="text-[#535ec8] dark:text-[#c9cdfb] bg-[#e6e8fd] dark:bg-[#3c4270] rounded-sm py-0.5 px-1"
																>
																	@role
																</span>
															)
														}
														return part
													})}
												</div>
											)}
											{embedData.embeds.map((embed, embedIndex) => (
												<div
													key={embedIndex}
													className="flex mt-1 rounded-sm overflow-hidden"
													style={{
														borderLeft: `4px solid #${embed.color
															.toString(16)
															.padStart(6, '0')}`,
													}}
												>
													<div className="max-w-md bg-[#f2f3f5] dark:bg-[#2B2D31] p-3.5 pr-4">
														{embed.author && (
															<div className="flex items-center mb-2">
																{embed.author.icon_url && (
																	<img
																		src={embed.author.icon_url}
																		alt="Epic Games Store"
																		className="size-7 rounded-full mr-2.5"
																	/>
																)}
																{embed.author.url ? (
																	<a
																		href={embed.author.url}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="hover:underline text-sm font-medium cursor-pointer"
																	>
																		{embed.author.name}
																	</a>
																) : (
																	<p className="text-sm font-medium">{embed.author.name}</p>
																)}
															</div>
														)}
														<div className="flex flex-col text-sm gap-0.5">
															{embed.fields.map((field, i) => (
																<div
																	key={i}
																	className={`${field.inline ? 'inline-block mr-4' : ''}`}
																>
																	{field.name && <h1 className="font-semibold">{field.name}</h1>}
																	{field.value && (
																		<div
																			dangerouslySetInnerHTML={{
																				__html: field.value
																					.replace(/\n/g, '<br/>')
																					.replace(
																						/\[([^\]]+)\]\(([^)]+)\)/g,
																						'<a href="$2" class="text-[#4e80eb] dark:text-[#00A8FC] hover:underline">$1</a>'
																					)
																					.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
																					.replace(/~~(.*?)~~/g, '<del>$1</del>'),
																			}}
																		/>
																	)}
																</div>
															))}
															{embed.image?.url && (
																<img
																	src={embed.image.url}
																	alt="Embed Image"
																	className="w-full h-full object-cover rounded-md mt-4"
																/>
															)}
														</div>
														{(embed.footer?.text || embed.timestamp) && (
															<div className="text-xs font-light !mt-2">
																{embed.footer?.text}{' '}
																{embed.timestamp && (
																	<>• {format(new Date(embed.timestamp), 'dd/MM/yyyy')}</>
																)}
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
