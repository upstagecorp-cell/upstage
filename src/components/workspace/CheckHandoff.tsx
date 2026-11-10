'use client'

import Link from 'next/link'
import { ArrowRight, Check, Compass } from 'lucide-react'
import type { BusinessProfile } from '@/lib/business/types'
import { CHECK_FOCUSES, type FirstCheck } from '@/lib/business/first-check'
import { BUSINESS_STAGES, INDUSTRY_TEMPLATES } from '@/lib/business/industry'
import type { Mutation } from './shared'

export function CheckHandoff({check,profile,mutate,busy,onSaved,onDismiss}:{check:FirstCheck;profile:BusinessProfile|null;mutate:Mutation;busy:boolean;onSaved:(assessmentId:string)=>void;onDismiss:()=>void}) {
  const focus=CHECK_FOCUSES.find(item=>item.id===check.focus)!
  async function save() {
    const result=await mutate('/api/first-check','POST',{check,confirmed:true,expectedVersion:profile?.version??0},'Your first direction is saved. Choose the next action when you’re ready.')
    if(result)onSaved(result.assessments.at(-1)!.id)
  }
  return <section className="nx-panel mb-7 !border-[#a2bb81] nx-fade-in"><div className="flex items-start gap-4"><span className="nx-choice-icon"><Compass size={23}/></span><div><p className="nx-eyebrow">Pick up where you left off</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Your first check is ready to keep.</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{focus.title} · {INDUSTRY_TEMPLATES.find(item=>item.id===check.businessType)?.label} · {BUSINESS_STAGES.find(item=>item.id===check.stage)?.label}</p>{check.offering&&<p className="mt-2 text-xs leading-6 text-[var(--muted)]">Offer: {check.offering}</p>}<p className="mt-3 text-xs leading-6 text-[var(--muted)]">{profile?'Saving updates this business’s focus, type, stage, and the offer if you provided one. Your existing measurements and reports stay in your account.':'Save these answers and '+check.evidence.length+' measurements to this account. Your first assessment will be ready without repeating the questions.'}</p><div className="mt-5 flex flex-wrap gap-3"><button className="nx-button" disabled={busy} onClick={save}>{busy?'Saving your check…':'Save this check to my account'}<Check size={15}/></button><Link href="/start" className="nx-button nx-button-secondary">Review answers <ArrowRight size={14}/></Link></div><button onClick={onDismiss} disabled={busy} className="mt-4 text-xs font-medium text-[var(--muted)] underline underline-offset-4">{profile?'Continue with my saved business':'Start with a blank workspace'}</button></div></div></section>
}
