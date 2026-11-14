'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCheck, Circle, Compass, Expand, FileText, History, ImageIcon, ShieldCheck, Sparkles, X } from 'lucide-react'
import { PRODUCT_AREAS, type ProductView } from '@/lib/marketing/catalog'
import { VISUAL_ASSETS } from '@/lib/marketing/visual-assets'
import { WorkspacePreview } from './PlatformExperience'

const cards: { view: ProductView; title: string; className: string }[] = [
  { view: 'check', title: 'Understand your business — and find a place to begin', className: 'nx-capability-wide nx-capability-check' },
  { view: 'plan', title: 'Give your next move a place in the week', className: 'nx-capability-plan' },
  { view: 'draft', title: 'Create the words for your next campaign', className: 'nx-capability-draft' },
  { view: 'media', title: 'Bring your product into the picture', className: 'nx-capability-media' },
  { view: 'measure', title: 'See what changed, with the source in view', className: 'nx-capability-measure' },
  { view: 'review', title: 'Keep your approval and your earlier work connected', className: 'nx-capability-full nx-capability-review' },
]

function CheckPreview() {
  return <div className="nx-check-composition" aria-label="Fictional business check preview">
    <div className="nx-preview-phone"><div className="nx-phone-camera" /><span className="nx-phone-symbol"><Compass size={25} /></span><small>YOUR FIRST DIRECTION</small><h3>One question.<br />A clearer start.</h3><p>Where does interest become a paid project?</p><div className="nx-phone-facts"><span>Your business<strong>Design services</strong></span><span>Your focus<strong>More inquiries</strong></span><span>What you know<strong>Keep the facts</strong></span></div><span className="nx-phone-continue">Your next move <ArrowRight size={12} /></span></div>
    <div className="nx-check-window"><div className="nx-mini-browser"><span><i /><i /><i /></span>nexora / business check</div><div className="nx-check-window-body"><span className="nx-mini-wordmark">nexora.</span><div className="nx-check-context"><small>BUSINESS CONTEXT</small><strong>Harbor Design</strong><p>Brand design consultations for independent businesses.</p></div><div className="nx-check-context"><small>A QUESTION TO INVESTIGATE</small><h3>From a first inquiry<br />to a paid project.</h3><p>Follow one customer journey. Look for the step you don’t yet understand.</p></div><div className="nx-mini-fact-row"><Compass size={15} /><span>Your context stays attached</span><Check size={14} /></div><div className="nx-mini-fact-row"><CalendarDays size={15} /><span>A place in your weekly plan</span><ArrowRight size={14} /></div><span className="nx-mini-note">SAMPLE BUSINESS · NO ACCOUNT DATA</span></div></div>
  </div>
}

function PlanPreview() {
  return <div className="nx-plan-composition"><div className="nx-plan-focus"><span className="nx-preview-icon"><CalendarDays size={20} /></span><div><strong>One thoughtful action</strong><small>YOUR WEEK AHEAD</small></div><span className="nx-plan-pill">Planned</span><p>Review the consultation offer.</p><div className="nx-plan-focus-foot"><span>Define the next customer action</span><ArrowRight size={13} /></div></div><div className="nx-week-preview"><div><strong>A little room to move.</strong><small>ILLUSTRATIVE WEEK</small></div><div className="nx-week-columns">{['M', 'T', 'W', 'T', 'F'].map((day, index) => <span key={index}><small>{day}</small><i style={{ height: `${[24, 44, 71, 53, 90][index]}%` }} /><b>{index + 4}</b></span>)}</div><div className="nx-mini-fact-row"><Circle size={12} /><span>One task is not a sales result</span></div></div></div>
}

function DraftPreview() {
  const [direction, setDirection] = useState(0)
  return <div className="nx-draft-composition"><div className="nx-message-bubble">I have a clear offer.<br />How do I put it into words?</div><div className="nx-draft-paper"><div><span className="nx-preview-icon"><Sparkles size={17} /></span><strong>A message with context.</strong></div><div className="nx-copy-choices" role="group" aria-label="Fictional message direction">{['Start a conversation', 'Give it a direction'].map((label, index) => <button key={label} type="button" aria-pressed={direction === index} onClick={() => setDirection(index)}>{index ? 'B' : 'A'}<span>{label}</span></button>)}</div><div className="nx-draft-sample" aria-live="polite"><small>HARBOR DESIGN · SAMPLE</small><h3>{direction ? 'Give your brand a direction.' : 'Your next idea starts here.'}</h3><p>{direction ? 'Bring your brand questions to a design consultation. Decide what comes next.' : 'Planning a brand project? Tell us what you have in mind.'}</p><span>Explore the consultation <ArrowRight size={11} /></span></div><small className="nx-draft-disclaimer">FICTIONAL COPY · NOT AI GENERATED</small></div></div>
}

export function MediaPreview() {
  return <div className="nx-media-composition"><div className="nx-image-design"><Image src={VISUAL_ASSETS.ceramic} alt="Illustrative ivory ceramic mug for a fictional product campaign" width={400} height={400} unoptimized /><div className="nx-image-design-copy"><small>THE EVERYDAY COLLECTION</small><h3>A slower morning.<br />A better ritual.</h3><span>Meet your everyday mug <ArrowUpRight size={12} /></span></div><span className="nx-image-brand">form & field.</span></div><div className="nx-image-status"><span><ImageIcon size={15} />Photo-based design</span><span><CheckCheck size={14} />Saved version</span></div><small className="nx-image-disclosure">FICTIONAL DESIGN · EXPORT REQUIRES CREATIVE RIGHTS</small></div>
}

