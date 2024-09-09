import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Epic Games Free Games',
	description: 'Check out the latest free games for Epic Games!',
	openGraph: {
		title: 'Epic Games Free Games',
		description: 'Check out the latest free games for Epic Games!',
		url: 'https://egfreegames.vercel.app/',
		siteName: 'Epic Games Free Games',
		images: [
			{
				url: 'https://wolfey.s-ul.eu/MdoL9N34',
				width: 1280,
				height: 720,
				alt: 'Thumbnail',
			},
		],
		locale: 'en_US',
		type: 'website',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider defaultTheme="system" attribute="class">
					{children}
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	)
}
