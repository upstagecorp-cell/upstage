'use client'

import { useState } from 'react'
import {
  CREATIVE_PLANS, FIRST_CAMPAIGN, MOTION_PACKS, MOTION_SCENE_SECONDS,
  quoteCreativeOffer, type CreativeOfferId, type MotionBilling,
} from '@/lib/marketing/creative-plans'

export function CreativeOfferPlanner() {
  const [offer, setOffer] = useState<CreativeOfferId>('focus')
  const [scenes, setScenes] = useState(0)
  const [mode, setMode] = useState<MotionBilling>('monthly')
  const quote = quoteCreativeOffer(offer, scenes, mode)
  return <section className="nx-offer-planner" aria-labelledby="creative-budget-title">
    <div>
      <p className="nx-eyebrow">SEE THE PRICE BEFORE YOU COMMIT</p>
      <h2 id="creative-budget-title">Your campaign.<br/>Your motion budget.</h2>
      <p>Your monthly plan renews automatically until you cancel. Choose AI scenes that renew with it, or buy one-time extras from your account when needed.</p>
      <p className="nx-offer-small">Planning estimate only. These creative offers are in development and cannot be purchased yet.</p>
    </div>
    <div className="nx-offer-quote">
      <label htmlFor="creative-offer">Choose an offer</label>
      <select id="creative-offer" value={offer} onChange={event => { const next = event.target.value as CreativeOfferId; setOffer(next); setMode(next === 'first-campaign' ? 'one_time' : 'monthly') }}>
        <option value="first-campaign">{FIRST_CAMPAIGN.name} · ${FIRST_CAMPAIGN.oneTimeUsd} once</option>
        {CREATIVE_PLANS.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · ${plan.monthlyUsd}/month</option>)}
      </select>
      {offer !== 'first-campaign' && <><label htmlFor="creative-motion-billing">How should extra scenes be billed?</label><select id="creative-motion-billing" value={mode} onChange={event => setMode(event.target.value as MotionBilling)}><option value="monthly">Every month with my subscription</option><option value="one_time">One time only</option></select></>}
      <label htmlFor="creative-scenes">New AI scenes · {MOTION_SCENE_SECONDS} seconds each</label>
      <select id="creative-scenes" value={scenes} onChange={event => setScenes(Number(event.target.value))}>
        {[0, 1, 2, 3, 4, 5, 8, 10].map(count => <option key={count} value={count}>{count === 0 ? 'None · use photos and saved scenes' : `${count} scenes · ${count * MOTION_SCENE_SECONDS}s of footage`}</option>)}
      </select>
      <div className="nx-offer-quote-result" role="status" aria-live="polite" aria-atomic="true">
        <dl><div><dt>{quote.recurring ? 'Monthly plan' : 'One-time campaign'}</dt><dd>${quote.baseUsd}{quote.recurring ? '/month' : ' once'}</dd></div>
          <div><dt>{mode === 'monthly' ? 'Monthly scene allowance' : 'One-time scene packs'}</dt><dd>${quote.motionUsd}{mode === 'monthly' ? '/month' : ' once'}</dd></div>
          <div className="nx-offer-total"><dt>{quote.recurring ? mode === 'monthly' ? 'First payment estimate' : 'Plan + separate one-time purchase' : 'One-time total'}</dt><dd>${quote.totalUsd}</dd></div></dl>
        <p>{quote.recurring ? `Renews automatically at $${quote.renewalUsd}/month until you cancel. ${mode === 'monthly' ? 'Your selected scenes renew with the plan. Change the quantity in your account; the new amount starts at your next billing date.' : 'Buy one-time extras separately in Plan & billing after subscribing. Your first subscription payment is the base plan; these extras do not change its renewal.'}` : 'This standalone first campaign is a one-time purchase, not a monthly subscription.'} USD before applicable tax.</p>
        {quote.purchasedScenes > 0 && <p>{quote.purchasedScenes} scenes purchased · {quote.purchasedSeconds}s total. {quote.purchasedScenes > scenes ? 'The five-scene pack costs less than individual scenes; the extra scene remains yours to use.' : 'Use saved footage in multiple edits without paying to generate it again.'}</p>}
        {quote.items.length > 0 && <p>{quote.items.map(item => `${item.quantity} × ${MOTION_PACKS.find(pack => pack.id === item.packId)!.name}`).join(' + ')}. {mode === 'monthly' ? 'Usage resets each paid billing period; unused scenes do not roll over.' : 'One-time packs are valid for 30 days.'}</p>}
      </div>
    </div>
  </section>
}
