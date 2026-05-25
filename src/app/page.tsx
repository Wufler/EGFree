import List from '@/components/List'
import { getEpicFreeGames } from '@/lib/getGames'
import { getMobileGames } from '@/lib/EGData'

export const dynamic = 'force-dynamic'

export default async function Home() {
	const [games, mobileGames] = await Promise.all([
		getEpicFreeGames(),
		getMobileGames(),
	])

	return (
		<main className="flex min-h-dvh flex-col text-foreground dark:text-white">
			<div className="w-full mx-auto flex grow flex-col">
				<List games={games} mobile={mobileGames} />
			</div>
		</main>
	)
}
