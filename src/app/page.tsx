import Json from '@/components/Json'
import List from '@/components/List'
import Theme from '@/components/Theme'
import { getEpicFreeGames } from '@/lib/getGames'
import { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
	const games = await getEpicFreeGames()

	const currentTitles = games.currentGames
		.map((game: any) => game.title)
		.join(', ')
	const upcomingTitles = games.nextGames
		.map((game: any) => game.title)
		.join(', ')

	return {
		title: 'Epic Games Free Games',
		description: `💵 Current: ${currentTitles} \n ⌛ Upcoming: ${upcomingTitles}`,
		openGraph: {
			title: 'Epic Games Free Games',
			description: `💵 Current: ${currentTitles} \n ⌛ Upcoming: ${upcomingTitles}`,
			images: [
				{
					url: `/opengraph-image?date=${Date.now()}`,
					width: 1280,
					height: 720,
					alt: 'Epic Games Free Games',
				},
			],
		},
	}
}

export default async function Home() {
	const games = await getEpicFreeGames()

	return (
		<main className="min-h-dvh bg-white dark:bg-epic-black text-epic-black dark:text-white">
			<div className="container mx-auto px-4 lg:py-8 py-6">
				<header className="flex flex-col sm:flex-row sm:items-center justify-between lg:mb-8 mb-6">
					<div className="mb-4 sm:mb-0">
						<Link
							href="https://store.epicgames.com/en-US/free-games"
							target="_blank"
							className="flex items-start sm:items-end flex-col sm:flex-row gap-4"
						>
							<h1 className="text-4xl font-bold text-epic-blue">Epic Games</h1>
							<p className="text-xl text-epic-gray dark:text-epic-lightGray">
								Free Games
							</p>
						</Link>
					</div>
					<div className="flex items-center gap-2">
						<Json games={games} />
						<Theme />
					</div>
				</header>
				<List games={games} />
			</div>
		</main>
	)
}
