'use client'

import {
  calculateCosts,
  CONTRIBUTION_CAVEAT,
  COST_FIELDS,
} from '@/lib/business/focused-artifacts'
import { currencyDecimals, formatMoneyMinor } from '@/lib/business/format'
import type { FocusedCosts } from '@/lib/business/focused-types'
import { Card, Field, fieldClass } from './shared'

export function CostWorkbench({
  value,
  currency,
  onChange,
  readOnly = false,
}: {
  value: FocusedCosts
  currency: string
  onChange: (costs: FocusedCosts) => void
  readOnly?: boolean
}) {
  const summary = calculateCosts(value, currency)
  let places = 2
  try {
    places = currencyDecimals(currency)
  } catch {
    /* Summary reports unsupported currency. */
  }
  const money = (minor: number | null) =>
    minor === null ? 'Not calculated' : formatMoneyMinor(minor, currency)
  return (
    <Card
      title="Know what each order leaves you"
      description={`Complete a contribution worksheet in ${currency}. Enter 0 only when you have confirmed that a cost is zero; leave unknown costs blank.`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {COST_FIELDS.map(({ key, label, hint }) => (
          <Field
            key={key}
            label={`${label}${key === 'paymentPercent' ? ' (%)' : ` (${currency})`}`}
            hint={hint}
          >
            <input
              className={fieldClass}
              type="number"
              inputMode="decimal"
              min="0"
              max={key === 'paymentPercent' ? 100 : undefined}
              step={key === 'paymentPercent' ? 'any' : 10 ** -places}
              placeholder="Unknown"
              value={value[key] ?? ''}
              readOnly={readOnly}
              onChange={(event) =>
                onChange({
                  ...value,
                  [key]:
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </Field>
        ))}
      </div>
      <div
        className="mt-5 rounded-xl border border-[var(--border)] p-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {summary.complete ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs opacity-65">
                  Order revenue including shipping
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {money(summary.revenueMinor)}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-65">
                  Payment fee on this revenue
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {money(summary.feeMinor)}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-65">Order contribution</dt>
                <dd
                  className={`mt-1 text-xl font-semibold tabular-nums ${summary.contributionMinor! < 0 ? 'text-red-700 dark:text-red-300' : 'text-violet-700 dark:text-violet-300'}`}
                >
                  {money(summary.contributionMinor)}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-65">
                  If you absorbed the shipping charge
                </dt>
                <dd
                  className={`mt-1 text-xl font-semibold tabular-nums ${summary.freeShippingContributionMinor! < 0 ? 'text-red-700 dark:text-red-300' : ''}`}
                >
                  {money(summary.freeShippingContributionMinor)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed opacity-70">
              The free shipping scenario removes shipping revenue and
              recalculates the percentage fee. It assumes the same product
              price, carrier cost, and other entered costs.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">
              Complete the worksheet to see your contribution.
            </p>
            <p className="mt-2 text-xs leading-relaxed opacity-70">
              Still needed or invalid: {summary.missing.join(' · ')}.
            </p>
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed opacity-65">
        {CONTRIBUTION_CAVEAT}
      </p>
    </Card>
  )
}
