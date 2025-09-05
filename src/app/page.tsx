import ClaimLinks from '@/components/Claim'
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
		<main className="flex min-h-dvh flex-col bg-gradient-to-br from-blue-50/50 via-blue-100/50 to-blue-200/50 dark:from-slate-950/80 dark:via-slate-900/80 dark:to-slate-800/80 text-foreground dark:text-white">
			<div className="w-full mx-auto flex flex-grow flex-col">
				<header className="z-50 border-b border-gray-200/80 dark:border-white/10 bg-white dark:bg-epic-black px-8 backdrop-blur-md">
					<div className="container mx-auto flex h-14 sm:h-20 items-center justify-between py-4 sm:py-0 gap-4 md:gap-0">
						<Link
							href="https://store.epicgames.com/free-games"
							target="_blank"
							className="group flex items-center text-center"
						>
							<h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-epic-blue transition-colors duration-200 group-hover:text-foreground dark:group-hover:text-white">
								Epic Games
							</h1>
							<div className="hidden sm:block ml-0 sm:ml-4 h-6 w-[1px] bg-gray-200 dark:bg-white/10" />
							<span className="ml-0 sm:ml-4 text-base sm:text-lg font-medium dark:text-white text-epic-gray">
								Free Games
							</span>
						</Link>
						<div className="flex items-center gap-2">
							<Json games={games} />
							<div className="hidden lg:block">
								<ClaimLinks games={games} />
							</div>
						</div>
					</div>
				</header>

				<List games={games} />

				<footer className="px-4 mt-auto border-t border-gray-200/80 dark:border-white/10 bg-white dark:bg-epic-black text-center py-4">
					<div className="text-sm text-epic-gray dark:text-muted-foreground">
						2025, Wolfey
					</div>
					<div className="mt-1 text-[11px] text-epic-gray dark:text-muted-foreground">
						This is not affiliated by any means with Epic Games, Inc.
					</div>
					<div className="mt-2 flex items-center justify-center gap-1 text-epic-gray dark:text-muted-foreground">
						<Theme />
						<Button variant="ghost" size="icon" className="rounded-full" asChild>
							<Link href="https://github.com/Wufler/EGFree" target="_blank">
								<Github className="size-5 dark:invert-[35%] invert" />
							</Link>
						</Button>
					</div>
				</footer>
			</div>
		</main>
	)
}
