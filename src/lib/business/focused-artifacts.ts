import { currencyDecimals, formatMoneyMinor, parseMoneyToMinor } from './format'
import type {
  FocusedCosts,
  FocusedInput,
  FocusedInvestigation,
} from './focused-types'
import type { BusinessProfile } from './types'
import { diagnoseInput } from './focused-diagnosis'

export const COST_FIELDS: Array<{
  key: keyof FocusedCosts
  label: string
  hint: string
}> = [
  {
    key: 'price',
    label: 'Product price',
    hint: 'The price paid for one order, before shipping.',
  },
  {
    key: 'productCost',
    label: 'Product cost',
    hint: 'What the products in one order cost you.',
  },
  {
    key: 'packaging',
    label: 'Packaging cost',
    hint: 'Boxes, labels, and other packaging per order.',
  },
  {
    key: 'fulfillment',
    label: 'Fulfillment cost',
    hint: 'Picking, packing, or other variable handling cost.',
  },
  {
    key: 'shippingCost',
    label: 'Shipping cost paid by you',
    hint: 'The carrier cost for this order.',
  },
  {
    key: 'shippingCharged',
    label: 'Shipping charged to customer',
    hint: 'Shipping revenue collected on this order.',
  },
  {
    key: 'paymentPercent',
    label: 'Payment fee percentage',
    hint: 'The fee applied to product plus shipping revenue.',
  },
  {
    key: 'paymentFixed',
    label: 'Fixed payment fee',
    hint: 'The additional payment fee per order.',
  },
]

export interface CostSummary {
  complete: boolean
  revenueMinor: number | null
  feeMinor: number | null
  contributionMinor: number | null
  freeShippingContributionMinor: number | null
  missing: string[]
}

/** Exact decimal percentage, rounded once to the currency's smallest unit. */
function percentageFee(revenue: number, percent: number): number {
  const [whole, fraction = ''] = String(percent).split('.')
  const numerator = BigInt(revenue) * BigInt(whole + fraction)
  const denominator = BigInt(100) * BigInt(10) ** BigInt(fraction.length)
  return Number((numerator + denominator / BigInt(2)) / denominator)
}

export function calculateCosts(
  costs: FocusedCosts,
  currency: string,
): CostSummary {
  const empty = (missing: string[]): CostSummary => ({
    complete: false,
    revenueMinor: null,
    feeMinor: null,
    contributionMinor: null,
    freeShippingContributionMinor: null,
    missing,
  })
  try {
    currencyDecimals(currency)
  } catch {
    return empty(['Choose a supported three-letter currency code.'])
  }
  const missing: string[] = []
  const amounts = {} as Record<
    Exclude<keyof FocusedCosts, 'paymentPercent'>,
    number
  >
  for (const { key, label } of COST_FIELDS) {
    const value = costs[key]
    if (value === null || value === undefined) {
      missing.push(label)
      continue
    }
    if (!Number.isFinite(value) || value < 0) {
      missing.push(`${label} must be a nonnegative number.`)
      continue
    }
    if (key === 'paymentPercent') {
      if (value > 100 || !/^\d+(?:\.\d+)?$/.test(String(value)))
        missing.push(
          'Payment fee percentage must be a decimal value between 0 and 100.',
        )
    } else {
      const minor = parseMoneyToMinor(String(value), currency)
      if (minor === null)
        missing.push(
          `${label} must match ${currency} currency precision and be within the supported range.`,
        )
      else amounts[key] = minor
    }
  }
  if (missing.length) return empty(missing)
  const revenueMinor = amounts.price + amounts.shippingCharged
  const directCosts =
    amounts.productCost +
    amounts.packaging +
    amounts.fulfillment +
    amounts.shippingCost
  if (!Number.isSafeInteger(revenueMinor) || !Number.isSafeInteger(directCosts))
    return empty(['Order amounts exceed the supported calculation range.'])
  const feeMinor =
    percentageFee(revenueMinor, costs.paymentPercent!) + amounts.paymentFixed
  const freeShippingFee =
    percentageFee(amounts.price, costs.paymentPercent!) + amounts.paymentFixed
  const contributionMinor = revenueMinor - directCosts - feeMinor
  const freeShippingContributionMinor =
    amounts.price - directCosts - freeShippingFee
  if (
    ![
      feeMinor,
      freeShippingFee,
      contributionMinor,
      freeShippingContributionMinor,
    ].every(Number.isSafeInteger)
  )
    return empty(['Order amounts exceed the supported calculation range.'])
  return {
    complete: true,
    revenueMinor,
    feeMinor,
    contributionMinor,
    freeShippingContributionMinor,
    missing: [],
  }
}

