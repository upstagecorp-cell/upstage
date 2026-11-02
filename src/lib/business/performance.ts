import { differenceInCalendarDays } from '@/lib/date-time'
import type { Evidence, MetricName } from './types'

export type PerformanceMetric = MetricName | 'conversionRate'
export interface PerformancePoint { id: string; periodStart: string; periodEnd: string; value: number; unit: 'count'|'minor'|'percent'; currency: string|null; sourceNotes: string[]; evidenceIds: string[]; numerator?: number; denominator?: number }
export interface PerformanceSeries { id: string; days: number; currency: string|null; unit: PerformancePoint['unit']; points: PerformancePoint[]; canConnect: boolean }
export function performanceSeries(evidence: Evidence[], metric: PerformanceMetric): { series: PerformanceSeries[]; warnings: string[] } {
  const warnings: string[] = []
  const latest = new Map<string,Evidence>()
  evidence.forEach(item=>{
    const key = [item.metric,item.periodStart,item.periodEnd,item.unit,item.currency].join('|')
    const previous = latest.get(key)
    if (previous && previous.value!==item.value) warnings.push(`Multiple values for ${item.periodStart}–${item.periodEnd}; the most recently recorded value is plotted.`)
    if (!previous || item.recordedAt >= previous.recordedAt) latest.set(key,item)
  })
  const rows = [...latest.values()]
  const points: PerformancePoint[] = []
  if (metric==='conversionRate') {
    for (const visitor of rows.filter(item=>item.metric==='visitors')) {
      const purchase = rows.find(item=>item.metric==='purchases' && item.periodStart===visitor.periodStart && item.periodEnd===visitor.periodEnd && item.unit===visitor.unit && item.currency===visitor.currency)
      if (!purchase) { warnings.push(`Conversion is unavailable for ${visitor.periodStart}–${visitor.periodEnd}: matching purchases are missing.`); continue }
      if (visitor.value===0 || purchase.value > visitor.value) { warnings.push(`Conversion is unavailable for ${visitor.periodStart}–${visitor.periodEnd}: the visitor denominator is zero or the populations are inconsistent.`); continue }
      points.push({ id:`${visitor.id}:${purchase.id}`,periodStart:visitor.periodStart,periodEnd:visitor.periodEnd,value:purchase.value/visitor.value*100,unit:'percent',currency:null,sourceNotes:[visitor.sourceNote,purchase.sourceNote],evidenceIds:[visitor.id,purchase.id],numerator:purchase.value,denominator:visitor.value })
    }
    warnings.push('Conversion uses purchases / visitors for matching dates. Confirm that both sources describe the same channel and population; this is not an industry benchmark.')
  } else {
    for (const row of rows.filter(item=>item.metric===metric)) points.push({ id:row.id,periodStart:row.periodStart,periodEnd:row.periodEnd,value:row.value,unit:row.unit,currency:row.currency,sourceNotes:[row.sourceNote],evidenceIds:[row.id] })
  }
  const groups = new Map<string,PerformanceSeries>()
  for (const point of points) {
    const days = differenceInCalendarDays(point.periodEnd,point.periodStart)+1
    const id = `${point.unit}:${point.currency??'none'}:${days}`
    const group = groups.get(id) ?? { id,days,currency:point.currency,unit:point.unit,points:[],canConnect:true }
    group.points.push(point)
    groups.set(id,group)
  }
  for (const group of groups.values()) {
    group.points.sort((a,b)=>a.periodEnd.localeCompare(b.periodEnd))
    group.canConnect = group.points.length>1 && group.points.every((point,index)=>index===0 || point.periodStart > group.points[index-1].periodEnd)
  }
  return { series:[...groups.values()].sort((a,b)=>a.id.localeCompare(b.id)),warnings:[...new Set(warnings)] }
}
