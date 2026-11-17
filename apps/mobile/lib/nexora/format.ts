export function formatMetric(value: number, unit: string, currency: string | null): string {
  if (unit !== 'minor') return new Intl.NumberFormat('en-US', {maximumFractionDigits: 0}).format(value);
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return `${value} minor units (currency unavailable)`;
  try {
    const formatter = new Intl.NumberFormat('en-US', {style:'currency',currency,currencyDisplay:'code'});
    const places = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(value / 10 ** places);
  } catch { return `${value} minor units (${currency})`; }
}
