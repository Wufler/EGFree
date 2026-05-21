import { ImageResponse } from 'next/og'
import { getEpicFreeGames } from '@/lib/getGames'
import { getMobileGames } from '@/lib/EGData'
import { format } from 'date-fns'
import {
	getPreferredGameImageUrl,
	formatMobileGamePrice,
} from '@/lib/builder/shared'

export const dynamic = 'force-dynamic'

export const GET = async () => {
	const [games, mobileGames] = await Promise.all([
		getEpicFreeGames(),
		getMobileGames(),
	])

	const now = new Date()
	const activeMobileGames = mobileGames.filter(
		g => !g.promoEndDate || new Date(g.promoEndDate) > now,
	)

	// Up to 3 games per column (if it goes above that then gg (probably not))
	const displayDesktop = games.currentGames.slice(0, 3)
	const displayMobile = activeMobileGames.slice(0, 3)
	const displayUpcoming = games.nextGames.slice(0, 3)

	const hasMobile = displayMobile.length > 0

	const maxGames = Math.max(
		displayDesktop.length,
		hasMobile ? displayMobile.length : 0,
		displayUpcoming.length,
	)

	let cardHeight = 210
	if (maxGames >= 3) {
		cardHeight = 140
	} else if (maxGames === 1) {
		cardHeight = 300
	}

	const isCompact = cardHeight < 160
	const padding = isCompact ? '12px' : '16px'
	const titleSize = isCompact ? '15px' : '18px'
	const subtitleSize = isCompact ? '11px' : '12px'
	const badgePadding = isCompact ? '3px 8px' : '4px 10px'
	const badgeFontSize = isCompact ? '10px' : '11px'
	const topBadgeOffset = isCompact ? '8px' : '12px'
	const headerMarginBottom = isCompact ? '24px' : '32px'
	const footerMarginTop = isCompact ? '20px' : '24px'
	const cardGap = isCompact ? '12px' : '16px'
	const columnHeaderMarginBottom = isCompact ? '12px' : '16px'

	const renderDesktopGameCard = (game: GameItem, isCurrent: boolean) => {
		const imageUrl = getPreferredGameImageUrl(game)

		let dateText = ''
		if (isCurrent) {
			const endDateStr =
				game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]?.endDate
			if (endDateStr) {
				try {
					dateText = `Until ${format(new Date(endDateStr), 'MMM d')}`
				} catch {
					dateText = 'FREE NOW'
				}
			} else {
				dateText = 'FREE NOW'
			}
		} else {
			const startDateStr =
				game.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
					?.startDate
			if (startDateStr) {
				try {
					dateText = format(new Date(startDateStr), 'MMM d')
				} catch {
					dateText = 'UPCOMING'
				}
			} else {
				dateText = 'UPCOMING'
			}
		}

		const isAddOn = game.offerType === 'ADD_ON'
		const originalPrice = game.price?.totalPrice?.fmtPrice?.originalPrice
		const sellerName =
			game.seller?.name && game.seller.name !== 'Epic Dev Test Account'
				? game.seller.name
				: ''

		return (
			<div
				key={game.id}
				style={{
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					width: '100%',
					height: `${cardHeight}px`,
					borderRadius: '12px',
					overflow: 'hidden',
					backgroundColor: '#1c1c20',
					border: '1px solid rgba(255, 255, 255, 0.08)',
					opacity: isCurrent ? 1 : 0.85,
				}}
			>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={game.title}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							borderRadius: '12px',
						}}
					/>
				) : (
					<div
						style={{
							display: 'flex',
							width: '100%',
							height: '100%',
							backgroundColor: '#101014',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<span style={{ fontSize: '48px' }}>🎁</span>
					</div>
				)}

				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage:
							'linear-gradient(to top, rgba(16, 16, 20, 0.95) 0%, rgba(16, 16, 20, 0.4) 50%, transparent 100%)',
					}}
				/>

				{/* Top-Left Date Badge */}
				<div
					style={{
						position: 'absolute',
						top: topBadgeOffset,
						left: topBadgeOffset,
						display: 'flex',
						alignItems: 'center',
						backgroundColor: isCurrent ? '#0074e4' : '#101014',
						color: '#ffffff',
						padding: badgePadding,
						borderRadius: '6px',
						fontSize: badgeFontSize,
						fontWeight: 'bold',
					}}
				>
					<span>{dateText}</span>
				</div>

				{/* Top-Right Tag */}
				{isAddOn && (
					<div
						style={{
							position: 'absolute',
							top: topBadgeOffset,
							right: topBadgeOffset,
							display: 'flex',
							backgroundColor: 'rgba(0, 0, 0, 0.75)',
							color: '#ffffff',
							padding: '4px 8px',
							borderRadius: '6px',
							fontSize: '10px',
							fontWeight: 'bold',
						}}
					>
						ADD-ON
					</div>
				)}

				{/* Bottom Content Info */}
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						padding: padding,
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'flex-end',
						justifyContent: 'space-between',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							flex: 1,
							marginRight: '12px',
							overflow: 'hidden',
						}}
					>
						<span
							style={{
								fontSize: titleSize,
								fontWeight: 'bold',
								color: '#ffffff',
								whiteSpace: 'nowrap',
								textOverflow: 'ellipsis',
								overflow: 'hidden',
							}}
						>
							{game.title}
						</span>
						{!isCompact && sellerName && (
							<span
								style={{
									fontSize: subtitleSize,
									color: '#b3b3b3',
									whiteSpace: 'nowrap',
									textOverflow: 'ellipsis',
									overflow: 'hidden',
									marginTop: '2px',
								}}
							>
								{sellerName}
							</span>
						)}
					</div>

					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 0,
						}}
					>
						{isCurrent ? (
							<div
								style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
							>
								{originalPrice && originalPrice !== '0' && originalPrice !== 'Free' && (
									<span
										style={{
											fontSize: '12px',
											color: '#8a8a8a',
											textDecoration: 'line-through',
											marginRight: '8px',
										}}
									>
										{originalPrice}
									</span>
								)}
								<span
									style={{
										backgroundColor: '#0074e4',
										color: '#ffffff',
										padding: '2px 8px',
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: 'bold',
									}}
								>
									FREE
								</span>
							</div>
						) : (
							originalPrice &&
							originalPrice !== '0' &&
							originalPrice !== 'Free' && (
								<span
									style={{
										fontSize: '13px',
										color: '#ffffff',
										fontWeight: 'bold',
									}}
								>
									{originalPrice}
								</span>
							)
						)}
					</div>
				</div>
			</div>
		)
	}

	const renderMobileGameCard = (game: MobileGame) => {
		const imageUrl = game.imageUrl

		let dateText = 'FREE NOW'
		if (game.promoEndDate) {
			try {
				dateText = `Until ${format(new Date(game.promoEndDate), 'MMM d')}`
			} catch {
				dateText = 'FREE NOW'
			}
		}

		const mobileTag =
			game.iosOffer && game.androidOffer
				? 'iOS & Android'
				: game.iosOffer
					? 'iOS'
					: game.androidOffer
						? 'Android'
						: null

		const originalPrice = formatMobileGamePrice(game)
		const sellerName =
			game.seller?.name && game.seller.name !== 'Epic Dev Test Account'
				? game.seller.name
				: ''

		return (
			<div
				key={`${game.namespace}-${game.title}`}
				style={{
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					width: '100%',
					height: `${cardHeight}px`,
					borderRadius: '12px',
					overflow: 'hidden',
					backgroundColor: '#1c1c20',
					border: '1px solid rgba(255, 255, 255, 0.08)',
				}}
			>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={game.title}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							borderRadius: '12px',
						}}
					/>
				) : (
					<div
						style={{
							display: 'flex',
							width: '100%',
							height: '100%',
							backgroundColor: '#101014',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<span style={{ fontSize: '48px' }}>🎁</span>
					</div>
				)}

				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage:
							'linear-gradient(to top, rgba(16, 16, 20, 0.95) 0%, rgba(16, 16, 20, 0.4) 50%, transparent 100%)',
					}}
				/>

				{/* Top-Left Date Badge */}
				<div
					style={{
						position: 'absolute',
						top: topBadgeOffset,
						left: topBadgeOffset,
						display: 'flex',
						alignItems: 'center',
						backgroundColor: '#0074e4',
						color: '#ffffff',
						padding: badgePadding,
						borderRadius: '6px',
						fontSize: badgeFontSize,
						fontWeight: 'bold',
					}}
				>
					<span>{dateText}</span>
				</div>

				{/* Top-Right Tag */}
				{mobileTag && (
					<div
						style={{
							position: 'absolute',
							top: topBadgeOffset,
							right: topBadgeOffset,
							display: 'flex',
							backgroundColor: 'rgba(0, 0, 0, 0.75)',
							color: '#ffffff',
							padding: '4px 8px',
							borderRadius: '6px',
							fontSize: '10px',
							fontWeight: 'bold',
						}}
					>
						{mobileTag}
					</div>
				)}

				{/* Bottom Content Info */}
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						padding: padding,
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'flex-end',
						justifyContent: 'space-between',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							flex: 1,
							marginRight: '12px',
							overflow: 'hidden',
						}}
					>
						<span
							style={{
								fontSize: titleSize,
								fontWeight: 'bold',
								color: '#ffffff',
								whiteSpace: 'nowrap',
								textOverflow: 'ellipsis',
								overflow: 'hidden',
							}}
						>
							{game.title}
						</span>
						{!isCompact && sellerName && (
							<span
								style={{
									fontSize: subtitleSize,
									color: '#b3b3b3',
									whiteSpace: 'nowrap',
									textOverflow: 'ellipsis',
									overflow: 'hidden',
									marginTop: '2px',
								}}
							>
								{sellerName}
							</span>
						)}
					</div>

					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 0,
						}}
					>
						{originalPrice && originalPrice !== '$0.00' && (
							<span
								style={{
									fontSize: '12px',
									color: '#8a8a8a',
									textDecoration: 'line-through',
									marginRight: '8px',
								}}
							>
								{originalPrice}
							</span>
						)}
						<span
							style={{
								backgroundColor: '#0074e4',
								color: '#ffffff',
								padding: '2px 8px',
								borderRadius: '4px',
								fontSize: '12px',
								fontWeight: 'bold',
							}}
						>
							FREE
						</span>
					</div>
				</div>
			</div>
		)
	}

	return new ImageResponse(
		<div
			style={{
				fontSize: 16,
				background:
					'linear-gradient(135deg, #101014 0%, #171821 50%, #101014 100%)',
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				color: 'white',
				padding: '40px',
				position: 'relative',
				fontFamily: 'sans-serif',
			}}
		>
			{/* Top Header */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					marginBottom: headerMarginBottom,
				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<span
						style={{
							fontSize: '14px',
							fontWeight: 'bold',
							color: '#34b8fc',
							letterSpacing: '3px',
							textTransform: 'uppercase',
						}}
					>
						Epic Games Store
					</span>
					<span
						style={{
							fontSize: '38px',
							fontWeight: 'bold',
							color: '#ffffff',
							marginTop: '4px',
						}}
					>
						Free Games This Week
					</span>
				</div>
			</div>

			{/* Columns Row */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					width: '100%',
					flex: 1,
					gap: '24px',
				}}
			>
				{/* Desktop Column */}
				<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: columnHeaderMarginBottom,
						}}
					>
						<span
							style={{
								fontSize: '15px',
								fontWeight: 'bold',
								color: '#ffffff',
								letterSpacing: '1px',
							}}
						>
							DESKTOP
						</span>
					</div>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: cardGap,
							width: '100%',
						}}
					>
						{displayDesktop.map(game => renderDesktopGameCard(game, true))}
					</div>
				</div>

				{/* Mobile Column */}
				{hasMobile && (
					<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
						<div
							style={{
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								marginBottom: columnHeaderMarginBottom,
							}}
						>
							<span
								style={{
									fontSize: '15px',
									fontWeight: 'bold',
									color: '#ffffff',
									letterSpacing: '1px',
								}}
							>
								MOBILE
							</span>
						</div>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: cardGap,
								width: '100%',
							}}
						>
							{displayMobile.map(game => renderMobileGameCard(game))}
						</div>
					</div>
				)}

				{/* Upcoming Column */}
				<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: columnHeaderMarginBottom,
						}}
					>
						<span
							style={{
								fontSize: '15px',
								fontWeight: 'bold',
								color: '#b3b3b3',
								letterSpacing: '1px',
							}}
						>
							UPCOMING
						</span>
					</div>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: cardGap,
							width: '100%',
						}}
					>
						{displayUpcoming.map(game => renderDesktopGameCard(game, false))}
					</div>
				</div>
			</div>

			{/* Bottom Footer */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					marginTop: footerMarginTop,
					paddingTop: '16px',
					borderTop: '1px solid rgba(255, 255, 255, 0.05)',
				}}
			>
				<span style={{ fontSize: '11px', color: '#666666' }}>free.wolfey.me</span>
				<span style={{ fontSize: '11px', color: '#666666' }}>
					{format(new Date(), 'MMM d, yyyy')}
				</span>
			</div>
		</div>,
		{
			width: 1280,
			height: 720,
		},
	)
}
