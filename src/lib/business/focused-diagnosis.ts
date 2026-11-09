/** A bounded diagnostic model for a physical-goods online shop. No external benchmarks. */
import type { FocusedInput } from './focused-types'
import type { BusinessProfile } from './types'

export const FOCUSED_ANSWER_OPTIONS: Record<string, readonly string[]> = {
  cohort: ['same', 'different'],
  focus: ['checkout', 'product', 'traffic', 'cost'],
  measurementSource: ['store', 'analytics', 'unknown'],
  trackingChecked: ['yes', 'no', 'unknown'],
  shippingMargin: ['positive', 'unknown', 'negative'],
  shippingTiming: ['checkout', 'early', 'free', 'unknown'],
  paymentIssue: ['yes', 'no', 'unknown'],
  productClarity: ['confused', 'stock', 'unknown'],
}
export type Profile = {
  name: string
  product: string
  customer: string
  price: number | null
  shipping: number | null
  currency: string
}
export type Metrics = {
  visits: number | null
  views: number | null
  carts: number | null
  checkouts: number | null
  orders: number | null
  days: number
}
export type Answers = Record<string, string>
export type Question = {
  key: string
  title: string
  options: { value: string; label: string }[]
}
export type Diagnosis = {
  key: string
  title: string
  summary: string
  reason: string
  action: string
  question: Question | null
  facts: string[]
  hypotheses: string[]
  missing: string[]
  artifact: 'shipping' | 'cost' | 'product' | 'traffic' | 'measurement'
  confidence: string
}
const fields = ['visits', 'views', 'carts', 'checkouts', 'orders'] as const
const labels: Record<(typeof fields)[number], string> = {
  visits: 'Unique visitors',
  views: 'People viewing the product',
  carts: 'People adding to cart',
  checkouts: 'People starting checkout',
  orders: 'Purchasers',
}
const count = (value: number) => value.toLocaleString('en-US')
const ratio = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : 'not calculable'
const question = (
  key: string,
  title: string,
  options: [string, string][],
): Question => ({
  key,
  title,
  options: options.map(([value, label]) => ({ value, label })),
})
function numericErrors(metrics: Metrics): string[] {
  const errors: string[] = []
  if (!Number.isFinite(metrics.days) || metrics.days <= 0)
    errors.push('Choose a finite reporting period greater than zero days.')
  for (const key of fields) {
    const value = metrics[key]
    if (value !== null && (!Number.isSafeInteger(value) || value < 0))
      errors.push(
        `${labels[key]} must be a nonnegative safe integer, or left unmeasured.`,
      )
  }
  return errors
}
/** Null is unmeasured, not zero. Counts must represent one period and nested unique-person cohort. */
export function validateMetrics(metrics: Metrics): string[] {
  const errors = numericErrors(metrics)
  if (errors.length) return errors
  for (let i = 0; i < fields.length; i++) {
    const before = metrics[fields[i]]
    if (before === null) continue
    for (let j = i + 1; j < fields.length; j++) {
      const after = metrics[fields[j]]
      if (after !== null && after > before) {
        errors.push(
          `${labels[fields[j]]} exceed ${labels[fields[i]]}. Check that they cover the same period and nested unique-person cohort.`,
        )
        break
      }
    }
  }
  return errors
}