function MeasurementPreview() {
  const heights = [14, 22, 28, 43, 58, 35, 49, 28, 20, 41, 34, 58, 73, 42, 95, 54, 38, 44, 50, 32, 44, 61, 82, 69, 54, 38, 43]
  return <div className="nx-measure-composition"><div className="nx-measure-orbit" aria-hidden="true"><i /><i /><i /><span /><span /><span /></div><div className="nx-measure-paper"><div><span className="nx-preview-icon"><History size={18} /></span><span><strong>Keep the source attached.</strong><small>ILLUSTRATIVE MEASUREMENTS</small></span></div><div className="nx-demo-bars" aria-hidden="true">{heights.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="nx-measure-source"><span>Period</span><strong>Saved with each record</strong><span>Source</span><strong>Your actual observations</strong><span>Unknowns</span><strong>Never filled with guesses</strong></div></div><div className="nx-measure-label"><ShieldCheck size={14} /> Evidence, not assumptions.</div></div>
}

function ReviewPreview() {
  return <div className="nx-review-composition"><div className="nx-review-slip"><div><span className="nx-preview-icon"><ShieldCheck size={18} /></span><strong>Your approved version</strong></div><p>One message.<br /><strong>Your judgment.</strong></p><span className="nx-approved-badge"><Check size={12} /> v1 · Approved sample</span><div className="nx-review-slip-row"><span>Offer & claims</span><Check size={13} /></div><div className="nx-review-slip-row"><span>Later edits</span><strong>Need a new approval</strong></div><small>Approval is not publication.</small></div><div className="nx-history-preview"><div className="nx-mini-browser"><span><i /><i /><i /></span>nexora / connected history</div><div className="nx-history-body"><span className="nx-mini-wordmark">Your work, with its context.</span><div className="nx-history-head"><span>Saved record</span><span>Version</span><span>Status</span></div>{[{ icon: Compass, title: 'Business snapshot', subtitle: 'The facts behind your direction', version: '01', status: 'Saved' }, { icon: CalendarDays, title: 'Weekly action', subtitle: 'Review the consultation offer', version: '01', status: 'Planned' }, { icon: FileText, title: 'Campaign message', subtitle: 'The words you chose to review', version: 'v1', status: 'Approved' }, { icon: FileText, title: 'A new revision', subtitle: 'Earlier approved wording preserved', version: 'v2', status: 'Draft' }, { icon: History, title: 'Actual observation', subtitle: 'Your source and reporting period', version: '01', status: 'Recorded' }].map(({ icon: Icon, title, subtitle, version, status }) => <div className="nx-history-row" key={title}><span><Icon size={17} /><span><strong>{title}</strong><small>{subtitle}</small></span></span><span>{version}</span><span className={status === 'Approved' ? 'nx-history-approved' : ''}>{status}</span></div>)}</div></div></div>
}

export function CapabilityGrid() {
  const [selected, setSelected] = useState<ProductView | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const area = PRODUCT_AREAS.find(item => item.view === selected)

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal()
  }, [selected])

  function close() { dialog.current?.close() }

  return <>
    <div className="nx-capability-grid">
      {cards.map(card => <article className={`nx-capability-card ${card.className}`} key={card.view}>
        <div className="nx-capability-card-heading"><h3>{card.title}</h3><button type="button" aria-label={`Explore ${PRODUCT_AREAS.find(item => item.view === card.view)?.name}`} aria-haspopup="dialog" onClick={() => setSelected(card.view)}><Expand size={17} /></button></div>
        {card.view === 'check' ? <CheckPreview /> : card.view === 'plan' ? <PlanPreview /> : card.view === 'draft' ? <DraftPreview /> : card.view === 'media' ? <MediaPreview /> : card.view === 'measure' ? <MeasurementPreview /> : <ReviewPreview />}
        <button type="button" className="nx-capability-card-link" onClick={() => setSelected(card.view)}>Explore {PRODUCT_AREAS.find(item => item.view === card.view)?.name.toLowerCase()} <ArrowRight size={13} /></button>
      </article>)}
    </div>
    <dialog ref={dialog} className="nx-capability-dialog" aria-labelledby="nx-capability-dialog-title" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) close() }}>
      {area && <div className="nx-capability-dialog-inner"><button type="button" autoFocus className="nx-capability-dialog-close" aria-label="Close product preview" onClick={close}><X size={21} /></button><p className="nx-platform-eyebrow">{area.tag}</p><h2 id="nx-capability-dialog-title">{area.headline}</h2><p>{area.description}</p><div className="nx-dialog-product"><WorkspacePreview key={area.view} view={area.view} /></div><ul>{area.points.map(point => <li key={point}><Check size={15} />{point}</li>)}</ul><div className="nx-dialog-actions"><Link href={area.destination} className="nx-platform-button" onClick={close}>{area.view === 'check' ? 'Start my free check' : 'Open this workspace tool'} <ArrowRight size={15} /></Link><Link href={`/product#${area.id}`} className="nx-platform-text-link" onClick={close}>Explore the details <ArrowRight size={14} /></Link></div><small>Fictional preview. Your account data stays separate.</small></div>}
    </dialog>
  </>
}
