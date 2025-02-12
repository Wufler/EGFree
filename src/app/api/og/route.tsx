import { ImageResponse } from 'next/og'
import { getEpicFreeGames } from '@/lib/getGames'
import { connection } from 'next/server'
import { format } from 'date-fns'

export const GET = async () => {
	await connection()
	const games = await getEpicFreeGames()

	const renderGameCard = (game: GameItem, isCurrentGame: boolean) => {
		const gameImage = game.keyImages.find(
			img =>
				img.type === 'OfferImageWide' ||
				img.type === 'VaultClosed' ||
				img.type === 'DieselStoreFrontWide'
		)?.url
		const isAddOn = game.offerType === 'ADD_ON'

		return (
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
					position: 'relative',
				}}
			>
				{isAddOn && (
					<div
						style={{
							position: 'absolute',
							top: '8px',
							right: '8px',
							backgroundColor: '#0070f3',
							color: 'white',
							padding: '4px 8px',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: 'bold',
							zIndex: 10,
						}}
					>
						ADD-ON
					</div>
				)}
				{gameImage ? (
					// eslint-disable-next-line
					<img
						src={gameImage}
						alt={game.title}
						width={1280}
						height={720}
						style={{
							width: '100%',
							height: '200px',
							objectFit: 'cover',
							borderTopLeftRadius: '8px',
							borderTopRightRadius: '8px',
							marginTop: '16px',
							filter: isCurrentGame ? 'none' : 'grayscale(100%)',
						}}
					/>
				) : (
					<div
						style={{
							width: '100%',
							height: '200px',
							backgroundColor: '#E5E7EB',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginTop: '16px',
							borderTopLeftRadius: '8px',
							borderTopRightRadius: '8px',
						}}
					>
						<span style={{ fontSize: '64px', color: '#0070f3' }}>🎁</span>
					</div>
				)}
				<h3
					style={{
						fontSize: '20px',
						fontWeight: 'bold',
						marginTop: '12px',
						color: '#000',
						textAlign: 'center',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '4px',
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
							borderRadius: '8px',
						}}
					>
						{isCurrentGame
							? 'Free Now'
							: `${format(
									game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
										.startDate,
									'MMM d'
							  )}`}
					</span>
					<span
						style={{
							fontSize: '12px',
							color: '#666',
							textDecoration: isCurrentGame ? 'line-through' : 'none',
						}}
					>
						{game.price.totalPrice.originalPrice === 0
							? ''
							: game.price.totalPrice.fmtPrice.originalPrice}
					</span>
				</div>
			</div>
		)
	}

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
					{games.currentGames.map(game => renderGameCard(game, true))}
				</div>
				<div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
					{games.nextGames.map(game => renderGameCard(game, false))}
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
			width: 1280,
			height: 720,
		}
	)
}
