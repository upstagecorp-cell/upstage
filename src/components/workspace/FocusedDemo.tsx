'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { addCalendarDays, getLocalDateKey, isDateKey } from '@/lib/date-time'
import { createProfileDefaults } from '@/lib/business/validation'
import {
  diagnoseInput,
  validateMetrics,
} from '@/lib/business/focused-diagnosis'
import { calculateCosts } from '@/lib/business/focused-artifacts'
import { periodDays } from '@/lib/business/focused-journey'
import type { BusinessProfile, WorkspaceData } from '@/lib/business/types'
import type {
  FocusedInput,
  FocusedIntent,
  FocusedInvestigation,
} from '@/lib/business/focused-types'
import { FocusedEditor } from './FocusedPanel'
import {
  buttonClass,
  ErrorText,
  friendlyError,
  secondaryClass,
  type Mutation,
} from './shared'

const sampleTime = '2026-11-02T15:00:00.000Z'
const profile: BusinessProfile = {
  ...createProfileDefaults('America/New_York'),
  id: 'fictional-shop',
  version: 1,
  name: 'Field & Clay — fictional shop',
  businessType: 'ecommerce',
  stage: 'operating',
  industry: 'Physical home goods',
  offering: 'Handmade ceramic mugs',
  customerType: 'US customers choosing handmade home goods',
  salesChannels: ['US online store'],
  goal: 'conversion',
  updatedAt: sampleTime,
}
const ranks = { draft: 0, diagnosed: 1, artifact: 2, planned: 3, reviewed: 4 }
const stages = {
  draft: 'draft',
  diagnose: 'diagnosed',
  artifact: 'artifact',
  plan: 'planned',
  checkin: 'reviewed',
} as const
const inputKeys = [
  'product',
  'channel',
  'periodStart',
  'periodEnd',
  'source',
  'comparable',
  'metrics',
  'answers',
  'costs',
  'plan',
  'checkin',
] as const

function sample(): FocusedInvestigation {
  return {
    id: 'fictional-investigation',
    profileId: profile.id,
    profileSnapshot: profile,
    revision: 1,
    createdAt: sampleTime,
    updatedAt: sampleTime,
    stage: 'diagnosed',
    product: 'Handmade ceramic mugs',
    channel: 'US online store',
    periodStart: '2026-10-26',
    periodEnd: '2026-11-01',
    source:
      'Invented example report — same product, channel, and unique people',
    comparable: true,
    metrics: {
      visits: 2400,
      views: 1680,
      carts: 144,
      checkouts: 92,
      orders: 23,
      days: 7,
    },
    answers: {},
    costs: {
      price: 48,
      productCost: 18,
      packaging: 1.5,
      fulfillment: 2,
      shippingCost: 7,
      shippingCharged: 6,
      paymentPercent: 2.9,
      paymentFixed: 0.3,
    },
    plan: { change: '', reviewDate: '', successRule: '', guardrail: '' },
    checkin: null,
  }
}
function completedSample(): FocusedInvestigation {
  const value = sample()
  return {
    ...value,
    revision: 5,
    stage: 'reviewed',
    updatedAt: '2026-11-09T15:00:00.000Z',
    answers: { shippingTiming: 'checkout', shippingMargin: 'positive' },
    plan: {
      change:
        'Show “Shipping: USD 6.00 per order” next to the product price and in the cart. Keep the product price and shipping fee unchanged. Verify the actual charge before using this notice.',
      reviewDate: '2026-11-09',
      successRule:
        'Compare checkout completion over two matching seven-day periods. Treat the direction as exploratory and collect more observations before making a decision.',
      guardrail:
        'Keep product price and shipping charge fixed. Record promotions, traffic changes, and any inaccurate delivery statement.',
    },
    checkin: {
      periodStart: '2026-11-02',
      periodEnd: '2026-11-08',
      source: 'Invented follow-up report — no real customer measurements',
      comparable: true,
      metrics: {
        visits: 2500,
        views: 1700,
        carts: 150,
        checkouts: 100,
        orders: 30,
        days: 7,
      },
      changed:
        'Fictional scenario: no reported price or promotion change. Other influences are not controlled.',
      notes:
        'Keep collecting observations. This invented before-and-after comparison does not establish that the delivery notice caused a change.',
    },
  }
}
function workspace(item: FocusedInvestigation): WorkspaceData {
  return {
    profile,
    evidence: [],
    assessments: [],
    jobs: [],
    assets: [],
    executions: [],
    results: [],
    usage: [],
    legacyImport: null,
    generationAvailable: false,
    weeklyPlans: [],
    investigations: [item],
  }
}
function workProductSnapshot(input: FocusedInput): string {
  return JSON.stringify(
    inputKeys
      .filter((key) => key !== 'checkin' && key !== 'plan')
      .map((key) => input[key])
      .concat(input.plan.change),
  )
}

function snapshot(input: FocusedInput): string {
  return JSON.stringify(
    inputKeys.filter((key) => key !== 'checkin').map((key) => input[key]),
  )
}

