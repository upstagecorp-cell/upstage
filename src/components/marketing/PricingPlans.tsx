import Link from 'next/link'
import { ArrowUpRight, Check, Layers, Sparkles } from 'lucide-react'
import { CREATIVE_PLANS, MAX_CREATIVE_VIDEO_SECONDS } from '@/lib/marketing/creative-plans'

export function PricingPlans() {
  return <div className="nx-price-grid mt-5">
    <article className="nx-price-card">
      <span className="nx-price-symbol"><Layers size={23}/></span>
      <p className="nx-eyebrow mt-7">Explore</p>
      <h2 className="mt-3 text-2xl font-semibold">Find your first direction.</h2>
      <p className="nx-price-value">$0<span>/ month</span></p>
      <p className="nx-price-description">Understand your business and plan your next move.</p>
      <Link className="nx-button nx-button-secondary mt-7 w-full" href="/start">Start my free check <ArrowUpRight size={15}/></Link>
      <ul>{['A first direction before signup', 'One business workspace', 'Business checks and weekly planning', 'Your own measurements and outcomes', 'Review and export saved text'].map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul>
      <p className="nx-price-note">Available now. No card needed. New AI generation and image/video production are not included in Explore.</p>
    </article>
    {CREATIVE_PLANS.map(plan => <article key={plan.id} className={`nx-price-card ${plan.id === 'growth' ? 'nx-price-featured' : ''}`}>
      <span className="nx-price-symbol"><Sparkles size={23}/></span>
      <p className="nx-eyebrow mt-7">{plan.name}<span className="nx-creative-badge">Coming soon</span></p>
      <h2 className="mt-3 text-2xl font-semibold">{plan.headline}</h2>
      <p className="nx-price-value">${plan.monthlyUsd}<span>/ month · planned</span></p>
      <p className="nx-price-description">{plan.description}</p>
      <button className={`nx-button mt-7 w-full ${plan.id === 'growth' ? 'nx-button-lime' : ''}`} disabled>Creative plans coming soon <ArrowUpRight size={15}/></button>
      <ul>{[
        `${plan.images} new ad images per month`,
        `${plan.videos} finished short videos · up to ${MAX_CREATIVE_VIDEO_SECONDS}s each`,
        `${plan.motionSeconds}s total of AI-generated motion scenes`,
        `${plan.campaigns} campaign briefs with hooks, copy, and scripts`,
        'Photo-based videos and AI motion in one workflow',
        'Captions, voiceover, brand colors, and logo',
        '1:1, 4:5, and 9:16 image exports from the same design',
        'Edit and re-export existing media without a new generation',
      ].map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul>
      <p className="nx-price-note">Planned monthly allowance · one business · one owner. AI scene seconds are a separate total, not the full length of every finished video. USD before tax. Not available for purchase yet.</p>
    </article>)}
  </div>
}
