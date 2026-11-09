'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ClipboardList, Info } from 'lucide-react'
import type { Assessment, BusinessProfile, Evidence } from '@/lib/business/types'
import { EvidenceLine } from './ProfileAndEvidence'
import { EXECUTION_GUIDES, guideHref, guidesForAction } from '@/lib/business/guides'
import { BUSINESS_STAGES } from '@/lib/business/industry'
import { buttonClass, Card, Empty, labelFor, secondaryClass, timestamp, type Mutation } from './shared'

export function AssessmentPanel({ profile, evidence, assessments, selected, selectAssessment, mutate, busy, openAssets, openEvidence, openResults, openPlan }: {
  profile: BusinessProfile; evidence: Evidence[]; assessments: Assessment[]; selected: Assessment | null;
  selectAssessment: (id: string) => void; mutate: Mutation; busy: boolean;
  openAssets: (assessmentId: string, actionId: string) => void; openEvidence: () => void; openResults: (assessmentId: string, actionId: string) => void;
  openPlan: (assessmentId: string, actionId: string) => void;
}) {
  const [excluded, setExcluded] = useState<string[]>([])
  const selectedIds = evidence.filter(item => !excluded.includes(item.id)).map(item => item.id)

  async function assess() {
    const result = await mutate('/api/assessments', 'POST', { evidenceIds: selectedIds }, 'Assessment saved. Earlier assessments are preserved.')
    if (result?.assessments.length) selectAssessment(result.assessments[result.assessments.length - 1].id)
  }

  return <div className="space-y-6">
    <Card title="Business Assessment" description="Review what your evidence supports, what remains uncertain, and which action to take next.">
      <div className="flex items-start gap-3 rounded-xl bg-violet-50 p-4 text-sm leading-relaxed text-violet-900 dark:bg-violet-950/40 dark:text-violet-200"><Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" /><p>Assessments use documented rules and your saved information. They describe evidence and possible explanations; they do not assign a readiness score or predict success.</p></div>
      <details className="mt-5 rounded-xl border border-[var(--border)] p-4">
        <summary className="cursor-pointer text-sm font-semibold">Evidence for the next assessment ({selectedIds.length} selected)</summary>
        <p className="mt-3 text-xs leading-relaxed opacity-65">Choose relevant measurements. Values from different currencies or periods are not combined. Saved results also appear here as evidence.</p>
        {evidence.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{evidence.map(item => <label key={item.id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3"><input className="mt-1 size-4 shrink-0 accent-violet-700" type="checkbox" checked={!excluded.includes(item.id)} onChange={e => setExcluded(previous => e.target.checked ? previous.filter(id => id !== item.id) : [...previous, item.id])} /><div className="min-w-0 flex-1"><EvidenceLine item={item} /></div></label>)}</div> : <p className="mt-4 text-sm opacity-65">No evidence selected. A limited assessment can identify information to collect.</p>}
      </details>
      <div className="mt-5 flex flex-wrap gap-3"><button className={buttonClass} disabled={busy} onClick={assess}><ClipboardList size={16} aria-hidden="true" />{busy ? 'Assessing…' : assessments.length ? 'Reassess with selected evidence' : 'Run assessment'}</button><button className={secondaryClass} onClick={openEvidence}>Add evidence</button></div>
    </Card>

    {profile.businessType === 'ecommerce' && <Card title="Go deeper on one online-shop problem" description="Follow the funnel, answer the next question, and finish a cost worksheet or a concrete improvement plan."><Link href="/workspace#focus" className={buttonClass}>Open the focused workflow <ArrowRight size={15} aria-hidden="true" /></Link></Card>}

    {selected ? <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">Assessment report</h2><p className="mt-1 text-xs opacity-65">{timestamp(selected.createdAt, 'en-US', profile.timeZone)} · Profile version {selected.profileVersion} · {selected.evidenceIds.length} evidence records</p></div>
        <label className="flex items-center gap-2 text-sm">Saved assessment<select className="max-w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-sm" value={selected.id} onChange={e => selectAssessment(e.target.value)}>{[...assessments].reverse().map((item, index) => <option key={item.id} value={item.id}>{timestamp(item.createdAt, 'en-US', profile.timeZone)}{index === 0 ? ' (latest)' : ''}</option>)}</select></label>
      </div>
      <p className="text-sm opacity-65">Goal: {labelFor(selected.profileSnapshot.goal)} · {selected.profileSnapshot.name} · {selected.profileSnapshot.targetMarket}</p>
      {selected.profileVersion !== profile.version && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This assessment uses an earlier profile snapshot. Reassess to use your latest saved profile.</p>}
      {selected.industryContext&&<Card title={`${selected.industryContext.label}: questions and interpretation`} description={`Stage: ${BUSINESS_STAGES.find(item=>item.id===selected.industryContext?.stage)?.label??'Not sure yet'}. These are context-specific investigation notes, not validated industry averages.`}><ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">{selected.industryContext.interpretations.map(note=><li key={note}>{note}</li>)}</ul><details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Business-specific questions and supporting records</summary><div className="mt-3 space-y-4">{selected.industryContext.questions.map(question=><div key={question.id}><h3 className="text-sm font-semibold">{question.question}</h3><p className="mt-1 whitespace-pre-wrap text-sm opacity-75">{question.answer?`Self-reported context: ${question.answer}`:'Not answered. You can add this information later.'}</p><p className="mt-1 text-xs leading-relaxed opacity-65">Useful evidence: {question.evidenceHint}</p></div>)}</div></details></Card>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Observed Facts" description="Statements supported by the selected records.">{selected.facts.length ? <div className="space-y-4">{selected.facts.map((finding, index) => <div key={index}><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{labelFor(finding.area)}</span><p className="mt-1 text-sm leading-relaxed">{finding.description}</p>{finding.evidenceIds.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-xs opacity-65">View supporting evidence ({finding.evidenceIds.length})</summary><div className="mt-2 space-y-2">{finding.evidenceIds.map(id => { const item = evidence.find(entry => entry.id === id); return item ? <EvidenceLine key={id} item={item} /> : <p key={id} className="text-xs opacity-65">Evidence unavailable.</p> })}</div></details>}</div>)}</div> : <Empty>No numerical conclusion is supported by the selected evidence.</Empty>}</Card>
        <Card title="Problems and opportunities">{selected.opportunities.length ? <ul className="space-y-4">{selected.opportunities.map((finding, index) => <li key={index}><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{labelFor(finding.area)}</span><p className="mt-1 text-sm leading-relaxed">{finding.description}</p></li>)}</ul> : <Empty>More evidence is needed to identify a specific opportunity.</Empty>}</Card>
        <TextList title="Possible Causes" description="Hypotheses to investigate, rather than confirmed causes." items={selected.possibleCauses} empty="There is not enough evidence to propose a specific cause." />
        <TextList title="Alternative Explanations" items={selected.alternativeExplanations} empty="Alternative explanations cannot be narrowed down yet." />
      </div>
      <TextList title="More Information Needed" items={selected.missingInformation} empty="No additional gaps were identified by the current assessment rules. This is not a complete audit of your business." />
      <Card title="Recommended Actions" description="These priorities are stored with this assessment and used throughout your workspace.">
        <div className="space-y-4">{selected.recommendedActions.map((action, index) => <article key={action.id} className="rounded-xl border border-[var(--border)] p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-800">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium opacity-60">{labelFor(action.area)}</p><h3 className="mt-1 font-semibold">{action.title}</h3><p className="mt-2 text-sm leading-relaxed opacity-75">{action.reason}</p><p className="mt-3 text-xs font-medium">Evaluate with: {labelFor(action.metric)}</p>
          {action.kind === 'marketing_assets' ? <button className={`${buttonClass} mt-4`} onClick={() => openAssets(selected.id, action.id)}>Create Marketing Assets <ArrowRight size={15} aria-hidden="true" /></button> : action.kind === 'collect_data' ? <button className={`${secondaryClass} mt-4`} onClick={openEvidence}>Collect and add evidence</button> : <p className="mt-3 text-xs leading-relaxed opacity-65">Review this action in your business, then add the measurements you collect and reassess. An automated service for this action is not available.</p>}
          {action.kind !== 'marketing_assets' && <button className={`${secondaryClass} mt-3 sm:ml-2`} onClick={()=>openResults(selected.id,action.id)}>Record completed action and results</button>}
          <div className="mt-3 flex flex-wrap gap-2"><button className={secondaryClass} onClick={()=>openPlan(selected.id,action.id)}>Plan this action</button>{(action.guideIds??guidesForAction(action,selected.profileSnapshot.businessType)).map(id=>{const guide=EXECUTION_GUIDES.find(item=>item.id===id);return guide?<Link key={id} className={secondaryClass} href={guideHref(id,{assessmentId:selected.id,actionId:action.id,returnTo:'assessment'})}>{guide.title}</Link>:null})}</div>
          </div></div>
        </article>)}</div>
      </Card>
    </> : <Card><Empty>Your assessment report will appear here after you run an assessment. No metrics are filled in automatically.</Empty></Card>}
  </div>
}

function TextList({ title, description, items, empty }: { title: string; description?: string; items: string[]; empty: string }) {
  return <Card title={title} description={description}>{items.length ? <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <Empty>{empty}</Empty>}</Card>
}
