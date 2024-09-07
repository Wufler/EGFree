import { OneEightyRing } from 'react-svg-spinners'
interface LoadingProps {
	text?: string
	textSize?: string
	fullscreen?: boolean
	background?: boolean
	size: number
}

export default function Loading(loading: LoadingProps) {
	return (
		<div
			className={`flex justify-center items-center gap-2 ${
				loading.fullscreen ? 'min-h-dvh' : ''
			} ${loading.background ? 'bg-primary-white dark:bg-primary-black' : ''}`}
		>
			<OneEightyRing width={loading.size} height={loading.size} color="#4195D1" />
			{loading?.text && (
				<div className={`text-black dark:text-white ${loading?.textSize || ''}`}>
					<span className="sr-only">{loading?.text}</span>
					<p>{loading?.text}</p>
				</div>
			)}
		</div>
	)
}
