'use client'

import { useRef, useState } from 'react'
import type { WorkspaceData } from '@/lib/business/types'
import type { PaidPlanId } from '@/lib/billing/plans'
import { CREATIVE_PLANS, quoteCreativeOffer } from '@/lib/marketing/creative-plans'
import { ErrorText, friendlyError, requestJson } from './shared'

const choices = [0, 1, 2, 3, 4, 5, 8, 10, 20, 50]
const date = (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })

export function CreativeSubscriptionControls({ data, onUpdated }: { data: WorkspaceData; onUpdated: (data: WorkspaceData) => void }) {
  const current = data.billing?.creative
  const [plan, setPlan] = useState<PaidPlanId>('focus')
  const [scenes, setScenes] = useState(current?.pending?.scenes ?? current?.monthlyScenes ?? 0)
  const [topUp, setTopUp] = useState(1)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const request = useRef<{ fingerprint: string; id: string } | null>(null)
  const selected = quoteCreativeOffer(current?.plan ?? plan, scenes, 'monthly')
  const extra = quoteCreativeOffer(current?.plan ?? plan, topUp, 'one_time')
  const quantityIncrease = Boolean(current && (selected.purchasedScenes > (current.pending?.scenes ?? current.monthlyScenes) || selected.renewalUsd > (current.pending?.monthlyUsd ?? current.monthlyUsd)))
  const increaseClosed = quantityIncrease && !data.billing?.creativeCheckoutAvailable
  const options = [...new Set([...choices, scenes])].sort((a, b) => a - b)
  function key(kind: string) {
    const fingerprint = `${kind}:${kind === 'quantity' ? scenes : ''}`
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() }
    return request.current!.id
  }
  async function openCheckout(oneTime = false) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await requestJson<{ url: string }>(`/api/billing/creative/${oneTime ? 'top-up' : 'checkout'}`, {
        method: 'POST', body: JSON.stringify(oneTime ? { scenes: topUp } : { plan, scenes, motionBilling: 'monthly' }),
      })
      location.assign(result.url)
    } catch (failure) { setError(friendlyError(failure)); setBusy(false) }
  }
  async function change(kind: 'quantity' | 'cancel') {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await requestJson<{ workspace: WorkspaceData; effectiveAt: string }>(`/api/billing/creative/${kind}`, {
        method: 'POST', body: JSON.stringify({ scenes, requestId: key(kind) }),
      })
      request.current = null
      setNotice(kind === 'cancel' ? `Automatic renewal canceled. Your paid access continues through ${date(result.effectiveAt)} (UTC).` : `New monthly quantity takes effect on ${date(result.effectiveAt)} (UTC). No immediate charge or change to this period.`)
      onUpdated(result.workspace)
    } catch (failure) { setError(friendlyError(failure)) }
    finally { setBusy(false) }
  }
  return <section className="nx-panel mt-7" aria-labelledby="creative-subscription-title">
    <p className="nx-eyebrow">MONTHLY SUBSCRIPTION · AUTO-RENEWAL</p>
    <h2 id="creative-subscription-title" className="mt-4 text-2xl font-semibold">{current ? 'Your creative subscription.' : 'Choose your monthly routine.'}</h2>
    {current ? <>
      <p className="mt-4 text-sm leading-7"><strong>{planName(current.plan)} · ${current.monthlyUsd}/month before tax</strong><br/>{current.monthlyScenes} AI scenes included in your chosen monthly quantity.<br/>{current.cancelAtPeriodEnd ? `Renewal canceled; paid access ends ${date(current.periodEnd)} (UTC).` : `Renews automatically on ${date(current.periodEnd)} (UTC), then every month until you cancel.`}</p>
      {current.pending && <p role="status" className="mt-4 text-sm leading-7">Scheduled for {date(current.pending.effectiveAt)} (UTC): {current.pending.scenes} AI scenes · ${current.pending.monthlyUsd}/month. This replaces your previous scheduled selection.</p>}
      {!current.paid && <p className="mt-4 text-sm leading-7">The latest subscription payment is not confirmed paid. Update your payment method or check billing status before creating more work.</p>}
    </> : <>
      <p className="mt-3 text-sm leading-7">Focus $79/month or Growth $149/month renews automatically until you cancel in this page. Choose recurring extras or buy extra scenes only when you need them.</p>
      <label className="mt-5 block text-sm" htmlFor="account-creative-plan">Monthly plan</label>
      <select id="account-creative-plan" className="nx-field mt-2" value={plan} onChange={event => setPlan(event.target.value as PaidPlanId)}>{CREATIVE_PLANS.map(item => <option key={item.id} value={item.id}>{item.name} · ${item.monthlyUsd}/month</option>)}</select>
    </>}
    <label className="mt-5 block text-sm" htmlFor="account-monthly-scenes">{current ? 'AI scene quantity from your next renewal' : 'Additional AI scenes · 8 seconds each'}</label>
    <select id="account-monthly-scenes" className="nx-field mt-2" value={scenes} disabled={busy || Boolean(current && !current.canChange)} onChange={event => setScenes(Number(event.target.value))}>{options.map(count => <option value={count} key={count}>{count === 0 ? '0 · base plan only' : `${count} scenes requested`}</option>)}</select>

    <p className="mt-4 text-sm leading-7"><strong>{current ? 'From next renewal' : 'Automatic monthly renewal'}: ${selected.renewalUsd}/month before tax.</strong>{!current && <><br/>First payment: ${selected.totalUsd} before tax.</>}<br/>{selected.purchasedScenes} scenes per billing month ({selected.purchasedSeconds}s). {selected.purchasedScenes > scenes ? 'The cheaper five-scene bundle includes the extra scene shown here.' : ''}</p>
    {current ? <>
      <button className="nx-button mt-5" disabled={busy || !current.canChange || increaseClosed || selected.purchasedScenes === (current.pending?.scenes ?? current.monthlyScenes)} onClick={() => void change('quantity')}>Apply ${selected.renewalUsd}/month from next renewal</button>
      {!data.billing?.creativeCheckoutAvailable && <p className="mt-3 text-xs leading-6 text-[var(--muted)]">New creative purchases and monthly scene increases are closed. You can still reduce your scheduled extras, set them to zero, or cancel renewal; existing paid access stays available.</p>}
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">No immediate proration or charge. Your current period stays as paid. Setting extras to zero keeps the base monthly subscription active.</p>
      <hr className="my-6 border-[var(--border)]"/>
      <h3 className="text-lg font-semibold">Need more this month?</h3>
      <label className="mt-3 block text-sm" htmlFor="account-topup-scenes">One-time AI scenes</label><select id="account-topup-scenes" className="nx-field mt-2" value={topUp} onChange={event => setTopUp(Number(event.target.value))}>{choices.filter(count => count > 0).map(count => <option key={count} value={count}>{count} scenes requested</option>)}</select>
      <p className="mt-3 text-sm">${extra.motionUsd} once · {extra.purchasedScenes} scenes · valid 30 days. Your monthly renewal stays ${current.pending?.monthlyUsd ?? current.monthlyUsd}.</p>
      <button className="nx-button nx-button-secondary mt-4" disabled={busy || !current.paid || !data.billing?.creativeCheckoutAvailable} onClick={() => void openCheckout(true)}>Buy extra scenes · ${extra.motionUsd} once</button>
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">One-time scenes currently available: {current.oneTimeScenes}. A checkout return alone never adds usage.</p>
      {current.canCancel && <button className="nx-button nx-button-secondary mt-6" disabled={busy} onClick={() => void change('cancel')}>Cancel automatic renewal at period end</button>}
    </> : <><button className="nx-button mt-5" disabled={busy || !data.billing?.creativeCheckoutAvailable} onClick={() => void openCheckout()}>{data.billing?.creativeCheckoutAvailable ? `Subscribe · $${selected.renewalUsd}/month` : 'Creative subscriptions coming soon'}</button><p className="mt-3 text-xs leading-6 text-[var(--muted)]">Monthly automatic billing is the subscription contract. New purchases remain closed until media delivery and operator setup are ready. Stripe will display taxes and the final total before payment.</p></>}
    <div className="mt-4"><ErrorText error={error}/>{notice && <p role="status" className="mt-3 text-sm leading-7">{notice}</p>}</div>
  </section>
}
function planName(id: PaidPlanId) { return CREATIVE_PLANS.find(plan => plan.id === id)!.name }
