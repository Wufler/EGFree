import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
	return (
		<main className="grid min-h-dvh place-items-center bg-epic-black dark:bg-epic-black px-6 py-24 sm:py-32 lg:px-8">
			<div className="text-center">
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground dark:text-white sm:text-5xl">
					Something happened!
				</h1>
				<p className="mt-6 text-base leading-7 text-epic-light-gray dark:text-epic-light-gray">
					This page either does not exist or got changed. 🤔
				</p>
				<div className="mt-4 flex items-center justify-center gap-x-6">
					<Link href={'/'}>
						<Button className="text-white dark:text-black">Back to Home</Button>
					</Link>
				</div>
			</div>
		</main>
	)
}
