'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FlaskConical,
  CalendarDays,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { BusinessProfile, WorkspaceData } from '@/lib/business/types'
import type {
  FocusedInput,
  FocusedInvestigation,
  FocusedMetrics,
  FocusedIntent,
  FocusedFeedback,
  ProductEvent,
} from '@/lib/business/focused-types'
import {
  diagnoseInput,
  validateMetrics,
} from '@/lib/business/focused-diagnosis'
import {
  buildExperimentMarkdown,
  buildSuggestedChange,
  calculateCosts,
  makeCostCsv,
} from '@/lib/business/focused-artifacts'
import {
  emptyMetrics,
  funnelFields,
  newInvestigation,
  nextMove,
  periodDays,
  reviewFunnel,
} from '@/lib/business/focused-journey'
import { addCalendarDays, getLocalDateKey } from '@/lib/date-time'
import { CostWorkbench } from './CostWorkbench'
import {
  buttonClass,
  secondaryClass,
  fieldClass,
  Card,
  Field,
  DateInput,
  Empty,
  ErrorText,
  requestJson,
  friendlyError,
  downloadJson,
  type Mutation,
} from './shared'

export function FocusedPanel({
  data,
  mutate,
  busy,
  openProfile,
}: {
  data: WorkspaceData
  mutate: Mutation
  busy: boolean
  openProfile: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [fresh, setFresh] = useState(false)
  const items = data.investigations ?? []
  const current = fresh
    ? null
    : (items.find((item) => item.id === selected) ?? items.at(-1) ?? null)
  const tracked = useRef(false)
  useEffect(() => {
    if (
      tracked.current ||
      !data.profile ||
      (data.profile.businessType !== 'ecommerce' && !current)
    )
      return
    tracked.current = true
    void requestJson('/api/product-events', {
      method: 'POST',
      body: JSON.stringify({ type: 'flow_opened' }),
    }).catch(() => {})
    if (
      current &&
      getLocalDateKey(new Date(), current.profileSnapshot.timeZone) >
        getLocalDateKey(
          new Date(current.updatedAt),
          current.profileSnapshot.timeZone,
        )
    ) {
      void requestJson('/api/product-events', {
        method: 'POST',
        body: JSON.stringify({
          type: 'return_visit',
          investigationId: current.id,
        }),
      }).catch(() => {})
    }
  }, [current, data.profile])
  if (!data.profile) return null
  if (data.profile.businessType !== 'ecommerce' && !current)
    return (
      <Card
        title="One problem, a deeper answer"
        description="The first focused workflow is for online shops selling physical products. It follows visitors through checkout, checks delivery costs, and finishes an experiment plan."
      >
        <Empty>
          Your current business profile uses a different business type. Your
          existing assessment, guides, and plans are still available.
        </Empty>
        <button className={`${secondaryClass} mt-4`} onClick={openProfile}>
          Review business type
        </button>
      </Card>
    )
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-700 dark:text-violet-300">
            Focused workflow · Online shops
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Find the friction. Finish the next move.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 opacity-65">
            One product, one funnel, one useful change. Your answers decide what
            we investigate next.
          </p>
        </div>
        <button
          className={secondaryClass}
          disabled={busy}
          onClick={() => {
            setFresh(true)
            setSelected(null)
          }}
        >
          <Sparkles size={15} aria-hidden="true" />
          New investigation
        </button>
      </div>
      {items.length > 0 && (
        <Field label="Saved investigations">
          <select
            className={fieldClass}
            value={current?.id ?? ''}
            onChange={(e) => {
              setSelected(e.target.value)
              setFresh(false)
            }}
          >
            <option value="" disabled>
              New investigation
            </option>
            {[...items].reverse().map((item) => (
              <option key={item.id} value={item.id}>
                {item.product.slice(0, 65)} · {item.periodStart} · {item.stage}
              </option>
            ))}
          </select>
        </Field>
      )}
      {current && (
        <section
          className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950/30"
          aria-label="Your next step"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            {current.stage === 'reviewed'
              ? 'Your latest review'
              : 'Pick up where you left off'}
          </p>
          <p className="mt-2 text-lg font-semibold">{nextMove(current)}</p>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs opacity-60">Last confirmed</p>
              <p className="mt-1">
                {current.answers.shippingTiming === 'checkout'
                  ? 'You reported that delivery charges first appear at checkout.'
                  : `${Object.keys(current.answers).length} follow-up answers saved · ${current.stage}`}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-60">The change you prepared</p>
              <p className="mt-1">
                {current.plan.change ||
                  'A concrete change is the next thing to finish.'}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-60">Next review</p>
              <p className="mt-1">
                {current.plan.reviewDate ||
                  'Choose a date after completing your work product.'}{' '}
                · {current.profileSnapshot.timeZone}
              </p>
            </div>
          </div>
        </section>
      )}
      <FocusedEditor
        key={current?.id ?? 'new'}
        profile={current?.profileSnapshot ?? data.profile}
        saved={current}
        mutate={mutate}
        busy={busy}
        onSaved={(id) => {
          setSelected(id)
          setFresh(false)
        }}
      />
      <LearningPanel investigation={current} busy={busy} />
    </div>
  )
}

