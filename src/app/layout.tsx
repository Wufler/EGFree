import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import Snow from '@/components/ui/Snow'
import { getEpicFreeGames } from '@/lib/getGames'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
	const games = await getEpicFreeGames()

	const currentTitles = games.currentGames.map(game => game.title).join(', ')
	const upcomingTitles = games.nextGames.map(game => game.title).join(', ')

	return {
		title: 'Epic Games Free Games',
		description: `💵 Current: ${currentTitles} \n ⌛ Upcoming: ${upcomingTitles}`,
		openGraph: {
			title: 'Epic Games Free Games',
			description: `💵 Current: ${currentTitles} \n ⌛ Upcoming: ${upcomingTitles}`,
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
				</ThemeProvider>
			</body>
		</html>
	)
}
