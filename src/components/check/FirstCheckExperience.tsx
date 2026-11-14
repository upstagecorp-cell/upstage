'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BedDouble, BriefcaseBusiness, Check, ChevronDown, Clapperboard, Coffee, Compass, LockKeyhole, Plus, Shapes, ShoppingBag, ShoppingCart, Store } from 'lucide-react'
import type { BusinessGoal, BusinessProfile, MetricName } from '@/lib/business/types'
import { CHECK_FOCUSES, firstCheckProfile, firstDirection, type FirstCheck } from '@/lib/business/first-check'
import { createAssessment } from '@/lib/business/assessment'
import { BUSINESS_STAGES, INDUSTRY_TEMPLATES } from '@/lib/business/industry'
import { addCalendarDays, getLocalDateKey, getUserTimeZone } from '@/lib/date-time'
import { changeFirstCheckFocus, firstCheckMetricPair, restoreFirstCheckNumbers, saveFirstCheckNumbers, type MeasurementDraft } from '@/lib/business/first-check-form'
import { readFirstCheck, readFirstCheckStep, storeFirstCheck } from '@/lib/first-check-session'
import { DateInput, ErrorText, Field, fieldClass, labelFor } from '@/components/workspace/shared'
import { ContextRibbon } from './ContextRibbon'

const icons={general:Shapes,restaurant:Store,cafe:Coffee,accommodation:BedDouble,retail:ShoppingBag,ecommerce:ShoppingCart,services:BriefcaseBusiness,creator:Clapperboard}
const stepNames=['Your focus','Your business','A little context','Your first direction']