export const CONTRIBUTION_CAVEAT =
  'Order contribution is revenue minus the variable costs entered here. It is not profit. Taxes, returns, discounts, fixed overhead, and customer acquisition costs are not included. Confirm your actual fee basis.'

/** Spreadsheet cells contain only static labels, validated currency, or numeric values. */
export function makeCostCsv(
  costs: FocusedCosts,
  currency: string,
): string | null {
  const summary = calculateCosts(costs, currency)
  if (!summary.complete) return null
  const places = currencyDecimals(currency)
  const amount = (minor: number) => (minor / 10 ** places).toFixed(places)
  const rows: Array<Array<string | number>> = [
    ['NEXORA order contribution worksheet'],
    ['Currency', currency],
    ['Item', 'Amount', 'Unit'],
    ...COST_FIELDS.map(({ key, label }) => [
      label,
      costs[key]!,
      key === 'paymentPercent' ? 'percent' : currency,
    ]),
    ['Total order revenue', amount(summary.revenueMinor!), currency],
    ['Total payment fee', amount(summary.feeMinor!), currency],
    ['Order contribution', amount(summary.contributionMinor!), currency],
    [
      'Contribution with free shipping',
      amount(summary.freeShippingContributionMinor!),
      currency,
    ],
    ['Scope', CONTRIBUTION_CAVEAT],
  ]
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\r\n')
  )
}

