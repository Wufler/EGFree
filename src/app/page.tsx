import Json from '@/components/Json'
import List from '@/components/List'
import Theme from '@/components/Theme'
import { Button } from '@/components/ui/button'
import Github from '@/components/ui/github'
import { getEpicFreeGames } from '@/lib/getGames'
import { Hammer } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600

export default async function Home() {
	const games = await getEpicFreeGames()

	return (
		<main className="flex min-h-dvh flex-col bg-epic-black-light dark:bg-epic-black text-foreground dark:text-white">
			<div className="container mx-auto flex flex-grow flex-col">
				<header className="z-50 border-b border-gray-200/80 dark:border-white/10 bg-epic-black-light/95 dark:bg-epic-black/95 px-4 backdrop-blur-md">
					<div className="container mx-auto flex flex-col sm:flex-row h-auto sm:h-20 items-center justify-between py-5 sm:py-0 gap-4 sm:gap-0">
						<Link
							href="https://store.epicgames.com/free-games"
							target="_blank"
							className="group flex items-center text-center"
						>
							<h1 className="text-xl sm:text-2xl font-bold text-epic-blue-light dark:text-epic-blue transition-colors duration-200 group-hover:text-foreground dark:group-hover:text-white">
								Epic Games
							</h1>
							<div className="ml-2 sm:ml-4 h-6 w-[1px] bg-gray-200 dark:bg-white/10" />
							<span className="ml-2 sm:ml-4 text-base sm:text-lg font-medium text-epic-lightGray-light dark:text-epic-lightGray">
								Free Games
							</span>
						</Link>
						<div className="flex items-center gap-2">
							<Button variant="ghost" className="rounded-full" asChild>
								<Link href="https://builder.wolfey.me" className="px-2.5 rounded-full">
									<Hammer className="size-5 mr-2" />
									Builder
								</Link>
							</Button>
							<Json games={games} />
							<div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10" />
							<Theme />
							<Button
								asChild
								variant="ghost"
								size="icon"
								className="size-8 sm:size-10 rounded-full"
							>
								<Link href="https://github.com/WoIfey/epicfreegames" target="_blank">
									<Github className="size-4 sm:size-5 dark:invert-0 invert" />
								</Link>
							</Button>
						</div>
					</div>
				</header>

				<List games={games} />

				<footer className="px-4 mt-auto border-t border-gray-200/80 dark:border-white/10 py-5 text-center">
					<div className="text-sm text-epic-lightGray-light dark:text-epic-lightGray">
						2025, Wolfey
					</div>
					<div className="mt-1 text-xs text-epic-lightGray-light/70 dark:text-epic-lightGray/70">
						Offers may vary from what is shown.
					</div>
					<div className="mt-1 text-xs text-epic-lightGray-light/70 dark:text-epic-lightGray/70">
						This website is not affiliated with, endorsed by, or connected to Epic
						Games, Inc.
					</div>
				</footer>
			</div>
		</main>
	)
}
