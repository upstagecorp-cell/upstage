'use client'

import { useRef, useState } from 'react'
import type { WorkspaceData } from '@/lib/business/types'
import type { CreativePlanId } from '@/lib/marketing/creative-plans'
import { CREATIVE_PLANS, LONG_VIDEO_PACKS, quoteCreativeOffer } from '@/lib/marketing/creative-plans'
import { ErrorText, friendlyError, requestJson } from './shared'

const choices = [0, 1, 2, 3, 4, 5, 8, 10, 20, 50]
const date = (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })

export function CreativeSubscriptionControls({ data, onUpdated }: { data: WorkspaceData; onUpdated: (data: WorkspaceData) => void }) {
  const current = data.billing?.creative
  const [plan, setPlan] = useState<CreativePlanId>('focus')
  const [scenes, setScenes] = useState(current?.pending?.scenes ?? current?.monthlyScenes ?? 0)
  const [topUp, setTopUp] = useState(1)
  const [videoPackId, setVideoPackId] = useState('')
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
  async function openCheckout(oneTime = false, video = false) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await requestJson<{ url: string }>(`/api/billing/creative/${oneTime ? (video ? 'video-top-up' : 'top-up') : 'checkout'}`, {
        method: 'POST', body: JSON.stringify(oneTime ? (video ? { packId: videoPackId } : { scenes: topUp }) : { plan, scenes, motionBilling: 'monthly', videoPackId: videoPackId || undefined }),
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
      <p className="mt-3 text-sm leading-7">Core $29/month, Plus $59/month, or Pro $99/month renews automatically until you cancel on this page. AI motion scenes are optional source footage, not finished ads.</p>
    <label className="mt-5 block text-sm" htmlFor="account-creative-plan">Monthly plan</label>
      <select id="account-creative-plan" className="nx-field mt-2" value={plan} onChange={event => setPlan(event.target.value as CreativePlanId)}>{CREATIVE_PLANS.map(item => <option key={item.id} value={item.id}>{item.name} · ${item.monthlyUsd}/month</option>)}</select>
      <p className="mt-3 text-sm leading-7">{CREATIVE_PLANS.find(item => item.id === plan)?.description} Plan differences are preview usage capacity for AI work, images, short videos, storage, and history—not a fixed number of campaigns.</p>
    </>}
    <label className="mt-5 block text-sm" htmlFor="account-monthly-scenes">{current ? 'AI motion source scenes from your next renewal' : 'Optional AI motion source scenes · 8 seconds each'}</label>
    <select id="account-monthly-scenes" className="nx-field mt-2" value={scenes} disabled={busy || Boolean(current && !current.canChange)} onChange={event => setScenes(Number(event.target.value))}>{options.map(count => { const estimate = quoteCreativeOffer(current?.plan ?? plan, count, 'monthly'); return <option value={count} key={count}>{count === 0 ? '0 · base plan only' : `${count} requested → ${estimate.purchasedScenes} scenes · ${estimate.purchasedSeconds}s source · $${estimate.motionUsd}/month`}</option> })}</select>

    <p className="mt-4 text-sm leading-7"><strong>{current ? 'From next renewal' : 'Automatic monthly renewal'}: ${selected.renewalUsd}/month before tax.</strong>{!current && <><br/>First payment: ${selected.totalUsd} before tax.</>}<br/>{selected.purchasedScenes} AI motion source scenes per billing month ({selected.purchasedSeconds}s). This is not a finished {selected.purchasedSeconds}-second ad. {selected.purchasedScenes > scenes ? 'The lower-cost five-scene bundle includes the extra source scene shown here.' : ''}</p>
    {current ? <>
      <button className="nx-button mt-5" disabled={busy || !current.canChange || increaseClosed || selected.purchasedScenes === (current.pending?.scenes ?? current.monthlyScenes)} onClick={() => void change('quantity')}>Apply ${selected.renewalUsd}/month from next renewal</button>
      {!data.billing?.creativeCheckoutAvailable && <p className="mt-3 text-xs leading-6 text-[var(--muted)]">New creative purchases and monthly scene increases are closed. You can still reduce your scheduled extras, set them to zero, or cancel renewal; existing paid access stays available.</p>}
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">No immediate proration or charge. Your current period stays as paid. Setting extras to zero keeps the base monthly subscription active.</p>
      <hr className="my-6 border-[var(--border)]"/>
      <h3 className="text-lg font-semibold">Need more this month?</h3>
      <label className="mt-3 block text-sm" htmlFor="account-topup-scenes">One-time AI scenes</label><select id="account-topup-scenes" className="nx-field mt-2" value={topUp} onChange={event => setTopUp(Number(event.target.value))}>{choices.filter(count => count > 0).map(count => <option key={count} value={count}>{count} scenes requested</option>)}</select>
      <p className="mt-3 text-sm">${extra.motionUsd} once · {extra.purchasedScenes} AI motion source scenes ({extra.purchasedSeconds}s) · valid 30 days. Your monthly renewal stays ${current.pending?.monthlyUsd ?? current.monthlyUsd}.</p>
      <button className="nx-button nx-button-secondary mt-4" disabled={busy || !current.paid || !data.billing?.creativeCheckoutAvailable} onClick={() => void openCheckout(true)}>Buy extra scenes · ${extra.motionUsd} once</button>
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">One-time AI motion source seconds currently available: {current.oneTimeScenes * 8}. A checkout return alone never adds usage.</p>
      {current.canCancel && <button className="nx-button nx-button-secondary mt-6" disabled={busy} onClick={() => void change('cancel')}>Cancel automatic renewal at period end</button>}
    </> : <><label className="mt-5 block text-sm" htmlFor="account-first-video">Add a finished 30-second+ promotion video to the first payment (optional)</label><select id="account-first-video" className="nx-field mt-2" value={videoPackId} disabled={busy} onChange={event => setVideoPackId(event.target.value)}><option value="">No finished long video</option>{LONG_VIDEO_PACKS.map(pack => <option key={pack.id} value={pack.id}>{pack.name} · ${pack.oneTimeUsd} once</option>)}</select><p className="mt-2 text-xs leading-6 text-[var(--muted)]">Finished long videos cost more than raw AI motion scenes because they include an assembled edit. They do not renew and do not include Meta, Google, TikTok, or other advertising spend.</p><button className="nx-button mt-5" disabled={busy || !data.billing?.creativeCheckoutAvailable} onClick={() => void openCheckout(false)}>{data.billing?.creativeCheckoutAvailable ? `Subscribe · $${selected.renewalUsd + (LONG_VIDEO_PACKS.find(pack => pack.id === videoPackId)?.oneTimeUsd ?? 0)}` : 'Creative subscriptions coming soon'}</button><p className="mt-3 text-xs leading-6 text-[var(--muted)]">Monthly automatic billing is the subscription contract. The selected finished video pack is charged once with the first invoice; monthly renewal excludes it. Stripe will display taxes and the final total before payment.</p></>}
    {current && <><hr className="my-6 border-[var(--border)]"/><h3 className="text-lg font-semibold">Need a 30-second or longer video?</h3><p className="mt-2 text-sm leading-6">Buy a one-time video pack from Plan & billing. Your available long-video production time is {current.longVideoSeconds}s. It expires after 30 days and never changes your subscription renewal.</p><label className="mt-4 block text-sm" htmlFor="account-video-pack">Long-video package</label><select id="account-video-pack" className="nx-field mt-2" value={videoPackId} disabled={busy} onChange={event => setVideoPackId(event.target.value as typeof videoPackId)}>{LONG_VIDEO_PACKS.map(pack => <option key={pack.id} value={pack.id}>{pack.name} · ${pack.oneTimeUsd} once</option>)}</select><button className="nx-button nx-button-secondary mt-4" disabled={busy || !current.paid || !data.billing?.creativeCheckoutAvailable} onClick={() => void openCheckout(true, true)}>Buy long-video package</button><p className="mt-3 text-xs leading-6 text-[var(--muted)]">NEXORA prepares the promotional video. Advertising budget and media spend on each social platform are paid directly by you.</p></>}
    <div className="mt-4"><ErrorText error={error}/>{notice && <p role="status" className="mt-3 text-sm leading-7">{notice}</p>}</div>
  </section>
}
function planName(id: CreativePlanId) { return CREATIVE_PLANS.find(plan => plan.id === id)!.name }
