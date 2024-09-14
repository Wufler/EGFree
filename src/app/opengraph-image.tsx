import { ImageResponse } from 'next/og'
import { getEpicFreeGames } from '@/lib/getGames'
import { unstable_noStore as noStore } from 'next/cache'
import { format } from 'date-fns'

export const alt = 'Epic Games Free Games'
export const size = {
	width: 1280,
	height: 720,
}

export const contentType = 'image/png'

export default async function Image() {
	noStore()
	const games = await getEpicFreeGames()

	const renderGameCard = (game: any, isCurrentGame: boolean) => (
		<div
			key={game.id}
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				width: '30%',
				height: '80%',
				backgroundColor: 'white',
				borderRadius: '8px',
				margin: '0 16px',
			}}
		>
			<img
				src={game.keyImages.find((img: any) => img.type === 'OfferImageWide')?.url}
				alt={game.title}
				style={{
					width: '100%',
					height: '200px',
					objectFit: 'cover',
					borderTopLeftRadius: '4px',
					borderTopRightRadius: '4px',
					marginTop: '16px',
					filter: isCurrentGame ? 'none' : 'grayscale(100%)',
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
					marginBottom: '16px',
					padding: '16px',
					paddingTop: '0px',
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
					{isCurrentGame
						? 'Free Now'
						: `${format(
								new Date(
									game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
								),
								'MMM d'
						  )}`}
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
					background:
						'linear-gradient(135deg, #0E1E45 0%, #1A2A5E 25%, #2C3875 50%, #3E468C 75%, #5054A3 100%)',
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
				<div
					style={{
						display: 'flex',
						position: 'absolute',
						bottom: 10,
						right: 10,
						fontSize: 12,
						opacity: 0.5,
					}}
				>
					{new Date().toLocaleString()}
				</div>
				<div
					style={{
						display: 'flex',
						position: 'absolute',
						bottom: 10,
						left: 10,
						fontSize: 12,
						opacity: 0.5,
					}}
				>
					Epic Games Free Games
				</div>
			</div>
		),
		{
			...size,
		}
	)
}
