'use client'

import { useId, useState } from 'react'
import type { Evidence } from '@/lib/business/types'
import { performanceSeries, type PerformanceMetric, type PerformancePoint, type PerformanceSeries } from '@/lib/business/performance'
import { currencyDecimals, formatMetric } from '@/lib/business/format'
import { formatDateKey } from '@/lib/date-time'
import { Card, Empty, Field, fieldClass, labelFor, metrics } from './shared'

function pointValue(point: PerformancePoint) {
  return point.unit==='percent' ? `${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(point.value)}%` : formatMetric(point.value,point.unit,point.currency)
}
export function PerformancePanel({ evidence, example = false }: { evidence: Evidence[]; example?: boolean }) {
  const [metric,setMetric] = useState<PerformanceMetric>('revenue')
  const [seriesId,setSeriesId] = useState('')
  const analysis = performanceSeries(evidence,metric)
  const selected = analysis.series.find(item=>item.id===seriesId) ?? analysis.series[0]
  const title = metric==='conversionRate'?'Visitor-to-purchase conversion':labelFor(metric)
  return <div className="space-y-6">
    <Card title={example?'Fictional sample performance':'Measured performance'} description={example?'Illustrative numbers only, not saved business evidence or a real performance result.':'Charts use your saved evidence and recorded results only. Activity completion does not change these measurements.'}>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Performance metric"><select className={fieldClass} value={metric} onChange={e=>{setMetric(e.target.value as PerformanceMetric);setSeriesId('')}}>{[...metrics,'conversionRate' as const].map(item=><option key={item} value={item}>{item==='conversionRate'?'Visitor-to-purchase conversion':labelFor(item)}</option>)}</select></Field>{analysis.series.length>0 && <Field label="Comparable reporting series" hint="Different currencies and reporting durations remain separate."><select className={fieldClass} value={selected.id} onChange={e=>setSeriesId(e.target.value)}>{analysis.series.map(item=><option key={item.id} value={item.id}>{item.currency??(item.unit==='percent'?'Percent':'Count')} · {item.days}-day periods · {item.points.length} measurements</option>)}</select></Field>}</div>
      <div className="mt-6">{selected?<MeasuredChart key={`${metric}:${selected.id}`} series={selected} title={title} />:<Empty>No compatible measurements for {title.toLowerCase()}. Add actual evidence or record measured results. No sample graph has been filled in.</Empty>}</div>
      {analysis.warnings.length>0 && <details className="mt-5 text-xs leading-relaxed opacity-70"><summary className="cursor-pointer font-semibold">Measurement notes ({analysis.warnings.length})</summary><ul className="mt-3 list-disc space-y-2 pl-5">{analysis.warnings.map(note=><li key={note}>{note}</li>)}</ul></details>}
      <p className="mt-5 text-xs leading-relaxed opacity-65">All sources are manually reported and have not been independently verified. A change on a chart does not show that NEXORA, a completed task, or an asset caused it. Review price changes and ad spend in Results.</p>
    </Card>
  </div>
}