/** Editable drafts use only saved facts; brackets mark facts the owner still needs to verify. */
export function buildSuggestedChange(
  input: FocusedInput,
  profile: BusinessProfile,
  artifact: 'shipping' | 'cost' | 'product' | 'traffic' | 'measurement',
): string | null {
  const currency = profile.currency
  const money = (major: number | null): string | null => {
    if (major === null || !Number.isFinite(major) || major < 0) return null
    try {
      const minor = parseMoneyToMinor(String(major), currency)
      return minor === null ? null : formatMoneyMinor(minor, currency)
    } catch {
      return null
    }
  }
  const product =
    input.product.trim() || profile.offering.trim() || '[Confirm the product]'
  const customer =
    profile.customerType.trim() || '[Confirm the target customer]'
  const channel = input.channel.trim() || '[Confirm one channel]'
  const period = `${input.periodStart || '[Set start date]'} through ${input.periodEnd || '[Set end date]'} (inclusive)`
  const source =
    input.source.trim() || '[Choose the actual dashboard or report]'
  if (artifact === 'cost') {
    const summary = calculateCosts(input.costs, currency)
    if (!summary.complete) return null
    return [
      `Order contribution worksheet: ${product}`,
      `Product price: ${money(input.costs.price)}; shipping charged: ${money(input.costs.shippingCharged)}.`,
      `Recorded variable costs: product ${money(input.costs.productCost)}, packaging ${money(input.costs.packaging)}, fulfillment ${money(input.costs.fulfillment)}, carrier shipping ${money(input.costs.shippingCost)}.`,
      `Payment fee: ${input.costs.paymentPercent}% of product plus shipping revenue, plus ${money(input.costs.paymentFixed)} per order. Calculated fee: ${formatMoneyMinor(summary.feeMinor!, currency)}.`,
      `Revenue per order: ${formatMoneyMinor(summary.revenueMinor!, currency)}. Order contribution: ${formatMoneyMinor(summary.contributionMinor!, currency)}.`,
      `If shipping charged to the customer became zero while price and costs stayed the same: contribution ${formatMoneyMinor(summary.freeShippingContributionMinor!, currency)} after recalculating the payment fee.`,
      CONTRIBUTION_CAVEAT,
      `Next decision: use these entered costs to set an acceptable contribution guardrail before changing the price or shipping charge on ${channel}.`,
    ].join('\n\n')
  }
  if (artifact === 'shipping') {
    const shipping = money(input.costs.shippingCharged)
    if (shipping === null) return null
    return [
      `Customer-facing notice draft for ${product}:`,
      `"Shipping: ${shipping} per order."`,
      `Place the confirmed notice beside the product price and in the cart on ${channel}, before the customer starts checkout. Keep the shipping charge and product price unchanged during this test.`,
      'Before use, verify that this exact charge applies to the selected product, destination, order size, and delivery method. If it varies, replace this notice with the actual conditions and amount. Add a delivery estimate only after checking the real fulfillment policy.',
      `Baseline: ${period}. Source: ${source}. Compare people starting checkout and purchasers using the same definitions and a later period of the same duration; record other changes.`,
    ].join('\n\n')
  }
  if (artifact === 'measurement') {
    const missing = (
      ['visits', 'views', 'carts', 'checkouts', 'orders'] as const
    ).filter((key) => input.metrics[key] === null)
    return [
      `Measurement plan for ${product} on ${channel}`,
      `Reporting period: ${period}. Report source: ${source}.`,
      'Use unique people, deduplicated across the entire reporting period, for each stage. Use one product and one attributable channel cohort; every later-stage person must belong to the earlier-stage population. Confirm event definitions in the selected report before calculating rates.',
      'Event definitions:\n- Unique visitors: people in the selected channel cohort who reach the store.\n- Product viewers: people from that visitor cohort who view this product.\n- Cart additions: people from those product viewers who add this product to cart.\n- Checkout starts: people from those cart additions who start checkout with this product.\n- Purchasers: people from those checkout starts with a confirmed purchase of this product.',
      missing.length
        ? `Events still needing a reported count: ${missing.join(', ')}. Leave each unknown value blank until the source is checked.`
        : 'All stage counts have been entered; verify the event definitions and cohort in the source report.',
      'Owner verification steps:\n1. Record the test time, device, consent state, channel tag, and test identity.\n2. Follow the tagged store link, view this product, add it to cart, and start checkout.\n3. If supported, finish a test-mode order and verify the confirmation event. If purchase verification is unavailable, record that gap.\n4. Locate each event in the selected report and check the same identity and product are associated.\n5. Label and exclude test activity from customer counts. Record actual customer counts for the chosen period, retaining any unmeasured values as unknown.',
    ].join('\n\n')
  }
  if (artifact === 'product') {
    return [
      `Product-page revision draft: ${product}`,
      `Product: ${product}\nFor: ${customer}\nCurrent offering: ${profile.offering.trim() || product}`,
      'Use and outcome: [Confirm the actual use and an evidence-supported outcome.]\nDifferences and included items: [List only verified specifications or inclusions.]\nAvailable options: [Check current stock or service availability.]\nPrice and shipping: [Insert the current confirmed amount and conditions.]\nDelivery: [Confirm the actual delivery or fulfillment terms.]',
      `Next step on ${channel}: show the available options and a clear route to purchase. Replace every bracketed item with verified facts before using this draft.`,
      'Ask a target customer to explain what the product is, which option fits, and what they would do next. Record their words and change one unclear section.',
    ].join('\n\n')
  }
  return [
    `One-channel acquisition experiment for ${product}`,
    `Target customer: ${customer}. Channel: ${channel}.`,
    `Message draft: "${product}. Explore the available options."\nSupporting offering facts: ${profile.offering.trim() || '[Confirm the offering facts]'}`,
    'Spending cap: [Unknown; set an explicit amount and currency before launching. A zero-spend test may be chosen.]\nDestination: [Confirm the product page and one trackable channel link.]',
    `Baseline: ${period}. Source: ${source}.`,
    'Use one message and destination. Record unique visitors, product viewers, cart additions, checkout starts, and purchasers from this channel cohort. Keep missing counts unknown and record other changes. Review customer relevance and downstream behavior alongside visits before expanding spend.',
  ].join('\n\n')
}

