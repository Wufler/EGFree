import { differenceInSeconds } from "date-fns"

export const calculateTimeLeft = (endDate: Date): string => {
    const secondsLeft = differenceInSeconds(endDate, new Date())
    if (secondsLeft <= 0) return 'Expired'
    const days = Math.floor(secondsLeft / 86400)
    const hours = Math.floor((secondsLeft % 86400) / 3600)
    const minutes = Math.floor((secondsLeft % 3600) / 60)
    const seconds = secondsLeft % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
}