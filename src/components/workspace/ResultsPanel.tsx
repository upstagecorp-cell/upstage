'use client'

import { useState, type FormEvent } from 'react'
import type { AssetExecution, MetricName, Result, WeeklyPlan, WorkspaceData } from '@/lib/business/types'
import { compareResults } from '@/lib/business/assessment'
import { formatMetric, formatMoneyMinor, parseMoneyToMinor } from '@/lib/business/format'
import { formatDateKey, getLocalDateKey } from '@/lib/date-time'
import { buttonClass, Card, DateInput, Empty, ErrorText, Field, fieldClass, isMoneyMetric, labelFor, metrics, secondaryClass, timestamp, UtcDateTimeInput, type Mutation } from './shared'

interface ActionContext { assessmentId?: string|null; actionId?: string|null; plan?: WeeklyPlan }
export function ResultsPanel({ data, mutate, busy, openAssets, openAssessment, ...context }: { data: WorkspaceData; mutate: Mutation; busy: boolean; openAssets: () => void; openAssessment: () => void } & ActionContext) {
  const approved = data.assets.flatMap(asset => asset.versions.filter(version => version.reviewStatus === 'approved').map(version => ({ asset, version })))
  const manualAssessments = data.assessments.filter(assessment => assessment.recommendedActions.some(action => action.kind !== 'marketing_assets'))
  const selectedKind=data.assessments.find(item=>item.id===context.assessmentId)?.recommendedActions.find(item=>item.id===context.actionId)?.kind
  const [entry,setEntry]=useState<'action'|'use'|'measurement'>(()=>selectedKind==='marketing_assets'?'use':'action')
  const record:Mutation=async(...args)=>{const result=await mutate(...args);if(result&&args[0]==='/api/executions')setEntry('measurement');return result}
  return <div className="space-y-6">
    {context.plan&&<Card title={`Weekly goal: ${context.plan.title}`}><p className="text-sm leading-relaxed">Evaluate with {labelFor(context.plan.evaluationMetric)}. The related action and available records are selected below. Goal completion, actual asset use, and measured outcomes are separate records.</p></Card>}
    <nav className="flex flex-wrap gap-2" aria-label="What to record">{([{id:'action',label:'A business action'},{id:'use',label:'Use of an approved draft'},{id:'measurement',label:'A measured outcome'}] as const).map(item=><button key={item.id} aria-current={entry===item.id?'page':undefined} className={`rounded-xl px-4 py-3 text-xs font-semibold ${entry===item.id?'bg-[#244d3e] text-white':'border border-[var(--border)] bg-[var(--surface)]'}`} onClick={()=>setEntry(item.id)}>{item.label}</button>)}</nav>
    {entry==='action'&&<Card title="Record completed business action" description="Keep a record of a cost review, data collection, or another recommendation you completed.">
      {manualAssessments.length ? <BusinessActionForm key={`${manualAssessments.map(item => item.id).join(',')}:${context.assessmentId}:${context.actionId}`} data={data} mutate={record} busy={busy} context={context} /> : <><Empty>Run an assessment to receive business recommendations before recording a completed action.</Empty><button className={`${secondaryClass} mt-4`} onClick={openAssessment}>View Business Assessment</button></>}
    </Card>}
    {entry==='use'&&<Card title="Record approved asset use" description="Choose the exact version you actually used or posted.">
      {approved.length ? <ExecutionForm key={`${approved.map(item => `${item.asset.id}:${item.version.version}`).join(',')}:${context.assessmentId}:${context.actionId}:${context.plan?.id}`} data={data} mutate={record} busy={busy} context={context} /> : <><Empty>Approve an asset version before recording its use.</Empty><button className={`${secondaryClass} mt-4`} onClick={openAssets}>Review assets</button></>}
    </Card>}
    {entry==='measurement'&&<Card title="Results" description="Record the actual measurement, source, and reporting period.">
      {data.executions.length ? <ResultForm key={`${data.executions.map(item => item.id).join(',')}:${context.assessmentId}:${context.actionId}:${context.plan?.id}`} data={data} mutate={mutate} busy={busy} context={context} /> : <Empty>Record a completed business action or actual use of an approved asset first. You can also add general business measurements in Business Evidence.</Empty>}
    </Card>}
    {data.results.length > 0 && <Card title="Measured outcomes" description="Before-and-after changes describe what happened. They do not prove that an asset or NEXORA caused the change."><div className="space-y-5">{[...data.results].reverse().map(result => <ResultCard key={result.id} result={result} data={data} />)}</div><button className={`${buttonClass} mt-5`} onClick={openAssessment}>Reassess with saved results</button></Card>}
    <Card title="Completed actions and actual use">{data.executions.length ? <ul className="space-y-3">{[...data.executions].reverse().map(execution => <li key={execution.id} className="rounded-xl border border-[var(--border)] p-4 text-sm"><p className="font-semibold">{executionLabel(data, execution)}</p><p className="mt-1 text-xs opacity-65">{execution.channel} · {timestamp(execution.usedAt, 'en-US', data.profile?.timeZone)} ({data.profile?.timeZone ?? 'UTC'})</p>{execution.notes && <p className="mt-2 whitespace-pre-wrap leading-relaxed opacity-75">{execution.notes}</p>}</li>)}</ul> : <Empty>No completed action or actual use has been recorded.</Empty>}</Card>
  </div>
}

