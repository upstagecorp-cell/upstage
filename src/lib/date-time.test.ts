import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  differenceInCalendarDays,
  getLocalDateKey,
  isDateKey,
} from '@/lib/date-time'
import { calculateStreakFromDates } from '@/lib/streak'

describe('date-time', () => {
  it('uses the requested IANA time zone for the local calendar date', () => {
    const instant = new Date('2026-01-01T00:30:00.000Z')

    expect(getLocalDateKey(instant, 'America/Los_Angeles')).toBe('2025-12-31')
    expect(getLocalDateKey(instant, 'Asia/Seoul')).toBe('2026-01-01')
  })

  it('adds calendar days without daylight-saving drift', () => {
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addCalendarDays('2028-02-29', 1)).toBe('2028-03-01')
    expect(differenceInCalendarDays('2028-03-01', '2028-02-28')).toBe(2)
  })

  it('rejects impossible date keys', () => {
    expect(isDateKey('2026-02-29')).toBe(false)
    expect(isDateKey('2028-02-29')).toBe(true)
  })
})

describe('streak', () => {
  it('counts consecutive local calendar dates', () => {
    expect(calculateStreakFromDates(
      ['2026-09-29', '2026-09-28', '2026-09-27', '2026-09-25'],
      '2026-09-29'
    )).toEqual({ streak: 3, lastActionDate: '2026-09-29' })
  })

  it('allows the latest action to be yesterday', () => {
    expect(calculateStreakFromDates(['2026-09-28', '2026-09-27'], '2026-09-29')).toEqual({
      streak: 2,
      lastActionDate: '2026-09-28',
    })
  })
})
