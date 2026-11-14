import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check, Compass, MessageSquareText, ShoppingBag, Sparkles, Store, Target } from 'lucide-react'
import { CREATIVE_PLANS, FIRST_CAMPAIGN } from '@/lib/marketing/creative-plans'
import { VISUAL_ASSETS } from '@/lib/marketing/visual-assets'
import { CapabilityGrid } from './CapabilityGrid'
import { ConnectedWorkflow } from './PlatformExperience'
import { LandingHelp } from './LandingHelp'

const businessTypes = [
  { name: 'Services', icon: MessageSquareText, href: '/solutions?business=services' },
  { name: 'Online shops', icon: ShoppingBag, href: '/solutions?business=ecommerce' },
  { name: 'Creators', icon: Sparkles, href: '/solutions?business=creator' },
  { name: 'Local businesses', icon: Store, href: '/start?focus=retention' },
  { name: 'Your next idea', icon: Target, href: '/start' },
]

export function LandingExperience() {
  return (
    <div className="nx-platform nx-ribbon-home">
      <section className="nx-ribbon-hero" aria-labelledby="hero-title">
        <div className="nx-ribbon-field" style={{ backgroundImage: `url('${VISUAL_ASSETS.spectrum}')` }} aria-hidden="true" />
        <div className="nx-ribbon-rails" aria-hidden="true" />
        <div className="nx-platform-container nx-ribbon-copy">
          <Link href="/guide" className="nx-ribbon-kicker">Your business. Your judgment. <span>Your next move.</span> <ArrowUpRight size={14} /></Link>
          <h1 id="hero-title"><strong>A connected workspace for your next good move.</strong> <span>Keep the context. Choose the next move. See what changes.</span></h1>
          <div className="nx-ribbon-actions">
            <Link href="/start" className="nx-platform-button">Start my free check <ArrowRight size={16} /></Link>
            <Link href="/demo" className="nx-ribbon-secondary"><Compass size={17} /> Explore an example</Link>
          </div>
          <p className="nx-ribbon-reassurance"><Check size={13} /> A first direction before signup. No credit card needed.</p>
        </div>
        <div className="nx-business-types nx-platform-container" aria-label="Built for independent businesses">
          {businessTypes.map(({ name, icon: Icon, href }) => <Link key={name} href={href}><Icon size={24} strokeWidth={1.7} /><span>{name}</span></Link>)}
        </div>
      </section>

      <section className="nx-capabilities nx-platform-container" id="products" aria-labelledby="capabilities-title">
        <h2 id="capabilities-title"><strong>A clear place for every next move.</strong> <span>Bring the question, the work, and the evidence together — useful on their own, better connected.</span></h2>
        <CapabilityGrid />
        <p className="nx-capability-disclosure">Fictional product previews, not customer results. Photo-based image tools are implemented; new creative purchases, AI visuals, and finished videos are not yet available.</p>
      </section>

      <section className="nx-platform-container nx-story-section" aria-labelledby="story-title">
        <div className="nx-story-banner">
          <div className="nx-story-waves" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="nx-story-copy"><span>THE NEXORA APPROACH</span><h2 id="story-title">A little more context.<br />A much clearer next move.</h2><Link href="/demo" className="nx-story-button">Explore the walkthrough <ArrowRight size={15} /></Link></div>
          <div className="nx-story-note" aria-hidden="true"><Compass size={24} /><small>A QUESTION WORTH ASKING</small><strong>What happens between<br />interest and a sale?</strong><span>Start with one customer journey.</span><div><i /> Context → action</div></div>
          <span className="nx-story-wordmark">nexora <span>in practice</span></span>
        </div>
      </section>

      <section className="nx-business-backbone" aria-labelledby="backbone-title">
        <div className="nx-platform-container">
          <p className="nx-backbone-eyebrow">ONE CONNECTED WORKSPACE</p>
          <h2 id="backbone-title">The foundation for<br />your next clear decision.</h2>
          <div className="nx-backbone-steps">
            {[{ n: '01', title: 'Understand', text: 'Your context. Your actual records.' }, { n: '02', title: 'Create', text: 'An action with a reason behind it.' }, { n: '03', title: 'Review', text: 'Your exact version. Your approval.' }, { n: '04', title: 'Learn', text: 'Real outcomes, never assumed.' }].map(step => <div key={step.n}><small>{step.n}</small><h3>{step.title}</h3><p>{step.text}</p></div>)}
          </div>
          <ConnectedWorkflow />
          <p className="nx-backbone-note">A completed task is an activity, not a sale. Your measurements keep their source, reporting period, and currency.</p>
        </div>
      </section>

      <section className="nx-platform-container nx-home-plans" aria-labelledby="plans-title">
        <div className="nx-home-plans-heading"><p className="nx-platform-eyebrow">A ROUTINE THAT FITS YOUR BUSINESS</p><h2 id="plans-title">Start with a question.<br />Build from there.</h2><p>Free checks and planning are available now. Explore the creative plans we’re preparing, with clear allowances and no automatic overages.</p><Link href="/pricing" className="nx-platform-text-link">See plans & availability <ArrowRight size={16} /></Link></div>
        <div className="nx-home-plan-cards"><article><span>EXPLORE · AVAILABLE NOW</span><h3>$0<small> / month</small></h3><p>Business checks, weekly planning,<br />and your own records.</p><Link href="/start">Start a free check <ArrowRight size={14} /></Link></article>{CREATIVE_PLANS.map(plan => <article key={plan.id}><span>{plan.name.toUpperCase()} · PLANNED</span><h3>${plan.monthlyUsd}<small> / month</small></h3><p>{plan.campaigns} campaign kits · {plan.images} images<br />{plan.videos} short videos · planned allowances.</p><Link href="/pricing">Preview the plan <ArrowRight size={14} /></Link></article>)}</div>
        <p className="nx-home-plan-note">First campaign: ${FIRST_CAMPAIGN.oneTimeUsd} once, no subscription. Planned USD prices before tax. Focus/Growth renew monthly until canceled. New creative checkout remains closed; final image and video delivery is in development.</p>
      </section>

      <section className="nx-platform-container nx-home-final"><div><h2>Your business.<br /><span>Your next move.</span></h2><p>Start with what feels stuck. Find a useful place to begin.</p></div><Link href="/start" className="nx-platform-button">Start my free check <ArrowRight size={16} /></Link></section>
      <LandingHelp />
    </div>
  )
}
