import { ImageResponse } from 'next/og'
import { getEpicFreeGames } from '@/lib/getGames'
import { unstable_noStore as noStore } from 'next/cache'

export const alt = 'Epic Games Free Games'
export const size = {
	width: 1200,
	height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
	noStore()
	const games = await getEpicFreeGames()

	const renderGameCard = (game: any, isCurrentGame: boolean) => (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				width: '30%',
				height: '80%',
				backgroundColor: 'white',
				borderRadius: '8px',
				padding: '16px',
				margin: '0 8px',
			}}
		>
			<img
				src={game.keyImages.find((img: any) => img.type === 'OfferImageWide')?.url}
				alt={game.title}
				style={{
					width: '100%',
					height: '150px',
					objectFit: 'cover',
					borderRadius: '4px',
					marginTop: '16px',
				}}
			/>
			<h3
				style={{
					fontSize: '20px',
					fontWeight: 'bold',
					marginTop: '12px',
					color: '#000',
					textAlign: 'center',
				}}
			>
				{game.title}
			</h3>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					marginTop: '12px',
					marginBottom: '16px',
				}}
			>
				<span
					style={{
						fontSize: '12px',
						color: isCurrentGame ? 'white' : '#666',
						backgroundColor: isCurrentGame ? '#0070f3' : 'transparent',
						border: isCurrentGame ? 'none' : '1px solid #666',
						padding: '4px 8px',
						borderRadius: '4px',
					}}
				>
					{isCurrentGame ? 'Free Now' : 'Coming Soon'}
				</span>
				<span
					style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}
				>
					{game.price.totalPrice.fmtPrice.originalPrice}
				</span>
			</div>
		</div>
	)

	return new ImageResponse(
		(
			<div
				style={{
					fontSize: 32,
					background: 'black',
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'white',
					paddingTop: '65px',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
					{games.currentGames.map((game: any) => renderGameCard(game, true))}
				</div>
				<div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
					{games.nextGames.map((game: any) => renderGameCard(game, false))}
				</div>
			</div>
		),
		{
			...size,
		}
	)
}
