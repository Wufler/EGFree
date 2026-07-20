import List from '@/components/List'
import { getEpicFreeGames } from '@/lib/getGames'
import { getMobileGames } from '@/lib/EGData'

export const dynamic = 'force-dynamic'

export default async function Home(props: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const [games, mobileGames, searchParams] = await Promise.all([
		getEpicFreeGames(),
		getMobileGames(),
		props.searchParams,
	])

	const gameId = searchParams?.offer as string | undefined

	return (
		<main className="flex min-h-dvh flex-col text-foreground dark:text-white">
			<div className="w-full mx-auto flex grow flex-col">
				<List games={games} mobile={mobileGames} initialGameId={gameId} />
			</div>
		</main>
	)
}
