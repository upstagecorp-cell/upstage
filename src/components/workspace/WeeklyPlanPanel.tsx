'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import type { Asset, Assessment, MetricName, PlanStatus, WeeklyPlan, WorkspaceData } from '@/lib/business/types'
import { addCalendarDays, formatDateKey, getLocalDateKey } from '@/lib/date-time'
import { isPlanOverdue, planProgress, weekStartFor } from '@/lib/business/planning'
import { EXECUTION_GUIDES, guideHref, guidesForAction } from '@/lib/business/guides'
import { buttonClass, Card, DateInput, Empty, Field, fieldClass, labelFor, metrics, secondaryClass, type Mutation } from './shared'

const statuses: Array<{id: PlanStatus;label: string}> = [{id:'planned',label:'Planned'},{id:'in_progress',label:'In progress'},{id:'completed',label:'Completed'},{id:'cancelled',label:'Cancelled'}]
export function WeeklyPlanPanel({ data,mutate,busy,assessmentId,actionId,goalId,openAssessment,openResults }: { data: WorkspaceData; mutate: Mutation; busy: boolean; assessmentId: string|null; actionId: string|null; goalId: string|null; openAssessment: ()=>void; openResults: (assessmentId: string,actionId: string,goalId: string)=>void }) {
  const today = getLocalDateKey(new Date(),data.profile?.timeZone)
  const [weekStart,setWeekStart] = useState(()=>data.weeklyPlans.find(plan=>plan.id===goalId)?.weekStart ?? weekStartFor(today))
  const progress = planProgress(data.weeklyPlans,weekStart,new Date())
  const plans = data.weeklyPlans.filter(plan=>plan.weekStart===weekStart).sort((a,b)=>a.dueDate.localeCompare(b.dueDate))
  return <div className="space-y-6">
    <Card title="Weekly execution plan" description="Turn a saved recommendation into a dated commitment. Completion measures activity, never business health.">
      <div className="flex flex-wrap items-center gap-3"><button className={secondaryClass} onClick={()=>setWeekStart(addCalendarDays(weekStart,-7))}>Previous week</button><strong className="text-sm">{formatDateKey(weekStart,'en-US')}–{formatDateKey(addCalendarDays(weekStart,6),'en-US')}</strong><button className={secondaryClass} onClick={()=>setWeekStart(addCalendarDays(weekStart,7))}>Next week</button><button className={secondaryClass} onClick={()=>setWeekStart(weekStartFor(today))}>This week</button></div>
      <div className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4"><p className="text-sm font-semibold">{progress.completed} of {progress.total} active goals completed{progress.percent===null?'':` (${progress.percent}%)`}</p><p className="mt-2 text-xs opacity-65">{progress.overdue} overdue · cancelled goals excluded · deadlines use each plan’s saved time zone.</p>{progress.percent!==null && <progress aria-label="Weekly activity completion" className="mt-3 h-2 w-full accent-violet-700" max={100} value={progress.percent}/>}<p className="mt-2 text-xs leading-relaxed opacity-65">This is execution progress. Revenue, costs, and conversion are measured separately in Performance.</p></div>
    </Card>
    <Card title="Add a recommendation to this week" description="Choose a saved assessment and action, set a deadline, and choose the metric you will later measure.">
      {data.assessments.length?<PlanForm key={`${weekStart}:${assessmentId}:${actionId}`} data={data} weekStart={weekStart} initialAssessmentId={assessmentId} initialActionId={actionId} mutate={mutate} busy={busy}/>:<><Empty>Run an assessment first so your weekly plan is connected to a business question.</Empty><button className={`${buttonClass} mt-4`} onClick={openAssessment}>View Business Assessment</button></>}
    </Card>
    <Card title="This week’s goals">
      {plans.length?<div className="space-y-5">{plans.map(plan=><PlanCard key={`${plan.id}:${plan.updatedAt}`} plan={plan} data={data} mutate={mutate} busy={busy} highlighted={plan.id===goalId} openResults={()=>openResults(plan.assessmentId,plan.actionId,plan.id)}/>)}</div>:<Empty>No goals for this week. Select a recommendation above; no sample tasks have been added.</Empty>}
    </Card>
  </div>
}