function MeasuredChart({ series,title }: { series: PerformanceSeries; title: string }) {
  const id = useId()
  const [selectedId,setSelectedId] = useState('')
  const [confirmPopulation,setConfirmPopulation] = useState(false)
  const point = series.points.find(item=>item.id===selectedId) ?? series.points[series.points.length-1]
  const max = Math.max(...series.points.map(item=>item.value),1)
  const times = series.points.map(item=>Date.parse(`${item.periodEnd}T12:00:00Z`))
  const first = Math.min(...times), last = Math.max(...times)
  const coordinates = series.points.map((item,index)=>({item,x:first===last?380:90+(times[index]-first)/(last-first)*600,y:220-item.value/max*170}))
  const axisValue = (value: number) => `${series.currency ? `${series.currency} ` : ''}${new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(series.unit==='minor'?value/10**currencyDecimals(series.currency!):value)}${series.unit==='percent'?'%':''}`
  return <>
    <h3 className="text-base font-semibold">{title} by reported period</h3>
    <p className="mt-2 text-xs opacity-65">Unit: {series.unit==='minor'?`amount in ${series.currency}`:series.unit==='percent'?'percent (purchases / visitors × 100)':'count'} · each point covers {series.days} day{series.days===1?'':'s'} · reporting period ends on the horizontal axis</p>
    <svg viewBox="0 0 740 280" className="mt-4 w-full rounded-xl bg-[var(--surface-muted)]" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>{`${title}: ${series.points.length} saved measurements`}</title><desc id={`${id}-description`}>Only recorded values are shown. Exact periods, units, and sources are in the table below. No missing data is replaced with zero.</desc>
      {[0,.5,1].map(ratio=><g key={ratio}><line x1={90} x2={690} y1={220-ratio*170} y2={220-ratio*170} stroke="currentColor" opacity={.12}/><text x={80} y={224-ratio*170} textAnchor="end" fontSize={11} fill="currentColor">{axisValue(max*ratio)}</text></g>)}
      {confirmPopulation && series.canConnect && <polyline points={coordinates.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#476c45" strokeWidth={2.5}/>}
      {coordinates.map(({item,x,y},index)=><g key={item.id}><circle cx={x} cy={y} r={5} fill="#476c45" tabIndex={0} role="button" aria-label={`${formatDateKey(item.periodEnd,'en-US')}: ${pointValue(item)}`} onMouseEnter={()=>setSelectedId(item.id)} onFocus={()=>setSelectedId(item.id)} onClick={()=>setSelectedId(item.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedId(item.id)}}}><title>{`${formatDateKey(item.periodStart,'en-US')}–${formatDateKey(item.periodEnd,'en-US')}: ${pointValue(item)}`}</title></circle>{(index===0||index===coordinates.length-1||index===Math.floor(coordinates.length/2)) && <text x={x} y={249} textAnchor="middle" fontSize={11} fill="currentColor">{formatDateKey(item.periodEnd,'en-US',{month:'short',day:'numeric'})}</text>}</g>)}
    </svg>
    {series.canConnect?<label className="mt-3 flex items-start gap-2 text-xs leading-relaxed"><input type="checkbox" className="mt-0.5 accent-emerald-700" checked={confirmPopulation} onChange={e=>setConfirmPopulation(e.target.checked)}/><span>These records use compatible metric definitions and populations. Connect the measured points; do not fill missing periods.</span></label>:<p className="mt-3 text-xs opacity-65">{series.points.length===1?'One period is recorded. More comparable periods are needed to inspect a trend.':'Reporting periods overlap. Points are shown separately without a connecting trend line.'}</p>}
    <p className="mt-4 rounded-xl border border-[var(--border)] p-3 text-sm"><strong>{pointValue(point)}</strong> · {formatDateKey(point.periodStart,'en-US')}–{formatDateKey(point.periodEnd,'en-US')}{point.denominator!==undefined?` · ${point.numerator} purchases / ${point.denominator} visitors`:''}<span className="mt-1 block text-xs opacity-65">Manual source: {[...new Set(point.sourceNotes)].join('; ')}</span></p>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[550px] text-left text-xs"><caption className="sr-only">Recorded values, reporting periods, and sources for {title}</caption><thead><tr className="border-b border-[var(--border)]"><th className="p-2" scope="col">Reporting period</th><th className="p-2" scope="col">Measured value</th><th className="p-2" scope="col">Unit</th><th className="p-2" scope="col">Source</th></tr></thead><tbody>{series.points.map(item=><tr key={item.id} className="border-b border-[var(--border)]"><td className="p-2">{formatDateKey(item.periodStart,'en-US')}–{formatDateKey(item.periodEnd,'en-US')}</td><td className="p-2 tabular-nums">{pointValue(item)}{item.denominator!==undefined&&<span className="block opacity-60">{item.numerator} / {item.denominator}</span>}</td><td className="p-2">{item.unit==='minor'?item.currency:item.unit}</td><td className="max-w-xs break-words p-2">Manual · {[...new Set(item.sourceNotes)].join('; ')}</td></tr>)}</tbody></table></div>
  </>
}
