'use client'
import { NinetyRing } from 'react-svg-spinners'
interface LoadingProps {
	text?: string
	textSize?: string
	fullscreen?: boolean
	background?: boolean
	size: number
	color: string
}

export default function Loading(loading: LoadingProps) {
	return (
		<div
			className={`flex justify-center items-center gap-2 ${
				loading.fullscreen ? 'min-h-dvh' : ''
			} ${loading.background ? 'bg-primary-white dark:bg-primary-black' : ''}`}
		>
			<NinetyRing
				width={loading.size}
				height={loading.size}
				color={loading.color}
			/>
			{loading?.text && (
				<div className={`text-black dark:text-white ${loading?.textSize || ''}`}>
					<span className="sr-only">{loading?.text}</span>
					<p>{loading?.text}</p>
				</div>
			)}
		</div>
	)
}
