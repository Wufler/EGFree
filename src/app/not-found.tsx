import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface notFoundProps {
	h1: string
	p: string
}

export default function NotFound({
	h1 = 'Something happened!',
	p = "This page either doesn't exist or got changed. 🤔",
}: notFoundProps) {
	return (
		<main className="grid min-h-dvh place-items-center dark:bg-primary-black bg-primary-white px-6 py-24 sm:py-32 lg:px-8">
			<div className="text-center">
				<h1 className="mt-4 text-3xl font-bold font-source tracking-tight text-black dark:text-white sm:text-5xl">
					{h1}
				</h1>
				<p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-300">
					{p}
				</p>
				<div className="mt-4 flex items-center justify-center gap-x-6">
					<Link href={'/'}>
						<Button>Back to Home</Button>
					</Link>
				</div>
			</div>
		</main>
	)
}