export function FirstCheckExperience({initialFocus}:{initialFocus?:BusinessGoal}) {
  const [check,setCheck]=useState<FirstCheck|null>(null)
  const [step,setStep]=useState(initialFocus?1:0)
  const [storageError,setStorageError]=useState('')
  const heading=useRef<HTMLHeadingElement>(null)
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const saved=readFirstCheck()
      setCheck(saved?(initialFocus?changeFirstCheckFocus(saved,initialFocus):saved):{version:1,id:crypto.randomUUID(),focus:initialFocus??'awareness',businessType:'general',stage:'not_sure',offering:'',timeZone:getUserTimeZone(),evidence:[]})
      if(saved&&(!initialFocus||initialFocus===saved.focus))setStep(readFirstCheckStep(saved))
    })
    return ()=>cancelAnimationFrame(frame)
  },[initialFocus])
  const assessment=useMemo(()=>{
    if(!check)return null
    const profile:BusinessProfile={...firstCheckProfile(check),id:check.id,version:1,updatedAt:'1970-01-01T00:00:00Z'}
    return createAssessment(profile,check.evidence.map((item,index)=>({...item,id:`first_${index}`,profileId:profile.id,recordedAt:'1970-01-01T00:00:00Z'})))
  },[check])
  function update(patch:Partial<FirstCheck>) {
    if(!check)return
    const next={...check,...patch}
    setCheck(next)
    if(patch.focus){const url=new URL(window.location.href);url.searchParams.set('focus',patch.focus);window.history.replaceState(null,'',url)}
    if(!storeFirstCheck(next,step))setStorageError('This browser could not keep your answers in this tab. Enable tab storage before saving your check to an account.')
    else setStorageError('')
  }
  function selectFocus(focus:BusinessGoal) {
    if(!check||changeFirstCheckFocus(check,focus)===check)return
    update({focus})
  }
  function go(next:number) { setStep(next);if(check&&!storeFirstCheck(check,next))setStorageError('This browser could not keep your progress. Keep this tab open while continuing.');requestAnimationFrame(()=>{heading.current?.focus();window.scrollTo({top:0,behavior:'instant'})}) }
  if(!check||!assessment)return <div className="nx-page" role="status">Opening your business check…</div>
  const direction=firstDirection(assessment)
  const focus=CHECK_FOCUSES.find(item=>item.id===check.focus)!
  const type=INDUSTRY_TEMPLATES.find(item=>item.id===check.businessType)!
  return <div className={`nx-page !max-w-[1160px] !pt-10 sm:!pt-14 ${step===3?'nx-first-check-result':''}`}>
    <div className="nx-question-layout">
      <aside><p className="nx-eyebrow">A clearer next move</p><ol className="mt-7 flex gap-3 md:block md:space-y-6" aria-label="Your business check progress">{stepNames.map((name,index)=><li key={name} className="flex min-w-0 flex-1 items-center gap-3"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index===step?'bg-[#244d3e] text-white':index<step?'bg-[var(--accent-soft)] text-[var(--foreground)]':'border border-[var(--border)] text-[var(--muted)]'}`}>{index<step?<Check size={12}/>:index+1}</span><span className={`hidden text-xs md:block ${index===step?'font-semibold':'text-[var(--muted)]'}`}>{name}</span></li>)}</ol><p className="mt-10 hidden max-w-[170px] text-xs leading-6 text-[var(--muted)] md:block">A first direction comes from your answers. More evidence can make it more specific.</p></aside>
      <div className="min-w-0"><div className="mb-8"><div className="flex items-center justify-between text-[10px] font-semibold text-[var(--muted)]"><span>{stepNames[step]}</span><span>{step+1} / {stepNames.length}</span></div><div className="nx-check-step-progress"><span style={{width:`${(step+1)/stepNames.length*100}%`}}/></div></div>{step===3&&<ContextRibbon business={type.label} focus={focus.title} action={direction.action?.title??'Choose one next step'}/>}<div className="nx-question" key={step}>
        {step===0&&<><p className="nx-eyebrow">01 / Start with what feels stuck</p><h1 ref={heading} tabIndex={-1} className="nx-heading mt-5 outline-none">What would you most like to figure out?</h1><p className="nx-copy mt-4">Pick the one that’s on your mind. We’ll start there.</p>{check.evidence.length>0&&<p className="mt-4 text-xs leading-6 text-[var(--muted)]">Changing your focus keeps your measured records with their original periods, sources, and currencies.</p>}<div className="mt-8 space-y-3">{CHECK_FOCUSES.map(item=><button className="nx-choice" key={item.id} aria-pressed={check.focus===item.id} onClick={()=>selectFocus(item.id)}><span className="min-w-0 flex-1"><span className="nx-choice-title">{item.title}</span><span className="nx-choice-description">{item.description}</span></span>{check.focus===item.id?<Check size={18}/>:<ArrowUpRight size={17} className="text-[var(--muted)]"/>}</button>)}</div></>}
        {step===1&&<><p className="nx-eyebrow">02 / Make it relevant to you</p><h1 ref={heading} tabIndex={-1} className="nx-heading mt-5 outline-none">What kind of business are you building?</h1><p className="nx-copy mt-4">A booking, a store visit, and a paid project tell different stories.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{INDUSTRY_TEMPLATES.filter(item=>item.id!=='general').concat(INDUSTRY_TEMPLATES.filter(item=>item.id==='general')).map(item=>{const Icon=icons[item.id];return <button className="nx-choice !gap-3 !px-4" key={item.id} aria-pressed={check.businessType===item.id} onClick={()=>update({businessType:item.id})}><span className="nx-choice-icon"><Icon size={19}/></span><span className="nx-choice-title !text-[13px]">{item.label}</span></button>})}</div></>}
        {step===2&&<><p className="nx-eyebrow">03 / Meet you where you are</p><h1 ref={heading} tabIndex={-1} className="nx-heading mt-5 outline-none">Where are you right now?</h1><p className="nx-copy mt-4">The useful next step changes with your stage.</p><div className="mt-8 space-y-3">{BUSINESS_STAGES.filter(item=>item.id!=='not_sure').map(item=><button key={item.id} className="nx-choice" aria-pressed={check.stage===item.id} onClick={()=>update({stage:item.id})}><span className="min-w-0 flex-1"><span className="nx-choice-title">{item.label}</span><span className="nx-choice-description">{item.help}</span></span>{check.stage===item.id&&<Check size={17}/>}</button>)}</div><button className="mt-4 text-xs font-semibold text-[var(--muted)] underline underline-offset-3" onClick={()=>update({stage:'not_sure'})} aria-pressed={check.stage==='not_sure'}>I’m still figuring it out{check.stage==='not_sure'?' ✓':''}</button><div className="mt-8"><Field label="In a sentence, what do you offer? (optional)" hint="Your own words are enough. You can add this later."><input className={fieldClass} maxLength={5000} value={check.offering} onChange={e=>update({offering:e.target.value})} placeholder="e.g., Brand design for independent businesses"/></Field></div></>}
        {step===3&&<><div className="flex flex-wrap gap-2"><span className="nx-tag">{type.label}</span><span className="nx-tag">{BUSINESS_STAGES.find(item=>item.id===check.stage)?.label}</span></div><p className="nx-eyebrow mt-7">Your first direction</p><h1 ref={heading} tabIndex={-1} className="nx-heading mt-5 outline-none">{direction.headline}</h1><p className="nx-copy mt-5">{direction.explanation}</p><div className="nx-dark-card mt-8"><div className="nx-orbit"/><div className="relative"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#c4dcab]"><Compass size={15}/>One useful next step</p><p className="mt-5 text-xl font-medium leading-relaxed tracking-tight">{direction.task}</p><div className="mt-6 flex flex-wrap items-center gap-5"><Link href="/register?from=check" onClick={e=>{if(!storeFirstCheck(check)){e.preventDefault();setStorageError('Enable tab storage to keep your answers before creating an account.')}}} className="nx-button nx-button-lime !min-h-10 !px-4 !py-2 !text-xs">Save my direction & build a plan <ArrowUpRight size={15}/></Link><Link href={`/explore?guide=${direction.guideId}`} className="inline-flex items-center gap-2 text-xs font-semibold text-[#d5ef91]">Show me how <ArrowUpRight size={14}/></Link></div></div></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2"><div><h2 className="text-xs font-semibold">What you told us</h2><p className="mt-2 text-sm leading-7 text-[var(--muted)]">{focus.title}.{check.offering&&` You offer ${check.offering}.`}</p></div><div><h2 className="text-xs font-semibold">What would make this more specific</h2><p className="mt-2 text-sm leading-7 text-[var(--muted)]">{check.evidence.length?'Check that these records cover the same channel and population.':'A small set of real records. You can start with what you have.'}</p></div></div>
          {check.evidence.length>0&&<section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-xs font-semibold">From the measurements you entered</h2><ul className="mt-3 space-y-3 text-xs leading-6 text-[var(--muted)]">{assessment.facts.filter(item=>item.area===(check.focus==='awareness'?'acquisition':check.focus==='operations'?'profitability':check.focus)).slice(-3).map((fact,index)=><li key={index}>{fact.description}</li>)}</ul></section>}
          <details className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><summary className="flex items-center justify-between gap-3 text-sm font-semibold"><span className="flex items-center gap-2"><Plus size={16}/>Make this more specific with my numbers</span><ChevronDown size={15}/></summary><NumbersForm key={`${check.id}:${check.focus}`} check={check} onSaved={evidence=>update({evidence})}/></details>
          <div className="mt-8 border-t border-[var(--border)] pt-6"><p className="text-[11px] text-[var(--muted)]">Already have an account? <Link href="/login?from=check" className="font-semibold underline underline-offset-3">Log in to save this check</Link></p></div><p className="mt-5 text-[11px] leading-6 text-[var(--muted)]">This is an initial investigation based on your answers and any records you entered. It does not establish the cause of a business problem.</p></>}
      </div><ErrorText error={storageError}/><div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6">{step>0?<button className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]" onClick={()=>go(step-1)}><ArrowLeft size={14}/>{step===3?'Change my answers':'Back'}</button>:<Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><ArrowLeft size={14}/>Home</Link>}{step<3&&<button className="nx-button" onClick={()=>{update({});go(step+1)}}>{step===2?'See my first direction':'Continue'}<ArrowRight size={16}/></button>}</div><p className="mt-7 flex items-start gap-2 text-[10px] leading-5 text-[var(--muted)]"><LockKeyhole size={12} className="mt-1 shrink-0"/>Your answers stay in this tab until you choose to save them to an account.</p></div>
    </div>
    {step===3&&<div className="nx-mobile-check-save"><div><small>YOUR FIRST DIRECTION</small><strong>{focus.title}</strong></div><Link href="/register?from=check" className="nx-button" onClick={event=>{if(!storeFirstCheck(check,3)){event.preventDefault();setStorageError('Enable tab storage to keep your answers before creating an account.')}}}>Save &amp; continue <ArrowRight size={15}/></Link></div>}
  </div>
}

function NumbersForm({check,onSaved}:{check:FirstCheck;onSaved:(evidence:FirstCheck['evidence'])=>void}) {
  const pair=firstCheckMetricPair(check.focus)
  const [draft,setDraft]=useState(()=>restoreFirstCheckNumbers(check))
  const [error,setError]=useState('')
  const [saved,setSaved]=useState(false)
  const money=pair.includes('revenue')
  const today=getLocalDateKey(new Date(),check.timeZone)
  function edit(metric:MetricName,patch:Partial<MeasurementDraft>,shared=false) {
    setDraft(current=>{
      const records={...current.records}
      for(const target of shared?pair:[metric])records[target]={...records[target]!,...patch}
      return {...current,records}
    })
    setSaved(false)
  }
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError('')
    try {
      onSaved(saveFirstCheckNumbers(check,draft,today));setSaved(true)
    }catch(failure){setError(failure instanceof Error?failure.message:'Check the measurements.')}
  }
  function numberField(metric:MetricName) {
    return <Field key={metric} label={labelFor(metric)}><input className={fieldClass} inputMode={money?'decimal':'numeric'} maxLength={30} value={draft.records[metric]!.value} placeholder="Leave blank if unknown" onChange={e=>edit(metric,{value:e.target.value})}/></Field>
  }
  function metadataFields(metric:MetricName,shared=false) {
    const record=draft.records[metric]!
    const measured=(shared?pair:[metric]).some(target=>draft.records[target]!.value.trim())
    return <><div className="grid gap-4 sm:grid-cols-2"><Field label="Reporting period start"><DateInput max={today} value={record.periodStart} onChange={periodStart=>edit(metric,{periodStart},shared)}/></Field><Field label="Reporting period end"><DateInput min={record.periodStart||undefined} max={today} value={record.periodEnd} onChange={periodEnd=>edit(metric,{periodEnd},shared)}/></Field></div><button type="button" className="text-[11px] font-semibold underline underline-offset-3" onClick={()=>edit(metric,{periodStart:addCalendarDays(today,-7),periodEnd:addCalendarDays(today,-1)},shared)}>Use the last 7 completed days</button>{money&&<Field label="Measurement currency" hint="Enter amounts in major units (dollars for USD), not cents."><input className={fieldClass} required={measured} maxLength={3} pattern="[A-Z]{3}" value={record.currency} onChange={e=>edit(metric,{currency:e.target.value.toUpperCase()},shared)}/></Field>}<Field label="Where did these numbers come from?"><input className={fieldClass} required={measured} maxLength={1000} value={record.sourceNote} onChange={e=>edit(metric,{sourceNote:e.target.value},shared)} placeholder="e.g., My store’s sales report"/></Field></>
  }
  return <form className="mt-6 space-y-4" onSubmit={submit}>
    <p className="text-xs leading-6 text-[var(--muted)]">Use records from one channel and period. Unknown values can stay blank. Enter 0 only if you measured zero. Updating these measurements keeps your other saved records. Clearing a saved value removes only that measurement.</p>
    {draft.separateMetadata?<><p role="status" className="text-xs leading-6 text-[var(--muted)]">These records have different periods, sources, or currencies. Edit each record’s original context separately. Different periods or currencies are not compared.</p>{pair.map(metric=><fieldset key={metric} className="space-y-4 rounded-xl border border-[var(--border)] p-4"><legend className="px-1 text-xs font-semibold">{labelFor(metric)}</legend>{numberField(metric)}{metadataFields(metric)}</fieldset>)}</>:<><div className="grid gap-4 sm:grid-cols-2">{pair.map(numberField)}</div>{metadataFields(pair[0],true)}</>}
    <ErrorText error={error}/><button className="nx-button" type="submit">Update my direction <ArrowRight size={15}/></button>{saved&&<p className="text-xs font-semibold text-[var(--accent)]" role="status">Your direction now includes these measurements.</p>}
  </form>
}
