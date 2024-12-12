'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({ reset }: { reset: () => void }) {
	return (
		<main className="grid min-h-dvh place-items-center dark:bg-primary-black bg-primary-white px-6 py-24 sm:py-32 lg:px-8">
			<div className="text-center">
				<h1 className="mt-4 text-3xl font-bold font-source tracking-tight text-black dark:text-white sm:text-5xl">
					Oops!
				</h1>
				<p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-300">
					Currently, we are experiencing issues with the Epic Games API. Please check
					back later.
				</p>
				<p className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
					For now check out the official Epic Games website for the free games.
				</p>
				<div className="mt-4 flex items-center justify-center gap-x-6">
					{/* <Button className="mt-4 w-full rounded-lg" onClick={() => reset()}>
						Try Again
					</Button> */}
					<Button>
						<Link href="https://store.epicgames.com/en-US/free-games">
							Proceed to the Epic Games Store
						</Link>
					</Button>
				</div>
			</div>
		</main>
	)
}
