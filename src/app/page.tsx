import Json from '@/components/Json'
import List from '@/components/List'
import ModeToggle from '@/components/ModeToggle'
import { Button } from '@/components/ui/button'
import Github from '@/components/ui/github'
import { getEpicFreeGames } from '@/lib/getGames'
import Link from 'next/link'
import { connection } from 'next/server'

export default async function Home() {
	await connection()
	const games = await getEpicFreeGames()

	return (
		<main className="min-h-dvh bg-white dark:bg-epic-black text-epic-black dark:text-white flex flex-col">
			<div className="container mx-auto sm:px-4 sm:pb-8 pb-0 pt-8 flex flex-col flex-grow">
				<header className="flex flex-col sm:flex-row items-center justify-between lg:mb-8 mb-6">
					<div className="mb-4 sm:mb-0 text-center">
						<Link
							href="https://store.epicgames.com/free-games"
							target="_blank"
							className="flex items-center sm:items-end flex-col sm:flex-row gap-4"
						>
							<h1 className="text-4xl font-bold text-epic-blue">Epic Games</h1>
							<p className="text-xl text-epic-gray dark:text-epic-lightGray">
								Free Games
							</p>
						</Link>
					</div>
					<div className="flex items-center gap-2">
						<Json games={games} />
						<ModeToggle />
						<Button
							asChild
							variant="outline"
							size="icon"
							className="rounded-full size-10 bg-transparent border-none"
						>
							<Link href="https://github.com/WoIfey/epicfreegames" target="_blank">
								<Github className="dark:invert-0 invert size-6" />
							</Link>
						</Button>
					</div>
				</header>
				<List games={games} />
				<div className="mt-auto text-center text-sm text-muted-foreground py-2">
					&copy; 2025 Wolfey
				</div>
			</div>
		</main>
	)
}
