import { describe, expect, it } from 'vitest'
import { parseKoreanMoneyText } from '@/lib/financial'

describe('parseKoreanMoneyText', () => {
  it('parses plain and Korean-unit amounts', () => {
    expect(parseKoreanMoneyText('25,000,000')).toBe(25_000_000)
    expect(parseKoreanMoneyText('2,500만원')).toBe(25_000_000)
    expect(parseKoreanMoneyText('1억 5,000만원')).toBe(150_000_000)
    expect(parseKoreanMoneyText('-320만원')).toBe(-3_200_000)
    expect(parseKoreanMoneyText('0원')).toBe(0)
  })

  it('rejects partial or non-numeric input', () => {
    expect(parseKoreanMoneyText('abc')).toBeNull()
    expect(parseKoreanMoneyText('1억5000')).toBeNull()
    expect(parseKoreanMoneyText('100달러')).toBeNull()
  })
})