/** A page-local simulation: no API, account, localStorage, or telemetry calls. */
export function FocusedDemo() {
  const [investigation, setInvestigation] =
    useState<FocusedInvestigation>(sample)
  const [reset, setReset] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function replace(item: FocusedInvestigation) {
    setInvestigation(item)
    setReset((value) => value + 1)
    setError('')
    setNotice('')
  }
  const mutate: Mutation = async (_path, _method, raw) => {
    setError('')
    setBusy(true)
    try {
      if (
        !raw ||
        typeof raw !== 'object' ||
        !('input' in raw) ||
        !('intent' in raw)
      )
        throw new Error('Choose a valid example action.')
      const body = raw as {
        input: FocusedInput
        intent: FocusedIntent
        revision?: number
      }
      const input = structuredClone(
        Object.fromEntries(inputKeys.map((key) => [key, body.input[key]])),
      ) as unknown as FocusedInput
      const intent = body.intent
      if (!(intent in stages) || body.revision !== investigation.revision)
        throw new Error('Reset the fictional example before continuing.')
      if (input.comparable) {
        const errors = validateMetrics(input.metrics)
        if (errors.length) throw new Error(errors.join(' '))
      }
      if (periodDays(input.periodStart, input.periodEnd) !== input.metrics.days)
        throw new Error(
          'Use valid reporting dates and their matching duration.',
        )
      if (
        intent !== 'draft' &&
        (!input.product.trim() || !input.channel.trim() || !input.source.trim())
      )
        throw new Error(
          'Complete the product, channel, and source for this example.',
        )
      const diagnosis = diagnoseInput(input, profile)
      if (intent === 'artifact' || intent === 'plan') {
        if (diagnosis.question)
          throw new Error(
            'Answer the next question before completing this work product.',
          )
        if (!input.plan.change.trim())
          throw new Error(
            'Complete the concrete change or measurement setup first.',
          )
        if (
          diagnosis.artifact === 'cost' &&
          !calculateCosts(input.costs, profile.currency).complete
        )
          throw new Error('Complete the cost worksheet first.')
      }
      if (
        ranks[investigation.stage] >= ranks.planned &&
        snapshot(input) !== snapshot(investigation)
      )
        throw new Error(
          'The fictional baseline and plan are preserved. Reset the example to change them.',
        )
      if (intent === 'plan') {
        if (ranks[investigation.stage] < ranks.artifact)
          throw new Error(
            'Complete the work product before planning the experiment.',
          )
        if (
          !isDateKey(input.plan.reviewDate) ||
          input.plan.reviewDate <
            getLocalDateKey(new Date(), profile.timeZone) ||
          input.plan.reviewDate <= input.periodEnd ||
          !input.plan.successRule.trim() ||
          !input.plan.guardrail.trim()
        )
          throw new Error(
            'Choose a review date and complete the decision rule and guardrail.',
          )
      }
      if (intent === 'checkin') {
        const checkin = input.checkin
        if (
          ranks[investigation.stage] < ranks.planned ||
          !checkin ||
          !checkin.source.trim() ||
          !checkin.changed.trim() ||
          !checkin.notes.trim()
        )
          throw new Error(
            'Complete the experiment and follow-up observations first.',
          )
        if (investigation.stage === 'reviewed')
          throw new Error(
            'This fictional completed review is preserved. Reset to explore a different case.',
          )
        if (
          periodDays(checkin.periodStart, checkin.periodEnd) !==
            checkin.metrics.days ||
          checkin.periodStart < addCalendarDays(input.periodEnd, 1)
        )
          throw new Error('Use a valid follow-up period after the baseline.')
        if (
          checkin.comparable &&
          (checkin.metrics.days !== input.metrics.days ||
            !input.comparable ||
            validateMetrics(checkin.metrics).length)
        )
          throw new Error(
            'Comparisons need matching durations and comparable funnel definitions.',
          )
      }
      const nextStage = stages[intent]
      const coreChanged =
        workProductSnapshot(input) !== workProductSnapshot(investigation)
      if (
        intent === 'plan' &&
        investigation.stage === 'artifact' &&
        coreChanged
      )
        throw new Error(
          'Complete and save the changed work product again before planning the experiment.',
        )
      let stage =
        ranks[investigation.stage] > ranks[nextStage]
          ? investigation.stage
          : nextStage
      if (
        investigation.stage === 'artifact' &&
        coreChanged &&
        (intent === 'draft' || intent === 'diagnose')
      )
        stage = 'diagnosed'
      const item: FocusedInvestigation = {
        ...input,
        id: investigation.id,
        profileId: profile.id,
        profileSnapshot: profile,
        revision: investigation.revision + 1,
        createdAt: investigation.createdAt,
        updatedAt: new Date().toISOString(),
        stage,
      }
      setInvestigation(item)
      setNotice(
        'Example updated in this page only. Nothing was saved to an account or counted as a customer result.',
      )
      return workspace(item)
    } catch (failure) {
      setError(friendlyError(failure))
      return null
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">
          Explore the focused workflow
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          From checkout friction to a finished experiment
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 opacity-70">
          Try the same follow-up questions and workbench used in the online-shop
          workflow. Start with the delivery question, or inspect an invented
          completed review.
        </p>
      </header>
      <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <strong>
          Fictional online-shop example — not your business diagnosis.
        </strong>
        <p>
          All numbers are invented. Changes stay in this page; reloading resets
          them.
        </p>
        <p>
          No account is created, no provider is called, and no product events or
          business results are recorded. Your own account starts without these
          sample numbers.
        </p>
      </aside>
      <div className="flex flex-wrap gap-3">
        <button
          className={secondaryClass}
          disabled={busy}
          onClick={() => replace(sample())}
        >
          <RotateCcw size={15} aria-hidden="true" />
          Reset fictional example
        </button>
        <button
          className={secondaryClass}
          disabled={busy}
          onClick={() => replace(completedSample())}
        >
          Inspect a fictional completed review
        </button>
        <Link className={buttonClass} href="/register">
          Start with my own business <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <div aria-live="polite" className="space-y-3">
        <ErrorText error={error} />
        {notice && (
          <p
            role="status"
            className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100"
          >
            {notice}
          </p>
        )}
      </div>
      <FocusedEditor
        key={`${reset}:${investigation.id}`}
        profile={profile}
        saved={investigation}
        mutate={mutate}
        busy={busy}
        onSaved={() => {}}
      />
    </div>
  )
}
