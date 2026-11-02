'use client'

import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { BusinessProfile, BusinessProfileInput, BusinessStage, BusinessType } from '@/lib/business/types'
import { createProfileDefaults } from '@/lib/business/validation'
import { BUSINESS_STAGES, INDUSTRY_TEMPLATES, profileQuestions } from '@/lib/business/industry'
import { getUserTimeZone } from '@/lib/date-time'
import { buttonClass, Card, Field, fieldClass, goals, labelFor, secondaryClass, type Mutation } from './shared'

const steps = ['Your business','Your offer and customers','Questions for your situation','Your next objective','Review and save']

export function ProfileWizard({ profile, mutate, busy, onSaved }: { profile: BusinessProfile | null; mutate: Mutation; busy: boolean; onSaved: ()=>void }) {
  const [form,setForm] = useState<BusinessProfileInput>(()=>({ ...createProfileDefaults(getUserTimeZone()),...profile,uiLocale:'en-US',contentLocale:'en-US' }))
  const [channels,setChannels] = useState(profile?.salesChannels.join(', ') ?? '')
  const [step,setStep] = useState(0)
  const set = <K extends keyof BusinessProfileInput>(key: K,value: BusinessProfileInput[K]) => setForm(previous=>({...previous,[key]:value}))
  const questions = profileQuestions(form)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < steps.length-1) { setStep(step+1); return }
    const result = await mutate('/api/profile','PUT',{...form,salesChannels:channels.split(',').map(value=>value.trim()).filter(Boolean)},'Business Profile saved. Unknown information stays unfilled.')
    if (result) onSaved()
  }
  return <Card title="Business Profile" description="Build a picture of your business one step at a time. Skip anything you do not know; no performance data is invented.">
    <ol aria-label="Business Profile steps" className="mb-6 grid grid-cols-5 gap-2">{steps.map((label,index)=><li key={label}><button type="button" onClick={()=>setStep(index)} aria-current={step===index?'step':undefined} className={`h-full w-full rounded-xl p-2 text-left text-xs leading-relaxed ${step===index?'bg-violet-700 text-white':'bg-[var(--surface-muted)]'}`}><span className="block font-bold">{index+1}</span><span className="hidden sm:block">{label}</span></button></li>)}</ol>
    <p className="mb-5 text-sm font-semibold">Step {step+1} of {steps.length}: {steps[step]}</p>
    <form onSubmit={submit} className="space-y-5">
      {step===0 && <>
        <Field label="Business name (optional)" hint="A working name is fine. Leave it blank if you have not chosen one."><input className={fieldClass} maxLength={160} value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="organization" placeholder="e.g., Lakeside Studio" /></Field>
        <Field label="Business type" hint="This changes the questions and interpretation notes. It does not apply an industry score or benchmark."><select className={fieldClass} value={form.businessType??'general'} onChange={e=>set('businessType',e.target.value as BusinessType)}>{INDUSTRY_TEMPLATES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        <Field label="Industry details (optional)" hint="Describe your niche in your own words."><input className={fieldClass} maxLength={160} value={form.industry} onChange={e=>set('industry',e.target.value)} placeholder="e.g., Independent bakery or commercial design" /></Field>
        <Field label="Business stage" hint={BUSINESS_STAGES.find(item=>item.id===(form.stage??'not_sure'))?.help}><select className={fieldClass} value={form.stage??'not_sure'} onChange={e=>set('stage',e.target.value as BusinessStage)}>{BUSINESS_STAGES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Business type of ownership"><select className={fieldClass} value={form.entityType} onChange={e=>set('entityType',e.target.value as BusinessProfileInput['entityType'])}><option value="individual">Individual / sole proprietor</option><option value="company">Company / organization</option></select></Field><Field label="Team size" hint="Include yourself. You can update this later."><input className={fieldClass} type="number" min={1} max={1000000} step={1} value={form.teamSize} onChange={e=>set('teamSize',Number(e.target.value))} /></Field></div>
      </>}
      {step===1 && <>
        <Field label="Products or services (optional)" hint="Describe what is verified. Skip if you are still deciding; tailored marketing drafts will need this later."><textarea className={fieldClass} rows={4} maxLength={5000} value={form.offering} onChange={e=>set('offering',e.target.value)} placeholder="e.g., Brand design consultations delivered by appointment" /></Field>
        <Field label="Target customers (optional)" hint="Describe who has the problem and why they buy. Unknown is allowed."><textarea className={fieldClass} rows={3} maxLength={2000} value={form.customerType} onChange={e=>set('customerType',e.target.value)} placeholder="e.g., Small business owners preparing to launch a new service" /></Field>
        <Field label="Sales channels (optional)" hint="Separate known channels with commas. Leave blank if not decided."><input className={fieldClass} maxLength={1200} value={channels} onChange={e=>setChannels(e.target.value)} placeholder="Website, store, email, marketplace" /></Field>
        <Field label="Website URL (optional)" hint="Stored as a reference only. This app does not fetch or analyze it."><input className={fieldClass} type="url" maxLength={2000} value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://example.com" /></Field>
      </>}
      {step===2 && <>
        <p className="text-sm leading-relaxed opacity-70">These questions adapt to your business type and stage. Answers provide self-reported context, not verified numerical evidence. Leave any answer blank or skip this step.</p>
        {questions.map(question=><Field key={question.id} label={question.question} hint={`${question.why} Useful records: ${question.evidenceHint}`}><textarea className={fieldClass} rows={3} maxLength={3000} value={form.questionAnswers?.[question.id]??''} onChange={e=>set('questionAnswers',{...form.questionAnswers,[question.id]:e.target.value})} placeholder={`Example: ${question.example}`} /></Field>)}
      </>}
      {step===3 && <>
        <Field label="Current goal" hint="A goal directs the next investigation. It does not establish the cause of a problem."><select className={fieldClass} value={form.goal} onChange={e=>set('goal',e.target.value as BusinessProfileInput['goal'])}>{goals.map(goal=><option key={goal} value={goal}>{labelFor(goal)}</option>)}</select></Field>
        <Field label="Brand tone (optional)" hint="Use your own words or keep the suggested tone."><input className={fieldClass} maxLength={1000} value={form.brandTone} onChange={e=>set('brandTone',e.target.value)} placeholder="Clear, helpful, and professional" /></Field>
        <Field label="Target market"><input className={fieldClass} required maxLength={160} value={form.targetMarket} onChange={e=>set('targetMarket',e.target.value)} /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Display currency" hint="Existing records keep their own currency; this does not convert any amounts."><input className={fieldClass} required pattern="[A-Z]{3}" maxLength={3} value={form.currency} onChange={e=>set('currency',e.target.value.toUpperCase())} /></Field><Field label="Your time zone" hint="An IANA time zone, for example America/New_York or America/Chicago."><input className={fieldClass} required maxLength={100} value={form.timeZone} onChange={e=>set('timeZone',e.target.value)} list="profile-timezones" /><datalist id="profile-timezones">{['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Anchorage','Pacific/Honolulu','UTC'].map(zone=><option key={zone} value={zone} />)}</datalist></Field></div>
      </>}
      {step===4 && <>
        <dl className="grid gap-4 rounded-xl bg-[var(--surface-muted)] p-5 text-sm sm:grid-cols-2">{[['Business',form.name||'Not named yet'],['Business type',INDUSTRY_TEMPLATES.find(item=>item.id===form.businessType)?.label??'Other / not sure'],['Stage',BUSINESS_STAGES.find(item=>item.id===form.stage)?.label??'Not sure yet'],['Goal',labelFor(form.goal)],['Offer',form.offering||'Not provided'],['Customers',form.customerType||'Not provided'],['Channels',channels||'Not decided'],['Market / currency',`${form.targetMarket} / ${form.currency}`]].map(([label,value])=><div key={label}><dt className="text-xs font-semibold opacity-60">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>
        <p className="text-sm leading-relaxed opacity-70">You can run a limited assessment without performance metrics. Unknown information remains a visible gap. You will be asked for an offer, customers, and channel before creating tailored marketing drafts.</p>
      </>}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5"><button className={secondaryClass} type="button" disabled={busy||step===0} onClick={()=>setStep(step-1)}><ArrowLeft size={15} aria-hidden="true" />Back</button>{step<steps.length-1 && <button className={secondaryClass} type="button" disabled={busy} onClick={()=>setStep(step+1)}>Skip this step</button>}<button className={buttonClass} disabled={busy}>{busy?'Saving…':step<steps.length-1?'Continue':'Save Business Profile'}{step<steps.length-1?<ArrowRight size={15} aria-hidden="true" />:<Check size={15} aria-hidden="true" />}</button></div>
    </form>
  </Card>
}
