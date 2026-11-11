import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { PricingPlans } from '@/components/marketing/PricingPlans'
import { CreativeOverview } from '@/components/marketing/CreativeOverview'
import { CREATIVE_PLANS } from '@/lib/marketing/creative-plans'

const [focus, growth] = CREATIVE_PLANS
export const metadata: Metadata = {
  title: 'Ad creative plans & pricing',
  description: `Explore NEXORA free. Preview planned creative plans: Focus $${focus.monthlyUsd}/month and Growth $${growth.monthlyUsd}/month for ad images, finished short videos, and AI motion scenes.`,
}
const faqs = [
  ['Can I buy these creative plans now?', 'Not yet. These are our planned launch prices and allowances. Image generation, video editing, and AI motion production are still in development. Checkout is closed. You can use the free business checks and planning workflow now without entering a card.'],
  ['What does a finished video include?', 'The planned output is an MP4 of up to 30 seconds, with a scene sequence, captions, voiceover, and your call to action. You can use product photos, AI images, AI motion scenes, or a mix. It is a finished file, rather than only a script or generation prompt.'],
  ['How are finished videos different from AI scene seconds?', `Finished videos count complete edits. AI scene seconds count newly generated moving footage. Focus includes ${focus.videos} finished edits and ${focus.motionSeconds} total seconds of AI scenes; Growth includes ${growth.videos} edits and ${growth.motionSeconds} scene seconds. You can reuse a scene in multiple edits. The allowance does not cover filling every finished video entirely with new AI footage.`],
  ['What is a campaign brief?', 'One offer, audience, and customer action, with initial hooks, ad copy, calls to action, and a script or storyboard. Image and video allowances form monthly pools you can distribute across those briefs. One brief does not consume all its possible media automatically.'],
  ['Do different sizes or manual edits count as new creations?', 'The planned allowance counts new designs and new video edits. Resizing an existing design or changing its headline, price, captions, or call to action without generating new media will not consume another generation. Creating a new image, AI scene, voiceover, or scene sequence uses the relevant allowance shown before you proceed.'],
  ['What happens if a generation fails?', 'The planned policy is to release the allowance reserved for a confirmed failed operation. A successful new generation or regeneration uses its allowance. An outcome still being checked stays pending to avoid duplicate requests. If a final edit fails, successfully generated images or scenes remain available.'],
  ['Are these unlimited plans or a production agency?', 'These are planned self-service plans for one business and one account owner. They include defined monthly creation allowances. Dedicated human editing, custom filming, premium video models, automatic posting, ad spending, and analytics imports are outside this offer.'],
  ['How will billing, taxes, and cancellation work?', 'Planned pricing is monthly, in USD before applicable tax, with no annual commitment or automatic overage charge. Allowances will follow the paid billing period and will not roll over. Final billing and refund terms will be shown before subscriptions open. Existing text-plan subscribers retain their confirmed terms and can manage their current subscription in Plan & billing.'],
]

export default function PricingPage() {
  return <div className="nx-marketing nx-container nx-section !max-w-[1240px]">
    <header className="nx-route-banner"><p className="nx-eyebrow">AD COPY. IMAGES. FINISHED VIDEOS.</p><h1 className="nx-heading mt-7">A month of creative.<br/>One clear plan.</h1><p className="nx-copy mt-6 max-w-xl">Plan your next offer, then create the images and short videos to share it. Preview the creative plans we’re building, with both photo-based video and AI-generated motion.</p><p className="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]"><ShieldCheck size={16}/>Planned monthly billing · No annual commitment · No automatic overages</p></header>
    <p role="status" className="nx-price-availability"><strong>Creative plans are coming soon.</strong> Prices and allowances below are our launch proposal. Image and video production are in development, and these plans are not available for purchase. Explore the free workspace now; no card is needed.</p>
    <PricingPlans/>
    <section className="nx-creative-allowance-note"><ClarityExample/><div><h2>Two video methods. Two clear limits.</h2><p>Photo-based editing creates a finished ad from your images. AI scene generation creates moving footage to use inside that edit. For example, 60 scene seconds can make twelve 5-second scenes; those scenes can be reused across your videos.</p><p>Changing a design’s size does not turn one design into three new creations. Reusing a scene does not generate it again.</p></div></section>
    <CreativeOverview/>
    <section className="nx-price-explainer"><div><p className="nx-eyebrow">FROM YOUR OFFER TO YOUR AD</p><h2 className="mt-5 text-3xl font-medium tracking-tight">The context.<br/>The creative.<br/>The final file.</h2><Link href="/demo" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Try the current text walkthrough <ArrowRight size={15}/></Link></div><ol>{['Choose your offer, audience, and customer action', 'Develop the hooks, copy, and scene direction', 'Create images and choose either video method', 'Review your claims, branding, and exact version', 'Export the creative and record what you actually use'].map((text, i) => <li key={text}><span>{String(i + 1).padStart(2, '0')}</span>{text}</li>)}</ol></section>
    <section className="max-w-3xl mx-auto pb-6"><p className="nx-eyebrow mb-6">Before you decide</p>{faqs.map(([question, answer]) => <details className="nx-price-faq" key={question}><summary>{question}</summary><p>{answer}</p></details>)}<p className="mt-8 text-xs leading-7 text-[var(--muted)]">Read the <Link href="/terms" className="underline">terms and refund policy</Link> and <Link href="/privacy" className="underline">privacy notice</Link>. Already have an account? <Link href="/workspace#billing" className="underline">Open Plan & billing</Link>.</p></section>
  </div>
}

function ClarityExample() {
  return <div className="nx-creative-example" aria-label="Example: 12 five-second AI scenes use the Focus 60-second scene allowance"><strong>12 <span>×</span> 5s</strong><span>AI motion scenes</span><i/><strong>60s <small>total</small></strong><span>Reuse them in your finished edits</span></div>
}
