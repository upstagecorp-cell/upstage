'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EXECUTION_GUIDES } from '@/lib/business/guides'
import { INDUSTRY_TEMPLATES } from '@/lib/business/industry'
import { Card, Empty, Field, fieldClass, labelFor, secondaryClass } from './shared'

export interface GuideContext { guide?: string; assessment?: string; action?: string; goal?: string; returnTo?: 'assessment'|'goals' }
export function GuideExplorer({ context = {} }: { context?: GuideContext }) {
  const [search,setSearch] = useState('')
  const [businessType,setBusinessType] = useState('all')
  const [area,setArea] = useState('all')
  const [selectedId,setSelectedId] = useState(context.guide ?? '')
  const query = search.toLowerCase().trim()
  const filtered = EXECUTION_GUIDES.filter(guide=>(businessType==='all'||!guide.businessTypes.length||guide.businessTypes.includes(businessType as typeof guide.businessTypes[number]))&&(area==='all'||guide.area===area)&&(!query||[guide.title,guide.summary,...guide.records,...guide.steps].join(' ').toLowerCase().includes(query)))
  const selected = filtered.find(guide=>guide.id===selectedId) ?? filtered[0]
  const params = new URLSearchParams()
  if (context.assessment) params.set('assessment',context.assessment)
  if (context.action) params.set('action',context.action)
  if (context.goal) params.set('goal',context.goal)
  const back = context.returnTo==='goals'?`/goals?${params.toString()}`:`/workspace?${params.toString()}#assessment`
  return <div className="mx-auto max-w-6xl space-y-7 px-4 py-10 sm:px-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">Strategy and learning</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Practical guides for your next action</h1><p className="mt-4 max-w-3xl text-sm leading-relaxed opacity-70">Read a focused checklist, identify the records you need, and return to your assessment or weekly plan. Guides are available before signup. They are not a diagnosis of your business.</p></header>
    {context.assessment&&<div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100"><p>This guide was opened from a saved recommendation. Your private business records are not shown on this public page.</p><Link className={`${secondaryClass} mt-3`} href={back}>{context.returnTo==='goals'?'Return to weekly plan':'Return to assessment and action'}</Link></div>}
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Search guides"><input className={fieldClass} value={search} maxLength={200} onChange={e=>setSearch(e.target.value)} placeholder="e.g., costs, conversion, booking"/></Field><Field label="Guide business type"><select className={fieldClass} value={businessType} onChange={e=>setBusinessType(e.target.value)}><option value="all">All business types</option>{INDUSTRY_TEMPLATES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Guide topic"><select className={fieldClass} value={area} onChange={e=>setArea(e.target.value)}><option value="all">All topics</option>{(['acquisition','conversion','retention','profitability','operations'] as const).map(item=><option key={item} value={item}>{labelFor(item)}</option>)}</select></Field></div>
    <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.5fr]"><nav aria-label="Available execution guides" className="space-y-3">{filtered.length?filtered.map(guide=><button key={guide.id} className={`w-full rounded-xl border p-4 text-left ${selected?.id===guide.id?'border-violet-500 bg-violet-50 dark:bg-violet-950/40':'border-[var(--border)] bg-[var(--surface)]'}`} aria-current={selected?.id===guide.id?'page':undefined} onClick={()=>{setSelectedId(guide.id);const url=new URL(window.location.href);url.searchParams.set('guide',guide.id);window.history.replaceState(null,'',url)}}><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{labelFor(guide.area)}</span><strong className="mt-1 block text-sm">{guide.title}</strong><span className="mt-2 block text-xs leading-relaxed opacity-65">{guide.summary}</span></button>):<Empty>No guides match these filters. Try another topic or search term.</Empty>}</nav>
      {selected&&<Card title={selected.title} description={selected.summary}><section><h3 className="text-sm font-semibold">Records to gather</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">{selected.records.map(item=><li key={item}>{item}</li>)}</ul></section><section className="mt-6"><h3 className="text-sm font-semibold">Steps</h3><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed">{selected.steps.map(item=><li key={item}>{item}</li>)}</ol></section><section className="mt-6"><h3 className="text-sm font-semibold">What to evaluate</h3><p className="mt-2 text-sm leading-relaxed">{selected.evaluate}</p></section><p className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 text-xs leading-relaxed">{selected.limits}</p><section className="mt-6"><h3 className="text-sm font-semibold">Related primary references</h3><p className="mt-2 text-xs leading-relaxed opacity-65">These sources support general definitions and principles. The checklist is NEXORA guidance, not an official certification or an industry benchmark.</p><ul className="mt-3 space-y-2">{selected.sources.map(source=><li key={source.url}><a className="break-words text-sm text-violet-700 underline dark:text-violet-300" href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></section><Link className={`${secondaryClass} mt-6`} href={context.assessment?back:'/workspace#assessment'}>{context.assessment?(context.returnTo==='goals'?'Return to weekly plan':'Return to assessment and action'):'Open workspace to apply this guide'}</Link></Card>}
    </div>
  </div>
}