export function FocusedEditor({
  profile,
  saved,
  mutate,
  busy,
  onSaved,
}: {
  profile: BusinessProfile
  saved: FocusedInvestigation | null
  mutate: Mutation
  busy: boolean
  onSaved: (id: string) => void
}) {
  const [input, setInput] = useState<FocusedInput>(
    () => saved ?? newInvestigation(profile),
  )
  const [step, setStep] = useState(
    saved?.stage === 'planned' || saved?.stage === 'reviewed'
      ? 3
      : saved?.stage === 'artifact'
        ? 2
        : saved?.stage === 'diagnosed'
          ? 1
          : 0,
  )
  const [error, setError] = useState('')
  const [baseRevision, setBaseRevision] = useState(saved?.revision)
  const [answer, setAnswer] = useState('')
  const locked = saved?.stage === 'planned' || saved?.stage === 'reviewed'
  const diagnosis = diagnoseInput(input, profile)
  const today = getLocalDateKey(new Date(), profile.timeZone)
  const change = (patch: Partial<FocusedInput>) =>
    setInput((previous) => ({ ...previous, ...patch }))
  const setPeriod = (key: 'periodStart' | 'periodEnd', value: string) =>
    setInput((previous) => {
      const next = { ...previous, [key]: value }
      next.metrics = {
        ...previous.metrics,
        days: periodDays(next.periodStart, next.periodEnd),
      }
      return next
    })
  async function save(intent: FocusedIntent, next = input, nextStep = step) {
    setError('')
    if (saved && baseRevision !== saved.revision) {
      setError(
        'A newer saved version is available. Reload the saved version below before editing.',
      )
      return
    }
    if (intent !== 'draft' && next.comparable) {
      const errors = validateMetrics(next.metrics)
      if (errors.length) {
        setError(errors.join(' '))
        return
      }
    }
    const result = await mutate(
      saved ? `/api/investigations/${saved.id}` : '/api/investigations',
      saved ? 'PUT' : 'POST',
      { input: next, intent, ...(saved ? { revision: baseRevision } : {}) },
      intent === 'draft'
        ? 'Progress saved. Unknown values stay unknown.'
        : intent === 'diagnose'
          ? 'Your baseline and answers are saved.'
          : intent === 'artifact'
            ? 'Your work product is complete and saved.'
            : intent === 'plan'
              ? 'Experiment saved. Your baseline is now preserved for review.'
              : 'Review saved with your original baseline intact.',
    )
    if (result) {
      const item = saved
        ? result.investigations?.find((i) => i.id === saved.id)
        : result.investigations?.at(-1)
      if (item) {
        setInput(item)
        setBaseRevision(item.revision)
        setStep(nextStep)
        onSaved(item.id)
      }
    }
  }
  const steps = [
    'Your funnel',
    'Narrow it down',
    'Finish a task',
    'Review the result',
  ]
  return (
    <div className="space-y-5">
      <ol
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Investigation progress"
      >
        {steps.map((name, index) => (
          <li key={name}>
            <button
              type="button"
              aria-current={step === index ? 'step' : undefined}
              disabled={
                (index > 0 && !saved) ||
                (index > 1 && (!saved || saved.stage === 'draft')) ||
                (index === 3 && !locked) ||
                (index === 2 && Boolean(diagnosis.question) && !locked)
              }
              onClick={() => setStep(index)}
              className={`flex w-full items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold disabled:opacity-40 ${step === index ? 'border-violet-400 bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-100' : 'border-[var(--border)]'}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${step === index ? 'bg-violet-700 text-white' : 'bg-[var(--surface)]'}`}
              >
                {index + 1}
              </span>
              {name}
            </button>
          </li>
        ))}
      </ol>
      <ErrorText error={error} />
      {saved && baseRevision !== saved.revision && (
        <div className="rounded-xl border border-amber-300 p-4 text-sm">
          <p>
            A newer version was loaded from your account. Your local edits have
            not overwritten it.
          </p>
          <button
            className={`${secondaryClass} mt-3`}
            onClick={() => {
              setInput(saved)
              setBaseRevision(saved.revision)
              setError('')
            }}
          >
            Discard local edits and reload saved version
          </button>
        </div>
      )}
      {step === 0 && (
        <Card
          title="What happens between a visit and a purchase?"
          description="Use one product, channel, reporting period, and unique-person funnel. Leave anything you have not measured blank; enter 0 only for a measured zero."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void save('diagnose', input, 1)
            }}
            className="space-y-5"
          >
            <fieldset disabled={busy || locked} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product or product group">
                  <input
                    required
                    maxLength={1000}
                    className={fieldClass}
                    value={input.product}
                    onChange={(e) => change({ product: e.target.value })}
                    placeholder="e.g. handmade ceramic mugs"
                  />
                </Field>
                <Field label="Sales channel">
                  <input
                    required
                    maxLength={200}
                    className={fieldClass}
                    value={input.channel}
                    onChange={(e) => change({ channel: e.target.value })}
                    placeholder="e.g. US online store"
                  />
                </Field>
                <Field label="Baseline start">
                  <DateInput
                    value={input.periodStart}
                    onChange={(value) => setPeriod('periodStart', value)}
                    max={today}
                  />
                </Field>
                <Field label="Baseline end (inclusive)">
                  <DateInput
                    value={input.periodEnd}
                    onChange={(value) => setPeriod('periodEnd', value)}
                    min={input.periodStart}
                    max={today}
                  />
                </Field>
              </div>
              <Field
                label="Where did these counts come from?"
                hint="Record the report and filter, so you can reproduce this view at your next visit."
              >
                <input
                  required
                  maxLength={1000}
                  className={fieldClass}
                  value={input.source}
                  onChange={(e) => change({ source: e.target.value })}
                  placeholder="Store analytics · same product, channel, dates, and unique people"
                />
              </Field>
              <FunnelInputs
                value={input.metrics}
                onChange={(metrics) => change({ metrics })}
              />
              <label className="flex items-start gap-3 rounded-xl bg-[var(--background)] p-4 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={input.comparable}
                  onChange={(e) => change({ comparable: e.target.checked })}
                  className="mt-1 size-4 shrink-0 accent-violet-700"
                />
                <span>
                  These are nested counts of unique people in the same channel
                  and period, using the same tracking definitions. If I cannot
                  confirm this, start with a measurement plan.
                </span>
              </label>
            </fieldset>
            {locked ? (
              <p className="text-sm opacity-65">
                This baseline was saved before the experiment. Start a new
                investigation to use different baseline data.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={buttonClass} disabled={busy}>
                  Find the next question{' '}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={secondaryClass}
                  disabled={busy}
                  onClick={() => void save('draft')}
                >
                  Save and finish later
                </button>
              </div>
            )}
          </form>
        </Card>
      )}
      {step === 1 && (
        <>
          <Card title={diagnosis.title} description={diagnosis.summary}>
            <div className="grid gap-7 lg:grid-cols-[1fr_1fr]">
              <FunnelChart
                metrics={input.metrics}
                comparable={input.comparable}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  Why this comes first
                </p>
                <p className="mt-3 text-sm leading-7">{diagnosis.reason}</p>
                <p className="mt-4 rounded-xl border border-[var(--border)] p-3 text-xs leading-6">
                  {diagnosis.confidence}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <EvidenceNotes
                title="What your records say"
                items={diagnosis.facts}
              />
              <EvidenceNotes
                title="What we still need to check"
                items={[...diagnosis.hypotheses, ...diagnosis.missing]}
              />
            </div>
          </Card>
          {diagnosis.question && !locked ? (
            <Card
              title={diagnosis.question.title}
              description="Your answer changes the next question or the task we prepare."
            >
              <fieldset disabled={busy} className="space-y-3">
                <legend className="sr-only">{diagnosis.question.title}</legend>
                {diagnosis.question.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${answer === option.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' : 'border-[var(--border)]'}`}
                  >
                    <input
                      type="radio"
                      name={diagnosis.question!.key}
                      value={option.value}
                      checked={answer === option.value}
                      onChange={() => setAnswer(option.value)}
                      className="mt-0.5 size-4 shrink-0 accent-violet-700"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
              <button
                className={`${buttonClass} mt-5`}
                disabled={busy || !answer}
                onClick={() => {
                  const next = {
                    ...input,
                    answers: {
                      ...input.answers,
                      [diagnosis.question!.key]: answer,
                    },
                  }
                  setAnswer('')
                  void save('diagnose', next, 1)
                }}
              >
                Use this answer <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Card>
          ) : (
            <Card title="Your next useful task" description={diagnosis.action}>
              <button className={buttonClass} onClick={() => setStep(2)}>
                Open the workbench <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Card>
          )}
          {Object.keys(input.answers).length > 0 && !locked && (
            <button
              className={secondaryClass}
              disabled={busy}
              onClick={() => {
                setAnswer('')
                void save('diagnose', { ...input, answers: {} }, 1)
              }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Revisit my answers
            </button>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <Card
            title="Turn the diagnosis into a finished change"
            description={`${diagnosis.action} Save a specific revision or measurement setup, then set up a small experiment.`}
          >
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-7 text-violet-950 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
              <p className="font-semibold">{input.product}</p>
              <p>{diagnosis.reason}</p>
            </div>
            <div className="mt-5 space-y-4">
              {!locked && (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-4">
                  <p className="text-sm leading-6 opacity-65">
                    Build a starting draft from your saved product, customer,
                    and measured costs. Review and edit it before marking the
                    work complete.
                  </p>
                  <button
                    className={`${secondaryClass} mt-3`}
                    disabled={
                      busy ||
                      !buildSuggestedChange(input, profile, diagnosis.artifact)
                    }
                    onClick={() => {
                      const suggestion = buildSuggestedChange(
                        input,
                        profile,
                        diagnosis.artifact,
                      )
                      if (suggestion)
                        change({ plan: { ...input.plan, change: suggestion } })
                    }}
                  >
                    <Sparkles size={15} aria-hidden="true" />
                    Use my details to build the work product
                  </button>
                  {!buildSuggestedChange(
                    input,
                    profile,
                    diagnosis.artifact,
                  ) && (
                    <p className="mt-2 text-xs opacity-65">
                      Complete the relevant costs below to build a draft from
                      actual amounts.
                    </p>
                  )}
                </div>
              )}
              <Field
                label="The actual change or measurement setup"
                hint={
                  diagnosis.artifact === 'shipping'
                    ? 'Write the exact delivery text and where it will appear. Example: “Delivery is $6. Arrives in 3–5 business days.” Place it beside the product price. Verify every promise.'
                    : diagnosis.artifact === 'measurement'
                      ? 'Write the events, unique-person definition, filters, report owner, and collection period you will set up.'
                      : 'Write the exact revision, operating procedure, or test setup you can use. Include where it will appear and what stays the same.'
                }
              >
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  readOnly={locked}
                  className={fieldClass}
                  value={input.plan.change}
                  onChange={(e) =>
                    change({ plan: { ...input.plan, change: e.target.value } })
                  }
                  placeholder="Write the finished revision here, including the details you verified."
                />
              </Field>
              {!locked && (
                <button
                  className={secondaryClass}
                  disabled={
                    busy ||
                    !input.plan.change.trim() ||
                    Boolean(diagnosis.question) ||
                    (diagnosis.artifact === 'cost' &&
                      !calculateCosts(input.costs, profile.currency).complete)
                  }
                  onClick={() => void save('artifact', input, 2)}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Complete and save this work product
                </button>
              )}
              {saved &&
                saved.stage !== 'draft' &&
                saved.stage !== 'diagnosed' && (
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    Your work product is saved. You can now prepare the
                    experiment below.
                  </p>
                )}
            </div>
          </Card>
          <details
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
            open={
              diagnosis.artifact === 'shipping' || diagnosis.artifact === 'cost'
            }
          >
            <summary className="cursor-pointer text-sm font-semibold">
              Unit cost worksheet · check the economics before changing delivery
              or price
            </summary>
            <div className="mt-5">
              <CostWorkbench
                value={input.costs}
                currency={profile.currency}
                onChange={(costs) => change({ costs })}
                readOnly={Boolean(locked || busy)}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className={secondaryClass}
                  disabled={
                    !calculateCosts(input.costs, profile.currency).complete
                  }
                  onClick={() => {
                    try {
                      const csv = makeCostCsv(input.costs, profile.currency)
                      if (csv)
                        downloadText(csv, 'nexora-unit-costs.csv', 'text/csv')
                    } catch (failure) {
                      setError(friendlyError(failure))
                    }
                  }}
                >
                  <Download size={15} aria-hidden="true" />
                  Download cost worksheet
                </button>
                {!locked && (
                  <button
                    className={secondaryClass}
                    disabled={busy}
                    onClick={() => void save('diagnose', input, 2)}
                  >
                    Save worksheet progress
                  </button>
                )}
              </div>
              {!locked &&
                diagnosis.artifact === 'cost' &&
                calculateCosts(input.costs, profile.currency).complete && (
                  <button
                    className={`${buttonClass} mt-4`}
                    disabled={busy}
                    onClick={() => {
                      const suggestion = buildSuggestedChange(
                        input,
                        profile,
                        'cost',
                      )
                      if (suggestion) {
                        const next = {
                          ...input,
                          plan: { ...input.plan, change: suggestion },
                        }
                        change({ plan: next.plan })
                        void save('artifact', next, 2)
                      }
                    }}
                  >
                    Complete and save my cost worksheet{' '}
                    <CheckCircle2 size={15} aria-hidden="true" />
                  </button>
                )}
            </div>
          </details>
          <Card
            title="Decide how you will learn from the change"
            description="Prepare one change, one review date, and a decision rule. Saving a plan does not mean it was deployed or caused a sale."
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void save('plan', input, 3)
              }}
              className="space-y-4"
            >
              <fieldset
                disabled={Boolean(locked || busy)}
                className="space-y-4"
              >
                <Field
                  label="Review date"
                  hint={`Saved in ${profile.timeZone}. Choose time to collect a comparable period.`}
                >
                  <DateInput
                    value={input.plan.reviewDate}
                    min={today}
                    onChange={(reviewDate) =>
                      change({ plan: { ...input.plan, reviewDate } })
                    }
                  />
                </Field>
                <Field
                  label="What result will guide your next decision?"
                  hint="Use your own baseline and business constraints. Small samples cannot establish a reliable effect."
                >
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    className={fieldClass}
                    value={input.plan.successRule}
                    onChange={(e) =>
                      change({
                        plan: { ...input.plan, successRule: e.target.value },
                      })
                    }
                    placeholder="Compare checkout completion over two matching periods. Keep the change only if the observed direction and customer feedback support it; extend measurement if counts are small."
                  />
                </Field>
                <Field
                  label="What will stay fixed, and when would you stop?"
                  hint="Record price, promotion, ad spend, delivery promises, contribution limits, and other changes."
                >
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    className={fieldClass}
                    value={input.plan.guardrail}
                    onChange={(e) =>
                      change({
                        plan: { ...input.plan, guardrail: e.target.value },
                      })
                    }
                    placeholder="Keep product price and delivery fee unchanged. Stop if the delivery promise cannot be met. Record any traffic or promotion changes."
                  />
                </Field>
              </fieldset>
              <div className="flex flex-wrap gap-3">
                {!locked && (
                  <button
                    type="submit"
                    className={buttonClass}
                    disabled={busy || saved?.stage !== 'artifact'}
                  >
                    <CalendarDays size={16} aria-hidden="true" />
                    Save experiment and review date
                  </button>
                )}
                {saved && (
                  <button
                    type="button"
                    className={secondaryClass}
                    disabled={
                      !['artifact', 'planned', 'reviewed'].includes(saved.stage)
                    }
                    onClick={() =>
                      downloadText(
                        buildExperimentMarkdown(saved),
                        'nexora-experiment-plan.md',
                        'text/markdown',
                      )
                    }
                  >
                    <Download size={15} aria-hidden="true" />
                    Download saved work product
                  </button>
                )}
              </div>
              {saved?.stage !== 'artifact' && !locked && (
                <p className="text-xs opacity-65">
                  Complete and save your work product above before starting the
                  experiment.
                </p>
              )}
            </form>
          </Card>
        </>
      )}
      {step === 3 && saved && (
        <ReviewPanel
          item={saved}
          input={input}
          onChange={change}
          busy={busy}
          save={() => void save('checkin', input, 3)}
        />
      )}
    </div>
  )
}

function FunnelInputs({
  value,
  onChange,
}: {
  value: FocusedMetrics
  onChange: (value: FocusedMetrics) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {funnelFields.map(([key, label]) => (
        <Field key={key} label={label}>
          <input
            className={`${fieldClass} tabular-nums`}
            type="number"
            min={0}
            max={Number.MAX_SAFE_INTEGER}
            step={1}
            value={value[key] ?? ''}
            placeholder="Unknown"
            onChange={(e) =>
              onChange({
                ...value,
                [key]: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </Field>
      ))}
    </div>
  )
}
function FunnelChart({
  metrics,
  comparable,
}: {
  metrics: FocusedMetrics
  comparable: boolean
}) {
  const max = Math.max(1, ...funnelFields.map(([key]) => metrics[key] ?? 0))
  return (
    <figure>
      <figcaption className="mb-4 text-xs font-medium opacity-65">
        Your reported funnel · {metrics.days} days
        {!comparable ? ' · definitions unconfirmed' : ''}
      </figcaption>
      <div className="space-y-3">
        {funnelFields.map(([key, label]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between gap-3 text-xs">
              <span>{label}</span>
              <strong className="tabular-nums">
                {metrics[key] === null
                  ? 'Not measured'
                  : metrics[key].toLocaleString('en-US')}
              </strong>
            </div>
            <div className="h-2 rounded-full bg-violet-100 dark:bg-violet-950">
              {comparable && (
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{
                    width: `${metrics[key] === null ? 0 : (metrics[key] / max) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 opacity-55">
        {comparable
          ? 'A drop between steps helps choose a question. It does not establish the cause or an industry ranking.'
          : 'Counts are listed individually. Relative bars and rates stay hidden until the definitions and populations match.'}
      </p>
    </figure>
  )
}
function EvidenceNotes({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider opacity-65">
        {title}
      </h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {items.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm opacity-65">
          No additional statement is supported yet.
        </p>
      )}
    </div>
  )
}
function downloadText(value: string, name: string, type: string) {
  const url = URL.createObjectURL(
    new Blob([value.startsWith('\ufeff') ? value : '\ufeff' + value], {
      type: `${type};charset=utf-8`,
    }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function ReviewPanel({
  item,
  input,
  onChange,
  busy,
  save,
}: {
  item: FocusedInvestigation
  input: FocusedInput
  onChange: (patch: Partial<FocusedInput>) => void
  busy: boolean
  save: () => void
}) {
  const checkin = input.checkin ?? {
    periodStart: getLocalDateKey(
      new Date(item.updatedAt),
      item.profileSnapshot.timeZone,
    ),
    periodEnd: addCalendarDays(
      getLocalDateKey(new Date(item.updatedAt), item.profileSnapshot.timeZone),
      item.metrics.days - 1,
    ),
    source: '',
    comparable: false,
    metrics: emptyMetrics(item.metrics.days),
    changed: '',
    notes: '',
  }
  const review = reviewFunnel(item)
  const edit = item.stage !== 'reviewed'
  const update = (patch: Partial<typeof checkin>) => {
    const next = { ...checkin, ...patch }
    next.metrics = {
      ...next.metrics,
      days: periodDays(next.periodStart, next.periodEnd),
    }
    onChange({ checkin: next })
  }
  return (
    <Card
      title="What changed since last time?"
      description={`Baseline: ${item.periodStart} to ${item.periodEnd} · ${item.source}. Your planned change: ${item.plan.change}`}
    >
      {item.checkin && (
        <section className="mb-6 rounded-xl bg-violet-50 p-5 text-violet-950 dark:bg-violet-950/30 dark:text-violet-100">
          <h3 className="font-semibold">
            {review.available
              ? 'Your reported checkout completion'
              : 'Comparison needs more evidence'}
          </h3>
          <p className="mt-2 text-sm leading-6">{review.reason}</p>
          {review.available && (
            <p className="mt-4 text-2xl font-semibold tabular-nums">
              {review.before!.toFixed(1)}%{' '}
              <ArrowRight size={18} className="inline" aria-hidden="true" />{' '}
              {review.after!.toFixed(1)}%{' '}
              <span className="text-sm font-normal">
                ({review.changePoints! >= 0 ? '+' : ''}
                {review.changePoints!.toFixed(1)} percentage points)
              </span>
            </p>
          )}
          {review.notes.map((note) => (
            <p key={note} className="mt-3 text-xs leading-6 opacity-75">
              {note}
            </p>
          ))}
          <p className="mt-4 text-sm">
            <strong>Your next decision:</strong> {item.checkin.notes}
          </p>
          <p className="mt-3 text-xs opacity-65">
            This completed review is preserved. Start a new investigation for
            your next experiment.
          </p>
        </section>
      )}
      {edit && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!input.checkin) {
              update({})
              return
            }
            save()
          }}
          className="space-y-5"
        >
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Follow-up start">
                <DateInput
                  value={checkin.periodStart}
                  min={addCalendarDays(item.periodEnd, 1)}
                  onChange={(periodStart) => update({ periodStart })}
                />
              </Field>
              <Field label="Follow-up end (inclusive)">
                <DateInput
                  value={checkin.periodEnd}
                  min={checkin.periodStart}
                  max={getLocalDateKey(
                    new Date(),
                    item.profileSnapshot.timeZone,
                  )}
                  onChange={(periodEnd) => update({ periodEnd })}
                />
              </Field>
            </div>
            <Field label="Follow-up report and filters">
              <input
                required
                className={fieldClass}
                value={checkin.source}
                onChange={(e) => update({ source: e.target.value })}
              />
            </Field>
            <FunnelInputs
              value={checkin.metrics}
              onChange={(metrics) => update({ metrics })}
            />
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-violet-700"
                checked={checkin.comparable}
                onChange={(e) => update({ comparable: e.target.checked })}
              />
              <span>
                I checked that the channel, unique-person definitions, and
                tracking match the baseline. Leave unchecked to save an
                observation without a rate comparison.
              </span>
            </label>
            <Field
              label="Other changes during this period"
              hint="Include price, promotions, ad spend, traffic mix, stock issues, or write that none were reported."
            >
              <textarea
                required
                rows={2}
                className={fieldClass}
                value={checkin.changed}
                onChange={(e) => update({ changed: e.target.value })}
              />
            </Field>
            <Field
              label="What did you learn, and what will you do next?"
              hint="Choose whether to keep, revise, or measure longer. This records your decision; it does not claim a causal effect."
            >
              <textarea
                required
                rows={3}
                className={fieldClass}
                value={checkin.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </Field>
          </fieldset>
          <button className={buttonClass} disabled={busy}>
            <CheckCircle2 size={16} aria-hidden="true" />
            Save review and next decision
          </button>
        </form>
      )}
    </Card>
  )
}

function LearningPanel({
  investigation,
  busy,
}: {
  investigation: FocusedInvestigation | null
  busy: boolean
}) {
  const [events, setEvents] = useState<ProductEvent[]>([])
  const [feedback, setFeedback] = useState<FocusedFeedback[]>([])
  const [rating, setRating] = useState<FocusedFeedback['rating']>('useful')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    void requestJson<{ events: ProductEvent[]; feedback: FocusedFeedback[] }>(
      '/api/product-events',
    )
      .then((result) => {
        if (active) {
          setEvents(result.events)
          setFeedback(result.feedback ?? [])
        }
      })
      .catch((failure) => {
        if (active) setError(friendlyError(failure))
      })
    return () => {
      active = false
    }
  }, [investigation?.revision, investigation?.id])
  async function send() {
    if (!investigation || pending) return
    setPending(true)
    setError('')
    try {
      const result = await requestJson<{ feedback: FocusedFeedback }>(
        '/api/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            investigationId: investigation.id,
            rating,
            note,
          }),
        },
      )
      setFeedback((previous) => [...previous, result.feedback])
      setStatus(
        'Feedback saved. This helps us check usefulness; it is not counted as a business outcome.',
      )
      setNote('')
    } catch (failure) {
      setError(friendlyError(failure))
    } finally {
      setPending(false)
    }
  }
  return (
    <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <summary className="cursor-pointer text-sm font-semibold">
        <FlaskConical size={16} className="mr-2 inline" aria-hidden="true" />
        Help us test whether this experience is useful
      </summary>
      <div className="mt-5 space-y-5">
        <p className="text-sm leading-6 opacity-65">
          We record the steps you complete and ask what helped. These are your
          account records. They do not establish product effectiveness or
          customer retention.
        </p>
        <ErrorText error={error} />
        <button
          type="button"
          className={secondaryClass}
          onClick={() =>
            downloadJson(
              {
                exportedAt: new Date().toISOString(),
                scope:
                  'Current account only; up to 500 recent events and feedback entries. Plan save is not actual use.',
                events,
                feedback,
              },
              'nexora-product-feedback.json',
            )
          }
        >
          <Download size={15} aria-hidden="true" />
          Export my recent product feedback records
        </button>
        <p className="text-xs opacity-55">
          Counts below use up to 500 recent event records from your account.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Directions saved', 'diagnosis_completed'],
            ['Work products saved', 'artifact_completed'],
            ['Reviews saved', 'checkin_completed'],
          ].map(([label, type]) => (
            <div
              key={type}
              className="rounded-xl border border-[var(--border)] p-4"
            >
              <p className="text-xs opacity-65">{label}</p>
              <p className="mt-2 text-xl font-semibold">
                {
                  events.filter(
                    (event) => event.type === type && event.source === 'server',
                  ).length
                }
              </p>
            </div>
          ))}
        </div>
        {investigation && investigation.stage !== 'draft' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
            className="space-y-4"
          >
            <Field label="Did this help you understand what to do next?">
              <select
                className={fieldClass}
                value={rating}
                onChange={(e) =>
                  setRating(e.target.value as FocusedFeedback['rating'])
                }
              >
                <option value="useful">Yes, it was useful</option>
                <option value="unclear">The direction is still unclear</option>
                <option value="not_useful">
                  This did not fit my situation
                </option>
              </select>
            </Field>
            <Field label="What matched your situation, or what did we miss?">
              <textarea
                className={fieldClass}
                rows={3}
                maxLength={3000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <button className={secondaryClass} disabled={busy || pending}>
              Save my feedback
            </button>
            {status && (
              <p role="status" className="text-sm">
                {status}
              </p>
            )}
          </form>
        )}
        {feedback.length > 0 && (
          <p className="text-xs opacity-65">
            {feedback.length} feedback entries saved in your account. Your
            latest response: {feedback.at(-1)?.rating.replaceAll('_', ' ')}.
          </p>
        )}
      </div>
    </details>
  )
}
