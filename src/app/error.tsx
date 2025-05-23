'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({ reset }: { reset: () => void }) {
	return (
		<main className="grid min-h-dvh place-items-center bg-white dark:bg-epic-black px-6 py-24 sm:py-32 lg:px-8">
			<div className="text-center">
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-epic-blue sm:text-5xl">
					Oops!
				</h1>
				<p className="mt-6 text-base leading-7 text-muted-foreground">
					We are currently experiencing issues with the Epic Games API.
				</p>
				<p className="mt-2 text-base leading-7 text-muted-foreground">
					You can try again or check out the official Epic Games website for the free
					games.
				</p>
				<div className="mt-4 flex items-center justify-center gap-x-6">
					<Button asChild variant="outline" className="w-1/2">
						<Link href="https://store.epicgames.com/free-games">
							Proceed to the Epic Games Store
						</Link>
					</Button>
					<Button
						className="w-1/2 dark:text-black text-white"
						onClick={() => reset()}
					>
						Try Again
					</Button>
				</div>
			</div>
		</main>
	)
}
