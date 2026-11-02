export function currencyDecimals(currency: string): number {
  if (!/^[A-Z]{3}$/.test(currency) || !Intl.supportedValuesOf('currency').includes(currency)) throw new Error('Use a supported three-letter currency code.')
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}

export function parseMoneyToMinor(value: string, currency: string): number | null {
  const raw = value.trim()
  if (!raw) return null
  // Monetary arithmetic uses integers. Do not round an imprecise input silently.
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(raw)) return null
  const normalized = raw.replaceAll(',', '')
  const negative = normalized.startsWith('-')
  const [whole, fraction = ''] = normalized.replace(/^-/, '').split('.')
  const places = currencyDecimals(currency)
  if (fraction.length > places) return null
  const minor = Number(whole) * 10 ** places + Number(fraction.padEnd(places, '0'))
  return Number.isSafeInteger(minor) ? (negative ? -minor : minor) : null
}

export function formatMoneyMinor(value: number, currency: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'code' })
    .format(value / 10 ** currencyDecimals(currency))
}

export function formatMetric(value: number, unit: 'minor' | 'count', currency: string | null, locale = 'en-US'): string {
  if (unit === 'minor') return currency ? formatMoneyMinor(value, currency, locale) : 'Currency not specified'
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}