export function buildExperimentMarkdown(
  investigation: FocusedInvestigation,
): string {
  const text = (value: string) =>
    value
      .replaceAll('\r', '')
      .replaceAll('\n', ' / ')
      .replace(/[\\`*_[\]<>#]/g, '\\$&')
  const diagnosis = diagnoseInput(investigation, investigation.profileSnapshot)
  const costs = calculateCosts(
    investigation.costs,
    investigation.profileSnapshot.currency,
  )
  const money = (minor: number | null) =>
    minor === null
      ? 'Not calculated'
      : formatMoneyMinor(minor, investigation.profileSnapshot.currency)
  const measured = Object.entries(investigation.metrics)
    .filter(([key]) => key !== 'days')
    .map(
      ([key, value]) => `- ${key}: ${value === null ? 'Not measured' : value}`,
    )
    .join('\n')
  const document = [
    '# NEXORA experiment plan',
    `Business: ${text(investigation.profileSnapshot.name || 'Your business')}`,
    `Product: ${text(investigation.product)}`,
    `Channel: ${text(investigation.channel)}`,
    `Saved revision: ${investigation.revision} · Updated: ${investigation.updatedAt}`,
    '## Baseline',
    `${investigation.periodStart} through ${investigation.periodEnd} (inclusive)`,
    `Source: ${text(investigation.source)}`,
    `Comparable definitions and population confirmed: ${investigation.comparable ? 'Yes' : 'No'}`,
    measured,
    '## Self-reported follow-up answers',
    Object.entries(investigation.answers)
      .map(([key, value]) => `- ${text(key)}: ${text(value)}`)
      .join('\n') || 'No answers recorded.',
    '## Why this comes next',
    text(diagnosis.title),
    text(diagnosis.reason),
    'Observed or self-reported facts:',
    diagnosis.facts.map((fact) => `- ${text(fact)}`).join('\n') ||
      'No measured finding is supported yet.',
    'Hypotheses to check:',
    diagnosis.hypotheses
      .map((hypothesis) => `- ${text(hypothesis)}`)
      .join('\n') || 'No specific cause has been established.',
    '## Change to test',
    text(investigation.plan.change) || 'Not planned yet.',
    '## What will make the result useful',
    text(investigation.plan.successRule) || 'Not specified yet.',
    '## Guardrail',
    text(investigation.plan.guardrail) || 'Not specified yet.',
    '## Review date',
    investigation.plan.reviewDate || 'Not scheduled yet.',
    '## Order contribution worksheet',
    `Currency: ${investigation.profileSnapshot.currency}`,
    `Order revenue: ${money(costs.revenueMinor)}`,
    `Payment fee: ${money(costs.feeMinor)}`,
    `Order contribution: ${money(costs.contributionMinor)}`,
    `Contribution with free shipping: ${money(costs.freeShippingContributionMinor)}`,
    CONTRIBUTION_CAVEAT,
    '## Interpretation',
    'This plan records a hypothesis and a proposed test. A before-and-after change does not establish causation. Keep the reporting definitions, population, duration, and other changes visible when reviewing the outcome.',
  ]
  if (investigation.checkin) {
    const review = investigation.checkin
    document.push(
      '## Recorded check-in',
      `${review.periodStart} through ${review.periodEnd}`,
      `Source: ${text(review.source)}`,
      `What changed: ${text(review.changed)}`,
      `Comparable definitions and population confirmed: ${review.comparable ? 'Yes' : 'No'}`,
      Object.entries(review.metrics)
        .filter(([key]) => key !== 'days')
        .map(
          ([key, value]) =>
            `- ${key}: ${value === null ? 'Not measured' : value}`,
        )
        .join('\n'),
      `Notes: ${text(review.notes)}`,
    )
  }
  return document.join('\n\n') + '\n'
}
