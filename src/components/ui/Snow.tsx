'use client'
import Snowfall from 'react-snowfall'

export default function Snow() {
	return (
		<>
			{new Date().getMonth() === 11 && (
				<div className="w-full h-full absolute top-0 left-0 pointer-events-none">
					<Snowfall snowflakeCount={50} />
				</div>
			)}
		</>
	)
}
