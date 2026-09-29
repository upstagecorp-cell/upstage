import { addCalendarDays, differenceInCalendarDays, isDateKey } from '@/lib/date-time'

export interface StreakResult {
  streak: number
  lastActionDate: string | null
}

export function calculateStreakFromDates(dateKeys: string[], today: string): StreakResult {
  const dates = Array.from(new Set(dateKeys.filter(isDateKey))).sort((a, b) => b.localeCompare(a))
  if (dates.length === 0) return { streak: 0, lastActionDate: null }

  const mostRecent = dates[0]
  const yesterday = addCalendarDays(today, -1)
  if (mostRecent !== today && mostRecent !== yesterday) {
    return { streak: 0, lastActionDate: mostRecent }
  }

  let streak = 1
  for (let index = 1; index < dates.length; index += 1) {
    if (differenceInCalendarDays(dates[index - 1], dates[index]) !== 1) break
    streak += 1
  }

  return { streak, lastActionDate: mostRecent }
}