function executionLabel(data: WorkspaceData, execution: AssetExecution) {
  if (execution.assetId) {
    const asset = data.assets.find(item => item.id === execution.assetId)
    const version = asset?.versions.find(item => item.version === execution.assetVersion)
    return `${version?.title ?? 'Approved asset'} · Version ${execution.assetVersion}`
  }
  const action = data.assessments.find(item => item.id === execution.assessmentId)?.recommendedActions.find(item => item.id === execution.actionId)
  return `Business action: ${action?.title ?? 'Completed recommendation'}`
}

function executionMetric(data: WorkspaceData, execution: AssetExecution): MetricName {
  if (execution.assetId) return data.assets.find(item => item.id === execution.assetId)?.measurementMetric ?? 'visitors'
  return data.assessments.find(item => item.id === execution.assessmentId)?.recommendedActions.find(item => item.id === execution.actionId)?.metric ?? 'visitors'
}

function BusinessActionForm({ data, mutate, busy, context }: { data: WorkspaceData; mutate: Mutation; busy: boolean; context: ActionContext }) {
  const assessments = [...data.assessments].reverse().filter(assessment => assessment.recommendedActions.some(action => action.kind !== 'marketing_assets'))
  const initial = assessments.find(item=>item.id===context.assessmentId && item.recommendedActions.some(action=>action.id===context.actionId && action.kind!=='marketing_assets')) ?? assessments[0]
  const [assessmentId, setAssessmentId] = useState(initial.id)
  const [actionId, setActionId] = useState(initial.recommendedActions.find(action=>action.id===context.actionId && action.kind!=='marketing_assets')?.id ?? initial.recommendedActions.find(action => action.kind !== 'marketing_assets')!.id)
  const [channel, setChannel] = useState('Business operations')
  const [usedAt, setUsedAt] = useState(new Date().toISOString().slice(0, 23))
  const [recordNow,setRecordNow]=useState(true)
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const selected = assessments.find(item => item.id === assessmentId) ?? initial
  const actions = selected.recommendedActions.filter(action => action.kind !== 'marketing_assets')
  const action = actions.find(item => item.id === actionId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const instant = recordNow?new Date():new Date(`${usedAt}Z`)
    const recordedAt = new Date()
    if (Number.isNaN(instant.getTime()) || instant > recordedAt) { setError('Choose a valid completion date and time in the past.'); return }
    if (instant.getTime() < new Date(selected.createdAt).getTime()) { setError('Completion must be on or after the selected assessment.'); return }
    const result = await mutate('/api/executions', 'POST', { assessmentId, actionId, channel, usedAt: instant.toISOString(), notes }, 'Completed business action recorded. Add measured results below; no performance change has been inferred.')
    if (result) { setNotes(''); setConfirmed(false) }
  }

  return <form className="space-y-4" onSubmit={submit}>
    <Field label="Related assessment"><select className={fieldClass} value={assessmentId} onChange={e => { const next = assessments.find(item => item.id === e.target.value)!; setAssessmentId(next.id); setActionId(next.recommendedActions.find(item => item.kind !== 'marketing_assets')!.id); setConfirmed(false) }}>{assessments.map(item => <option key={item.id} value={item.id}>{timestamp(item.createdAt, 'en-US', data.profile?.timeZone)} · {labelFor(item.profileSnapshot.goal)}</option>)}</select></Field>
    <Field label="Completed recommended action"><select className={fieldClass} value={actionId} onChange={e => { setActionId(e.target.value); setConfirmed(false) }}>{actions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
    {action && <p className="text-xs leading-relaxed opacity-65">{action.reason} Evaluate with: {labelFor(action.metric)}.</p>}
    <Field label="Channel or business context"><input className={fieldClass} required maxLength={200} value={channel} onChange={e => setChannel(e.target.value)} placeholder="For example, bookkeeping or supplier review" /></Field>
    <RecordTime recordNow={recordNow} setRecordNow={setRecordNow} value={usedAt} onChange={setUsedAt} min={selected.createdAt.slice(0,23)} timeZone={data.profile?.timeZone}/>
    <Field label="Completion notes (optional)"><textarea className={fieldClass} rows={3} maxLength={5000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe the work you completed and what you observed." /></Field>
    <label className="flex items-start gap-3 text-sm leading-relaxed"><input className="mt-1 size-4 shrink-0 accent-emerald-700" type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>I completed this recommended business action at the recorded time.</span></label>
    <ErrorText error={error} /><button className={buttonClass} disabled={busy || !confirmed || !action}>{busy ? 'Saving…' : 'Record completed business action'}</button>
  </form>
}

function ExecutionForm({ data, mutate, busy, context }: { data: WorkspaceData; mutate: Mutation; busy: boolean; context: ActionContext }) {
  const approved = data.assets.flatMap(asset => asset.versions.filter(version => version.reviewStatus === 'approved').map(version => ({ asset, version })))
  const initial = approved.find(item=>context.plan?.assetLinks.some(link=>link.assetId===item.asset.id && link.version===item.version.version)) ?? approved.find(item=>item.asset.assessmentId===context.assessmentId && item.asset.actionId===context.actionId) ?? approved[0]
  const [selection, setSelection] = useState(`${initial.asset.id}:${initial.version.version}`)
  const [channel, setChannel] = useState(initial.asset.channel)
  const [usedAt, setUsedAt] = useState(new Date().toISOString().slice(0, 23))
  const [recordNow,setRecordNow]=useState(true)
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const [assetId, assetVersion] = selection.split(':')
    const instant = recordNow?new Date():new Date(`${usedAt}Z`)
    if (Number.isNaN(instant.getTime()) || instant.getTime() > Date.now()) { setError('Choose a valid date and time in the past.'); return }
    const result = await mutate('/api/executions', 'POST', { assetId, assetVersion: Number(assetVersion), channel, usedAt: instant.toISOString(), notes }, 'Actual use recorded. No business result has been inferred.')
    if (result) { setNotes(''); setConfirmed(false) }
  }

  return <form className="space-y-4" onSubmit={submit}>
    <Field label="Approved asset and version"><select className={fieldClass} value={selection} onChange={e => { setSelection(e.target.value); setChannel(approved.find(item => `${item.asset.id}:${item.version.version}` === e.target.value)?.asset.channel ?? '') }}>{approved.map(item => <option key={`${item.asset.id}:${item.version.version}`} value={`${item.asset.id}:${item.version.version}`}>{item.version.title} · Version {item.version.version}</option>)}</select></Field>
    <Field label="Channel actually used"><input className={fieldClass} required maxLength={200} value={channel} onChange={e => setChannel(e.target.value)} /></Field>
    <RecordTime recordNow={recordNow} setRecordNow={setRecordNow} value={usedAt} onChange={setUsedAt} timeZone={data.profile?.timeZone}/>
    <Field label="Use notes (optional)"><textarea className={fieldClass} rows={2} maxLength={5000} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <label className="flex items-start gap-3 text-sm leading-relaxed"><input className="mt-1 size-4 shrink-0 accent-emerald-700" type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>I actually used or posted this approved version at the recorded time.</span></label>
    <ErrorText error={error} /><button className={buttonClass} disabled={busy || !confirmed}>{busy ? 'Saving…' : 'Record actual use'}</button>
  </form>
}

function RecordTime({recordNow,setRecordNow,value,onChange,min,timeZone}:{recordNow:boolean;setRecordNow:(value:boolean)=>void;value:string;onChange:(value:string)=>void;min?:string;timeZone?:string}) {
  return <div className="rounded-xl bg-[var(--surface-muted)] p-4"><p className="text-xs font-semibold">When did this happen?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={`${recordNow?buttonClass:secondaryClass} !min-h-9 !px-3 !py-2 !text-xs`} aria-pressed={recordNow} onClick={()=>setRecordNow(true)}>Just now</button><button type="button" className={`${recordNow?secondaryClass:buttonClass} !min-h-9 !px-3 !py-2 !text-xs`} aria-pressed={!recordNow} onClick={()=>setRecordNow(false)}>Choose an earlier time</button></div>{recordNow?<p className="mt-3 text-[11px] text-[var(--muted)]">Uses the current time when you save. Displayed in {timeZone??'UTC'}.</p>:<div className="mt-4"><Field label="Recorded time (UTC)" hint="YYYY-MM-DDTHH:MM:SS.sss, in UTC. Your business time is shown below."><UtcDateTimeInput min={min} value={value} onChange={onChange}/></Field>{value&&!Number.isNaN(new Date(`${value}Z`).getTime())&&<p className="mt-3 text-xs text-[var(--muted)]">{timestamp(new Date(`${value}Z`).toISOString(),'en-US',timeZone)} ({timeZone??'UTC'})</p>}</div>}</div>
}
function ResultForm({ data, mutate, busy, context }: { data: WorkspaceData; mutate: Mutation; busy: boolean; context: ActionContext }) {
  const related = [...data.executions].reverse().find(execution=>{
    const asset = data.assets.find(item=>item.id===execution.assetId)
    return (execution.assessmentId??asset?.assessmentId)===context.assessmentId && (execution.actionId??asset?.actionId)===context.actionId
  })
  const initial = related ?? data.executions[data.executions.length - 1]
  const [executionId, setExecutionId] = useState(initial.id)
  const [metric, setMetric] = useState<MetricName>(() => related&&context.plan ? context.plan.evaluationMetric : executionMetric(data,initial))
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState(data.profile?.currency ?? 'USD')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [adSpend, setAdSpend] = useState('')
  const [adSpendCurrency, setAdSpendCurrency] = useState(data.profile?.currency ?? 'USD')
  const [priceChangeNote, setPriceChangeNote] = useState('')
  const [sourceNote, setSourceNote] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const money = isMoneyMetric(metric)
  const today = getLocalDateKey(new Date(), data.profile?.timeZone)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    let parsed: number | null = null
    let spend: number | null = null
    try { parsed = money ? parseMoneyToMinor(value, currency) : /^\d+$/.test(value.trim()) ? Number(value) : null; spend = adSpend.trim() ? parseMoneyToMinor(adSpend, adSpendCurrency) : null } catch { /* validated below */ }
    if (parsed === null || !Number.isSafeInteger(parsed) || parsed < 0) { setError('Enter a valid nonnegative measurement. Missing values are not treated as zero.'); return }
    if (adSpend.trim() && (spend === null || spend < 0)) { setError('Enter a valid nonnegative ad spend amount and currency, or leave it blank when unknown.'); return }
    if (periodEnd < periodStart) { setError('The end date must be on or after the start date.'); return }
    const result = await mutate('/api/results', 'POST', { executionId, metric, value: parsed, unit: money ? 'minor' : 'count', currency: money ? currency : null, periodStart, periodEnd, adSpendMinor: spend, adSpendCurrency: spend === null ? null : adSpendCurrency, priceChangeNote, source: 'manual', sourceNote, notes }, 'Result saved and added to the evidence available for reassessment.')
    if (result) { setValue(''); setAdSpend(''); setNotes('') }
  }

  return <form className="space-y-4" onSubmit={submit}>
    <Field label="Related completed action or actual use"><select className={fieldClass} value={executionId} onChange={e => { setExecutionId(e.target.value); const execution = data.executions.find(item => item.id === e.target.value); if (execution) setMetric(executionMetric(data, execution)); setValue('') }}>{[...data.executions].reverse().map(execution => <option key={execution.id} value={execution.id}>{executionLabel(data, execution)} · {execution.channel} · {timestamp(execution.usedAt, 'en-US', data.profile?.timeZone)}</option>)}</select></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Result metric"><select className={fieldClass} value={metric} onChange={e => { setMetric(e.target.value as MetricName); setValue('') }}>{metrics.map(item => <option key={item} value={item}>{labelFor(item)}</option>)}</select></Field>
      <Field label={money ? 'Measured amount (major currency units)' : 'Measured count'}><input className={fieldClass} required inputMode={money ? 'decimal' : 'numeric'} maxLength={30} value={value} onChange={e => setValue(e.target.value)} /></Field>
      {money && <Field label="Result currency"><input className={fieldClass} required maxLength={3} pattern="[A-Z]{3}" value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} /></Field>}
      <Field label="Period start" hint="YYYY-MM-DD"><DateInput max={today} value={periodStart} onChange={setPeriodStart} /></Field>
      <Field label="Period end (inclusive)" hint="YYYY-MM-DD"><DateInput min={periodStart || undefined} max={today} value={periodEnd} onChange={setPeriodEnd} /></Field>
      <Field label="Ad spend for this period (optional)" hint="Leave blank if unknown. Enter 0 only if there was no ad spend."><input className={fieldClass} inputMode="decimal" maxLength={30} value={adSpend} onChange={e => setAdSpend(e.target.value)} /></Field>
      <Field label="Ad spend currency"><input className={fieldClass} required maxLength={3} pattern="[A-Z]{3}" value={adSpendCurrency} onChange={e => setAdSpendCurrency(e.target.value.toUpperCase())} /></Field>
    </div>
    <Field label="Price changes during this period" hint="Describe changes or enter “No price changes” if confirmed. Blank means not recorded."><input className={fieldClass} maxLength={2000} value={priceChangeNote} onChange={e => setPriceChangeNote(e.target.value)} /></Field>
    <Field label="Source description" hint="Manual entry. Record the report, export, or measurement method."><input className={fieldClass} required maxLength={1000} value={sourceNote} onChange={e => setSourceNote(e.target.value)} /></Field>
    <Field label="Other costs, changes, and notes (optional)" hint="You can also record operating costs as a separate measured result."><textarea className={fieldClass} maxLength={5000} rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <ErrorText error={error} /><button className={buttonClass} disabled={busy}>{busy ? 'Saving…' : 'Save measured result'}</button>
  </form>
}

