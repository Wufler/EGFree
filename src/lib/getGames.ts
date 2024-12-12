import { EpicFreeGames } from "epic-free-games"

export async function getEpicFreeGames() {
    const epicFreeGames = new EpicFreeGames({ includeAll: true })

    try {
        const games = await epicFreeGames.getGames()
        return games
    } catch (error) {
        console.error('Error fetching games:', error)
        throw new Error('Failed to fetch games')
    }
}