function relatedAssets(assets: Asset[],assessmentId: string,actionId: string) {
  return assets.filter(asset=>asset.assessmentId===assessmentId && asset.actionId===actionId)
}
function AssetLinks({ assets,links,setLinks }: { assets: Asset[];links: WeeklyPlan['assetLinks'];setLinks: (links: WeeklyPlan['assetLinks'])=>void }) {
  return <fieldset className="rounded-xl border border-[var(--border)] p-4"><legend className="px-1 text-sm font-medium">Related asset versions (optional)</legend>{assets.length?<div className="space-y-2">{assets.flatMap(asset=>asset.versions.map(version=><label key={`${asset.id}:${version.version}`} className="flex items-start gap-2 text-xs leading-relaxed"><input type="checkbox" className="mt-0.5 accent-violet-700" checked={links.some(link=>link.assetId===asset.id&&link.version===version.version)} onChange={e=>setLinks(e.target.checked?[...links,{assetId:asset.id,version:version.version}]:links.filter(link=>!(link.assetId===asset.id&&link.version===version.version)))}/><span>{version.title} · v{version.version} · {version.reviewStatus}</span></label>))}</div>:<p className="text-xs leading-relaxed opacity-65">No assets for this recommendation yet. A goal can be planned and completed without creating an ad. Add related versions later if useful.</p>}</fieldset>
}

function PlanForm({ data,weekStart,initialAssessmentId,initialActionId,mutate,busy }: { data: WorkspaceData;weekStart: string;initialAssessmentId: string|null;initialActionId: string|null;mutate: Mutation;busy: boolean }) {
  const initial = data.assessments.find(item=>item.id===initialAssessmentId) ?? data.assessments[data.assessments.length-1]
  const firstAction = initial.recommendedActions.find(item=>item.id===initialActionId) ?? initial.recommendedActions[0]
  const [assessmentId,setAssessmentId] = useState(initial.id)
  const [actionId,setActionId] = useState(firstAction.id)
  const [title,setTitle] = useState(firstAction.title)
  const [dueDate,setDueDate] = useState(addCalendarDays(weekStart,6))
  const [evaluationMetric,setEvaluationMetric] = useState<MetricName>(firstAction.metric)
  const [assetLinks,setAssetLinks] = useState<WeeklyPlan['assetLinks']>([])
  const [notes,setNotes] = useState('')
  const assessment = data.assessments.find(item=>item.id===assessmentId)!
  const chooseAction = (selected: Assessment, id: string) => { const action=selected.recommendedActions.find(item=>item.id===id)!;setActionId(id);setTitle(action.title);setEvaluationMetric(action.metric);setAssetLinks([]) }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate('/api/goals','POST',{assessmentId,actionId,title,weekStart,dueDate,evaluationMetric,assetLinks,notes,status:'planned'},'Weekly goal saved. No business performance has been inferred.')
  }
  return <form onSubmit={submit} className="space-y-4">
    <Field label="Goal assessment"><select className={fieldClass} value={assessmentId} onChange={e=>{const selected=data.assessments.find(item=>item.id===e.target.value)!;setAssessmentId(selected.id);chooseAction(selected,selected.recommendedActions[0].id)}}>{[...data.assessments].reverse().map(item=><option key={item.id} value={item.id}>{item.profileSnapshot.name||'Unnamed business'} · {labelFor(item.profileSnapshot.goal)} · {formatDateKey(item.createdAt.slice(0,10),'en-US')}</option>)}</select></Field>
    <Field label="Recommended action for the goal"><select className={fieldClass} value={actionId} onChange={e=>chooseAction(assessment,e.target.value)}>{assessment.recommendedActions.map(action=><option key={action.id} value={action.id}>{action.title}</option>)}</select></Field>
    <Field label="Goal title"><input className={fieldClass} required maxLength={300} value={title} onChange={e=>setTitle(e.target.value)}/></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Goal due date" hint={`YYYY-MM-DD · ${assessment.profileSnapshot.timeZone}`}><DateInput min={weekStart} max={addCalendarDays(weekStart,6)} value={dueDate} onChange={setDueDate}/></Field><Field label="Goal evaluation metric"><select className={fieldClass} value={evaluationMetric} onChange={e=>setEvaluationMetric(e.target.value as MetricName)}>{metrics.map(metric=><option key={metric} value={metric}>{labelFor(metric)}</option>)}</select></Field></div>
    <AssetLinks assets={relatedAssets(data.assets,assessmentId,actionId)} links={assetLinks} setLinks={setAssetLinks}/>
    <Field label="Weekly plan notes (optional)" hint="Describe your intended work or evidence to collect, not an assumed outcome."><textarea className={fieldClass} maxLength={5000} rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
    <button className={buttonClass} disabled={busy}>{busy?'Saving…':'Save weekly goal'}</button>
  </form>
}

