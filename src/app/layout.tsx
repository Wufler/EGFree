import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import Snow from '@/components/ui/Snow'
import { getEpicFreeGames } from '@/lib/getGames'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
	const games = await getEpicFreeGames()

	const currentTitles =
		games.currentGames.length > 0
			? games.currentGames.map(game => game.title).join(', ')
			: 'No current offers'
	const upcomingTitles =
		games.nextGames.length > 0
			? games.nextGames.map(game => game.title).join(', ')
			: 'No upcoming offers'

	const description =
		games.currentGames.length === 0 && games.nextGames.length === 0
			? 'There are currently no offers available'
			: `💵 Current: ${currentTitles} \n ⌛ Upcoming: ${upcomingTitles}`

	return {
		title: 'Epic Games Free Games',
		description,
		metadataBase: new URL('https://free.wolfey.me/'),
		openGraph: {
			title: 'Epic Games Free Games',
			description,
			url: 'https://free.wolfey.me/',
			images: [
				{
					url: `/api/og?date=${Date.now()}`,
					width: 1280,
					height: 720,
					alt: 'Epic Games Free Games',
				},
			],
			locale: 'en_US',
			type: 'website',
		},
	}
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider
					defaultTheme="system"
					attribute="class"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Snow />
					<Toaster position="bottom-center" />
					<Analytics />
				</ThemeProvider>
			</body>
		</html>
	)
}