export function diagnose(
  profile: Profile,
  metrics: Metrics,
  answers: Answers = {},
  comparable = true,
): Diagnosis {
  const canCompare = comparable && answers.cohort !== 'different'
  const errors = canCompare ? validateMetrics(metrics) : numericErrors(metrics)
  if (
    (profile.price !== null &&
      (!Number.isFinite(profile.price) || profile.price < 0)) ||
    (profile.shipping !== null &&
      (!Number.isFinite(profile.shipping) || profile.shipping < 0))
  )
    errors.push(
      'Price and customer-paid shipping must be finite nonnegative amounts, or left unmeasured.',
    )
  const facts: string[] = []
  const missing = fields
    .filter((key) => metrics[key] === null)
    .map((key) => `${labels[key]} not measured`)
  const entries = fields
    .filter((key) => metrics[key] !== null)
    .map((key) => `${labels[key]}: ${count(metrics[key]!)}`)
  const base: Diagnosis = {
    key: 'measure-funnel',
    title: 'First, separate what you know from what is missing',
    summary:
      'Unmeasured counts stay unknown. They have not been replaced with zero.',
    reason:
      'Too few relevant visits, difficulty choosing a product, and friction at checkout need different changes. A consistent period and event definition help distinguish them.',
    action:
      'Complete a measurement plan with event definitions, the source of each count, and a review date.',
    question: null,
    facts,
    hypotheses: [],
    missing,
    artifact: 'measurement',
    confidence:
      'Exploratory assessment from your inputs · cause not established',
  }
  if (errors.length)
    return {
      ...base,
      key: 'invalid-metrics',
      title: 'Align the numbers before choosing a change',
      summary: errors.join(' '),
      missing: errors,
      reason:
        'Mixing periods or count definitions can produce a misleading conversion rate and improvement plan.',
      action:
        'Correct the values using the same period and unique-person cohort, or leave an unknown value unmeasured.',
    }
  if (!comparable || answers.cohort === 'different')
    return {
      ...base,
      key: 'different-cohort',
      title: 'These counts cannot yet be compared',
      summary:
        'The period or event definitions differ. No conversion rates or funnel losses have been calculated.',
      missing: [
        ...missing,
        'Counts from the same period and nested unique-person cohort',
      ],
      action:
        'Use the measurement plan to align the reporting period and event definitions.',
    }
  if (entries.length)
    facts.push(
      `Your inputs for the selected ${metrics.days}-day reporting period: ${entries.join(' · ')}.`,
    )
  if (
    metrics.checkouts !== null &&
    metrics.orders !== null &&
    metrics.checkouts > 0
  )
    facts.push(
      `${count(metrics.orders)} of ${count(metrics.checkouts)} people who started checkout purchased (${ratio(metrics.orders, metrics.checkouts)}); ${count(metrics.checkouts - metrics.orders)} people did not purchase in this reporting period.`,
    )
  if (metrics.views !== null && metrics.carts !== null && metrics.views > 0)
    facts.push(
      `${count(metrics.carts)} of ${count(metrics.views)} people viewing this product added it to cart (${ratio(metrics.carts, metrics.views)}).`,
    )

  const costs = (): Diagnosis => ({
    ...base,
    key: 'unit-economics',
    title: 'Check what one order leaves before changing the offer',
    summary: `Calculate the amount remaining from one ${profile.product || 'product'} order after the recorded product, packaging, fulfillment, shipping, and payment costs.`,
    reason:
      'Free shipping or a discount can increase orders while losing money on each one. Actual costs show which changes you can afford.',
    action:
      'Complete the per-order cost sheet using actual amounts. It covers the recorded variable costs only and excludes ad spend, additional discounts, returns, fixed overhead, and taxes; it is not net profit.',
    artifact: 'cost',
    hypotheses: [
      'The impact of a shipping or discount change on contribution needs actual cost inputs.',
    ],
  })
  if (
    answers.focus === 'cost' ||
    ['unknown', 'negative'].includes(answers.shippingMargin)
  )
    return costs()
  if (!entries.length)
    return {
      ...base,
      question: answers.measurementSource
        ? null
        : question(
            'measurementSource',
            'Where can you check visits and purchases?',
            [
              ['store', 'In my store dashboard'],
              ['analytics', 'In an analytics tool'],
              ['unknown', 'I do not collect them yet, or I am not sure'],
            ],
          ),
      missing: [...missing, 'A consistent reporting period and data source'],
      action:
        answers.measurementSource === 'unknown'
          ? 'Complete the event-collection plan, then record the first consistent reporting period. No counts have been invented.'
          : 'Choose one reporting period in your dashboard, record the available counts, and leave any unavailable event unmeasured.',
    }
  if (metrics.visits === 0) {
    if (answers.trackingChecked === 'no')
      return {
        ...base,
        key: 'tracking-issue',
        title: 'Resolve the missing visit record before testing acquisition',
        summary:
          'You said your own test visit did not appear. The zero count does not yet establish a lack of real visitors.',
        reason:
          'Traffic experiments cannot be interpreted reliably while known test visits are missing.',
        action:
          'Record the test time, device, consent settings, event trigger, and expected record. Verify a new test visit after correcting collection.',
      }
    if (answers.trackingChecked === 'unknown')
      return {
        ...base,
        key: 'verify-tracking',
        title: 'Make one known visit and check that it appears',
        summary:
          'Tracking has not been checked yet. Keep the zero count provisional until a known test visit is verified.',
        action:
          'Open the store yourself and record the visit time, device, and dashboard result in the measurement plan.',
      }
    if (answers.trackingChecked !== 'yes')
      return {
        ...base,
        key: 'check-tracking',
        title: 'Check whether zero visits means zero recorded visits',
        summary:
          'You entered zero visits. A tracking problem and a genuine lack of visitors need different next steps.',
        question: question(
          'trackingChecked',
          'Does your own test visit appear in the dashboard?',
          [
            ['yes', 'Yes, I checked that tracking works'],
            ['no', 'No, my test visit is missing'],
            ['unknown', 'I have not checked yet'],
          ],
        ),
        action:
          'Record your test time, device, and whether the visit appeared in the measurement plan.',
      }
    return {
      ...base,
      key: 'traffic-plan',
      title: 'Create one route for relevant customers to arrive',
      summary:
        'You confirmed that visit tracking works, and entered zero visits for this period.',
      reason:
        'There were no recorded visits in this period to observe product or checkout behavior. One targeted channel can provide the evidence for the next assessment.',
      action: `Complete a traffic experiment for ${profile.customer || 'your target customer'}: one channel, one message, a spending limit, and a review date.`,
      artifact: 'traffic',
      hypotheses: [
        'Test whether the selected channel can bring relevant people to this product.',
      ],
    }
  }
  if (answers.focus === 'traffic')
    return {
      ...base,
      key: 'traffic-plan',
      title: 'Choose a channel and the behavior to measure together',
      summary:
        'You chose customer acquisition as the problem to investigate. These counts alone do not establish that your traffic is too low.',
      reason:
        'Track product and purchase behavior alongside visits to distinguish relevant customer acquisition from more exposure alone.',
      action: `Choose one channel for ${profile.customer || 'your target customer'} and record the message, budget, and behavior you will measure.`,
      artifact: 'traffic',
      hypotheses: [
        'Test the fit between the selected channel, customer, and product.',
      ],
    }

  const checkoutLoss =
    metrics.checkouts !== null &&
    metrics.orders !== null &&
    metrics.checkouts > metrics.orders
  if (checkoutLoss || answers.focus === 'checkout') {
    const shippingIsFree =
      profile.shipping === 0 || answers.shippingTiming === 'free'
    if (
      profile.shipping !== null &&
      profile.shipping > 0 &&
      answers.shippingTiming === 'free'
    )
      return {
        ...base,
        key: 'shipping-charge-conflict',
        title: 'Align the delivery policy and cost sheet first',
        summary:
          'The cost sheet has a customer-paid delivery charge, but your answer says customers pay no delivery charge.',
        reason:
          'Those are different offers. Align them before deciding what the customer sees or calculating the order contribution.',
        action:
          'Confirm the actual customer-paid delivery charge and update the cost sheet or answer.',
      }
    if (!shippingIsFree && !answers.shippingTiming)
      return {
        ...base,
        key: 'checkout-observation',
        title: 'What changed after the customer decided to check out?',
        summary: checkoutLoss
          ? 'Some checkout starts did not lead to purchases. Shipping costs, payment errors, and delivery timing are separate possibilities.'
          : 'You chose to investigate checkout. The amount of abandonment and its cause still need evidence.',
        reason:
          'Checkout follows product selection. Asking what costs appear for the first time can narrow the next investigation before you spend more on traffic.',
        question: question(
          'shippingTiming',
          'When does a customer first see the shipping charge?',
          [
            ['checkout', 'For the first time at checkout'],
            ['early', 'On the product or cart page, before checkout'],
            ['free', 'Customers pay no delivery charge'],
            ['unknown', 'I need to check the customer-facing screens'],
          ],
        ),
        hypotheses: [
          'Check unexpected total cost, payment errors, and delivery timing as separate possible explanations.',
        ],
      }
    if (!shippingIsFree && answers.shippingTiming === 'checkout') {
      facts.push(
        profile.shipping === null
          ? 'Your answer: a shipping charge first appears at checkout. Its amount has not been measured.'
          : `Your answer: the ${profile.currency} ${count(profile.shipping)} shipping charge first appears at checkout.`,
      )
      return {
        ...base,
        key: 'shipping-surprise',
        title: 'Check the delivery cost customers discover at checkout',
        summary:
          'The amount expected while choosing a product may differ from the checkout total. This is a hypothesis to test, not proof that shipping caused the abandonment.',
        reason:
          'You can test showing the cost earlier before removing it. This is a small change that protects your margin while investigating unexpected cost.',
        action:
          'Complete an earlier shipping-cost notice and a review plan. Check the cost sheet before offering free shipping.',
        question: answers.shippingMargin
          ? null
          : question(
              'shippingMargin',
              'Do you know what remains from an order after shipping and fees?',
              [
                ['positive', 'Yes, actual costs show a positive contribution'],
                ['unknown', 'I have not completed a cost sheet'],
                ['negative', 'An order currently breaks even or loses money'],
              ],
            ),
        artifact: 'shipping',
        hypotheses: [
          'An unexpected total cost may be related to some abandonment.',
          'Payment errors, delivery time, and payment methods could produce the same pattern.',
        ],
      }
    }
    if (!shippingIsFree && answers.shippingTiming === 'unknown')
      return {
        ...base,
        key: 'inspect-shipping',
        title: 'Walk through the checkout your customer sees',
        summary:
          'The point where shipping is shown is not yet confirmed. There is not enough evidence to recommend free shipping.',
        reason:
          'Reviewing the real screens can separate newly revealed costs from payment errors.',
        action:
          'Use a mobile device to go from product selection to the final checkout screen. Record where shipping cost, delivery time, and any error first appear.',
      }
    if (!answers.paymentIssue)
      return {
        ...base,
        key: 'checkout-check',
        title: 'Next, check that a customer can actually pay',
        summary: shippingIsFree
          ? 'You confirmed that customers pay no delivery charge. Now check payment errors and obstacles in the purchase steps.'
          : 'You said shipping is shown before checkout. Now check payment errors and obstacles in the purchase steps.',
        reason:
          'The same abandonment count can call for a technical fix or a content change. A concrete payment issue helps distinguish them.',
        question: question(
          'paymentIssue',
          'Has a customer report or your own test confirmed a payment issue?',
          [
            ['yes', 'Yes, there is an error or a blocked step'],
            ['no', 'I tested and found no payment issue'],
            ['unknown', 'I have not tested it yet'],
          ],
        ),
        action:
          'Check for an issue and record the device, step, expected behavior, and actual result.',
      }
    if (answers.paymentIssue === 'yes') {
      facts.push(
        'Your answer: a customer report or direct test confirmed a payment issue.',
      )
      return {
        ...base,
        key: 'payment-error',
        title: 'Reproduce and resolve the payment issue you found',
        summary:
          'You reported a payment issue. Its share of all unsuccessful checkouts is still unknown.',
        reason:
          'A confirmed obstacle to purchasing deserves a reproduction and fix check before changing the message or price.',
        action:
          'Complete a checklist with the device, browser, blocked step, expected and actual behavior, and a test after the fix.',
        hypotheses: [
          'The reported payment issue may account for some unsuccessful purchases.',
        ],
      }
    }
    return {
      ...base,
      key: 'checkout-evidence',
      title: 'Separate the remaining reasons for checkout abandonment',
      summary: checkoutLoss
        ? 'Checkout starts without purchases are observed, but these inputs do not establish a specific cause.'
        : 'You chose to investigate checkout, but its abandonment count and cause are not yet established.',
      reason:
        'Payment options, expected delivery, account requirements, and errors require direct screen checks or customer evidence.',
      action:
        'Complete a measurement plan that records a checkout walkthrough and actual customer questions.',
      hypotheses: [
        'Use the actual checkout and customer reports to check delivery timing, payment options, and account requirements.',
      ],
    }
  }
  if (
    answers.focus === 'product' ||
    (metrics.views !== null && metrics.views > 0 && metrics.carts === 0)
  ) {
    const nextQuestion = answers.productClarity
      ? null
      : question(
          'productClarity',
          'What have you actually observed when customers choose a product?',
          [
            ['confused', 'They ask about its use, differences, or options'],
            ['stock', 'Their option is unavailable or delivery is too late'],
            ['unknown', 'I have not checked their reactions yet'],
          ],
        )
    if (answers.productClarity === 'unknown')
      return {
        ...base,
        key: 'product-evidence',
        title: 'Collect the words customers use before rewriting the page',
        summary:
          'You have not yet checked customer reactions. The funnel alone cannot establish that the explanation is the problem.',
        reason:
          'Price, fit, stock, and clarity can all affect the next action. Actual questions make a rewrite more specific.',
        action:
          'Ask a customer to explain the product use, difference, and next step. Record their actual words in the measurement plan.',
      }
    return {
      ...base,
      key:
        answers.productClarity === 'stock'
          ? 'product-availability'
          : 'product-clarity',
      title:
        answers.productClarity === 'stock'
          ? 'Make available options and delivery timing clear'
          : 'Narrow the hesitation at the moment of product choice',
      summary:
        'Start from the observed gap after product views, or the product-selection concern you chose to investigate.',
      reason:
        'Not understanding a product and not being able to buy an available option need different changes. Use the actual customer question to change one part.',
      action: `Complete a product-page revision for ${profile.product || 'your product'} with its customer, use, differences, options, and delivery facts.`,
      artifact: 'product',
      question: nextQuestion,
      hypotheses: [
        answers.productClarity === 'stock'
          ? 'Option availability or expected delivery may affect product choice.'
          : 'Check whether product use, differences, or options are difficult to understand.',
      ],
    }
  }
  return {
    ...base,
    key: 'choose-focus',
    title: 'The funnel is organized. Now narrow the explanation.',
    summary:
      'These counts alone cannot identify the largest business problem or its cause. Choose one situation you have observed.',
    reason:
      'Some drop-off can occur at every stage. We do not treat the largest loss count as proof of its cause; customer reactions and operating facts guide the next step.',
    question: question('focus', 'Which situation do you want to investigate?', [
      ['checkout', 'Customers start checkout but do not purchase'],
      ['product', 'Product views do not turn into product selection'],
      ['traffic', 'I need a route to bring relevant customers'],
      ['cost', 'I do not know whether each order is profitable'],
    ]),
  }
}

/** Shared UI/server adapter: preserve unknown monetary inputs instead of converting them to zero. */
export function diagnoseInput(
  input: FocusedInput,
  profile: BusinessProfile,
): Diagnosis {
  return diagnose(
    {
      name: profile.name,
      product: input.product || profile.offering,
      customer: profile.customerType,
      price: input.costs.price,
      shipping: input.costs.shippingCharged,
      currency: profile.currency,
    },
    input.metrics,
    input.answers,
    input.comparable,
  )
}