function PlanCard({ plan,data,mutate,busy,highlighted,openResults }: { plan: WeeklyPlan; data: WorkspaceData; mutate: Mutation; busy: boolean; highlighted: boolean; openResults: ()=>void }) {
  const [editing,setEditing] = useState(false)
  const [title,setTitle] = useState(plan.title)
  const [status,setStatus] = useState(plan.status)
  const [dueDate,setDueDate] = useState(plan.dueDate)
  const [metric,setMetric] = useState(plan.evaluationMetric)
  const [notes,setNotes] = useState(plan.notes)
  const [links,setLinks] = useState(plan.assetLinks)
  const [confirmed,setConfirmed] = useState(false)
  const assessment = data.assessments.find(item=>item.id===plan.assessmentId)
  const action = assessment?.recommendedActions.find(item=>item.id===plan.actionId)
  const guideIds = action?.guideIds ?? (action?guidesForAction(action,assessment?.profileSnapshot.businessType):[])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(`/api/goals/${plan.id}`,'PUT',{title,status,dueDate,evaluationMetric:metric,notes,assetLinks:links},'Weekly goal updated. Completion is an activity record only.')
  }
  return <article id={`plan-${plan.id}`} className={`rounded-xl border p-4 ${highlighted?'border-violet-500':'border-[var(--border)]'}`}>
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{plan.title}</h3><span className="text-xs font-semibold">{statuses.find(item=>item.id===plan.status)?.label}{isPlanOverdue(plan,new Date())?' · Overdue':''}</span></div>
    <p className="mt-2 text-xs opacity-65">Due {formatDateKey(plan.dueDate,'en-US')} · {plan.timeZone} · Evaluate with {labelFor(plan.evaluationMetric)}</p>
    <p className="mt-2 text-xs leading-relaxed opacity-65">Recommendation: {action?.title??'Saved recommendation'} · Assessment goal: {assessment?labelFor(assessment.profileSnapshot.goal):'Earlier assessment'}</p>
    {plan.notes&&<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{plan.notes}</p>}
    <div className="mt-3 space-y-1">{plan.assetLinks.length?plan.assetLinks.map(link=>{const asset=data.assets.find(item=>item.id===link.assetId);const version=asset?.versions.find(item=>item.version===link.version);return <Link key={`${link.assetId}:${link.version}`} href={`/workspace?assessment=${encodeURIComponent(plan.assessmentId)}&action=${encodeURIComponent(plan.actionId)}#assets`} className="block text-xs text-violet-700 underline dark:text-violet-300">Related asset: {version?.title??'Saved version'} · v{link.version} · {version?.reviewStatus??'unavailable'}</Link>}):<p className="text-xs opacity-60">No related asset versions. Assets are optional for business actions.</p>}</div>
    <div className="mt-4 flex flex-wrap gap-2"><button className={secondaryClass} onClick={()=>setEditing(!editing)}>{editing?'Close editor':'Edit goal'}</button><button className={secondaryClass} onClick={openResults}>Record action and measured results</button>{guideIds.map(id=>{const guide=EXECUTION_GUIDES.find(item=>item.id===id);return guide?<Link key={id} className={secondaryClass} href={guideHref(id,{assessmentId:plan.assessmentId,actionId:plan.actionId,goalId:plan.id,returnTo:'goals'})}>{guide.title}</Link>:null})}</div>
    {editing&&<form onSubmit={submit} className="mt-5 space-y-4 border-t border-[var(--border)] pt-5"><Field label="Edit goal title"><input className={fieldClass} required maxLength={300} value={title} onChange={e=>setTitle(e.target.value)}/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Goal status"><select className={fieldClass} value={status} onChange={e=>{setStatus(e.target.value as PlanStatus);setConfirmed(false)}}>{statuses.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Edit due date"><DateInput min={plan.weekStart} max={addCalendarDays(plan.weekStart,6)} value={dueDate} onChange={setDueDate}/></Field></div><Field label="Edit evaluation metric"><select className={fieldClass} value={metric} onChange={e=>setMetric(e.target.value as MetricName)}>{metrics.map(item=><option key={item} value={item}>{labelFor(item)}</option>)}</select></Field><AssetLinks assets={relatedAssets(data.assets,plan.assessmentId,plan.actionId)} links={links} setLinks={setLinks}/><Field label="Edit plan notes"><textarea className={fieldClass} rows={2} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>{status==='completed'&&plan.status!=='completed'&&<label className="flex items-start gap-2 text-xs leading-relaxed"><input type="checkbox" required className="mt-0.5 accent-violet-700" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I completed this planned work. This does not mean the business metric improved or an asset was published.</span></label>}<button className={buttonClass} disabled={busy||(status==='completed'&&plan.status!=='completed'&&!confirmed)}>{busy?'Saving…':'Save goal changes'}</button></form>}
  </article>
}