function ResultCard({ result, data }: { result: Result; data: WorkspaceData }) {
  const baselineOptions = data.evidence.filter(item => item.id !== `result_${result.id}`)
  const suggested = [...baselineOptions].reverse().find(item => item.metric === result.metric && item.unit === result.unit && item.currency === result.currency && item.periodEnd < result.periodStart)
  const [baselineId, setBaselineId] = useState(suggested?.id ?? '')
  const baseline = baselineOptions.find(item => item.id === baselineId)
  const comparison = baseline ? compareResults(baseline, result) : null
  const baselineResult = baseline ? data.results.find(item => `result_${item.id}` === baseline.id) : null
  const baselineAdSpend = baseline ? data.evidence.filter(item => item.metric === 'adSpend' && item.periodStart === baseline.periodStart && item.periodEnd === baseline.periodEnd) : []
  const execution = data.executions.find(item => item.id === result.executionId)

  return <article className="rounded-xl border border-[var(--border)] p-4 sm:p-5">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{labelFor(result.metric)}</h3><strong className="tabular-nums">{formatMetric(result.value, result.unit, result.currency)}</strong></div>
    <p className="mt-2 text-xs opacity-65">{formatDateKey(result.periodStart, 'en-US')} – {formatDateKey(result.periodEnd, 'en-US')} · {execution?.channel ?? 'Recorded use'} · Manual source: {result.sourceNote}</p>
    <div className="mt-4 grid gap-3 rounded-xl bg-[var(--surface-muted)] p-4 text-sm sm:grid-cols-2"><p>Period ad spend: <strong>{result.adSpendMinor === null || !result.adSpendCurrency ? 'Not recorded' : formatMoneyMinor(result.adSpendMinor, result.adSpendCurrency)}</strong></p><p>Price changes: {result.priceChangeNote || 'Not recorded'}</p></div>
    {result.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed opacity-75">{result.notes}</p>}
    <div className="mt-4"><Field label="Compare with an earlier measurement"><select className={fieldClass} value={baselineId} onChange={e => setBaselineId(e.target.value)}><option value="">No baseline selected</option>{baselineOptions.map(item => <option key={item.id} value={item.id}>{labelFor(item.metric)} · {formatMetric(item.value, item.unit, item.currency)} · {formatDateKey(item.periodStart, 'en-US')} – {formatDateKey(item.periodEnd, 'en-US')}</option>)}</select></Field></div>
    {baseline && <div className="mt-4 space-y-2 rounded-xl border border-[var(--border)] p-4 text-xs leading-relaxed"><p>Baseline: <strong>{formatMetric(baseline.value, baseline.unit, baseline.currency)}</strong> · {formatDateKey(baseline.periodStart, 'en-US')} – {formatDateKey(baseline.periodEnd, 'en-US')}</p><p>Baseline ad spend: {baselineResult?.adSpendMinor != null && baselineResult.adSpendCurrency ? formatMoneyMinor(baselineResult.adSpendMinor, baselineResult.adSpendCurrency) : baselineAdSpend.length ? baselineAdSpend.map(item => formatMetric(item.value, item.unit, item.currency)).join('; ') : 'Not recorded'}</p><p>Baseline price changes: {baselineResult?.priceChangeNote || 'Not recorded'}</p><p>Baseline source: {baseline.sourceNote}</p></div>}
    {comparison ? <div className="mt-4 text-sm leading-relaxed">{comparison.comparable && comparison.difference !== null && <p className="font-semibold">Recorded change: {comparison.difference > 0 ? '+' : ''}{formatMetric(comparison.difference, result.unit, result.currency)}{comparison.percentChange !== null ? ` (${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(comparison.percentChange)}%)` : ''}</p>}<p className="mt-2 opacity-65">{comparison.reason}</p>{comparison.caveats.map((caveat, index) => <p key={index} className="mt-2 text-xs opacity-65">{caveat}</p>)}</div> : <p className="mt-4 text-xs leading-relaxed opacity-65">Insufficient evidence for a before-and-after comparison. Select a baseline with the same metric, unit, currency, and period duration.</p>}
  </article>
}
