const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export const FALLBACK_LOCALE = 'ko-KR'
export const FALLBACK_TIME_ZONE = 'UTC'

export interface TemporalContext {
  recordedAt: string
  localDate: string
  timeZone: string
  locale: string
}

export function getUserTimeZone(): string {
  if (typeof window === 'undefined') return FALLBACK_TIME_ZONE
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE
  } catch {
    return FALLBACK_TIME_ZONE
  }
}

export function getUserLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.languages?.[0] || navigator.language || FALLBACK_LOCALE
  }

  return FALLBACK_LOCALE
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_KEY_PATTERN.exec(value)
  if (!match) return false

  const [, year, month, day] = match
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return (
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() === Number(month) - 1 &&
    parsed.getUTCDate() === Number(day)
  )
}

function getDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  }
}

export function getLocalDateKey(
  date: Date = new Date(),
  timeZone: string = getUserTimeZone()
): string {
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date')

  try {
    const { year, month, day } = getDateParts(date, timeZone)
    return `${year}-${month}-${day}`
  } catch {
    const { year, month, day } = getDateParts(date, FALLBACK_TIME_ZONE)
    return `${year}-${month}-${day}`
  }
}

function dateKeyToUtcDate(dateKey: string): Date {
  if (!isDateKey(dateKey)) throw new Error(`Invalid date key: ${dateKey}`)
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function addCalendarDays(dateKey: string, amount: number): string {
  const date = dateKeyToUtcDate(dateKey)
  date.setUTCDate(date.getUTCDate() + amount)
  return getLocalDateKey(date, FALLBACK_TIME_ZONE)
}

export function differenceInCalendarDays(later: string, earlier: string): number {
  const milliseconds = dateKeyToUtcDate(later).getTime() - dateKeyToUtcDate(earlier).getTime()
  return Math.round(milliseconds / 86_400_000)
}

export function isDateKeyInRange(dateKey: string, startDate: string, endDate: string): boolean {
  return isDateKey(dateKey) && isDateKey(startDate) && isDateKey(endDate)
    ? dateKey >= startDate && dateKey <= endDate
    : false
}

export function formatDateKey(
  dateKey: string,
  locale: string = FALLBACK_LOCALE,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  const date = dateKeyToUtcDate(dateKey)
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: FALLBACK_TIME_ZONE }).format(date)
}

export function getTemporalContext(date: Date = new Date()): TemporalContext {
  const timeZone = getUserTimeZone()
  return {
    recordedAt: date.toISOString(),
    localDate: getLocalDateKey(date, timeZone),
    timeZone,
    locale: getUserLocale(),
  }
}
