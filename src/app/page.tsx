import Json from '@/components/Json'
import List from '@/components/List'
import Theme from '@/components/Theme'
import { getEpicFreeGames } from '@/lib/getGames'
import { Metadata } from 'next'

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
		description: `Current: ${currentTitles}. Upcoming: ${upcomingTitles}.`,
		openGraph: {
			title: 'Epic Games Free Games',
			description: `Current: ${currentTitles}. Upcoming: ${upcomingTitles}.`,
			images: [
				{
					url: '/opengraph-image',
					width: 1200,
					height: 630,
					alt: 'Epic Games Free Games',
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: 'Epic Games Free Games',
			description: `Current free games: ${currentTitles}. Upcoming free games: ${upcomingTitles}.`,
			images: ['/opengraph-image'],
		},
	}
}

export default async function Home() {
	const games = await getEpicFreeGames()

	return (
		<main className="min-h-screen bg-white dark:bg-epic-black text-epic-black dark:text-white">
			<div className="container mx-auto px-4 py-8">
				<header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
					<div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 mb-4 sm:mb-0">
						<h1 className="text-4xl font-bold text-epic-blue">Epic Games</h1>
						<p className="text-xl text-epic-gray dark:text-epic-lightGray">
							Free Games
						</p>
					</div>
					<div className="flex items-center gap-4">
						<Json games={games} />
						<Theme />
					</div>
				</header>
				<List games={games} />
			</div>
		</main>
	)
}
