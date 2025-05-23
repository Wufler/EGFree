import Json from '@/components/Json'
import List from '@/components/List'
import Theme from '@/components/ui/Theme'
import { Button } from '@/components/ui/button'
import Github from '@/components/ui/github'
import { getEpicFreeGames } from '@/lib/getGames'
import { Hammer } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
	const games = await getEpicFreeGames()

	return (
		<main className="flex min-h-dvh flex-col bg-white dark:bg-epic-black text-foreground dark:text-white">
			<div className="w-full mx-auto flex flex-grow flex-col">
				<header className="z-50 border-b border-gray-200/80 dark:border-white/10 bg-white dark:bg-epic-black px-0 sm:px-8 backdrop-blur-md">
					<div className="container mx-auto flex flex-col md:flex-row h-auto md:h-20 items-center justify-between py-4 md:py-0 gap-4 md:gap-0">
						<Link
							href="https://store.epicgames.com/free-games"
							target="_blank"
							className="group flex items-center text-center"
						>
							<h1 className="text-xl md:text-2xl font-bold text-epic-blue transition-colors duration-200 group-hover:text-foreground dark:group-hover:text-white">
								Epic Games
							</h1>
							<div className="ml-2 md:ml-4 h-6 w-[1px] bg-gray-200 dark:bg-white/10" />
							<span className="ml-2 md:ml-4 text-base md:text-lg font-medium dark:text-white text-epic-gray">
								Free Games
							</span>
						</Link>
						<div className="flex items-center gap-2">
							<Button variant="ghost" className="rounded-full" asChild>
								<Link href="https://builder.wolfey.me" className="px-2.5 rounded-full">
									<Hammer className="!size-5" />
									Builder
								</Link>
							</Button>
							<Json games={games} />
						</div>
					</div>
				</header>

				<List games={games} />

				<footer className="px-4 mt-auto border-t border-gray-200/80 dark:border-white/10 text-center py-4">
					<div className="pb-1">
						<Theme />
						<Button asChild variant="ghost" size="icon" className="rounded-full">
							<Link href="https://github.com/WoIfey/epicfreegames" target="_blank">
								<Github className="!size-5 dark:invert-0 invert" />
							</Link>
						</Button>
					</div>
					<div className="text-sm text-epic-gray dark:text-muted-foreground">
						2025, Wolfey
					</div>
					<div className="mt-1 text-xs text-epic-gray dark:text-muted-foreground">
						This website is not affiliated with, endorsed by, or connected to Epic
						Games, Inc.
					</div>
				</footer>
			</div>
		</main>
	)
}
