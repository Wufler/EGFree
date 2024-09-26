import { differenceInSeconds } from "date-fns"

export const calculateTimeLeft = (endDate: Date): string => {
    const secondsLeft = differenceInSeconds(endDate, new Date())
    if (secondsLeft <= 0) return 'Expired'
    const days = Math.floor(secondsLeft / 86400)
    const hours = Math.floor((secondsLeft % 86400) / 3600)
    const minutes = Math.floor((secondsLeft % 3600) / 60)
    const seconds = secondsLeft % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return parts.join(' ')
}