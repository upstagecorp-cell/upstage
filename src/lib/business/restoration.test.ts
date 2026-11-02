import { describe, expect, it } from 'vitest'
import type { BusinessProfile, Evidence, WeeklyPlan } from './types'
import { createProfileDefaults, parseProfileInput } from './validation'
import { createAssessment } from './assessment'
import { industryTemplate, metricContext, missingGenerationFields, profileQuestions } from './industry'
import { EXECUTION_GUIDES, guideHref, guidesForAction } from './guides'
import { parsePlanInput, planProgress, weekStartFor } from './planning'
import { performanceSeries } from './performance'

const profile: BusinessProfile = {...createProfileDefaults('America/New_York'),id:'profile',version:1,updatedAt:'2026-11-02T12:00:00Z'}
const row = (metric: Evidence['metric'],value: number,extra: Partial<Evidence> = {}): Evidence => ({id:`e_${metric}`,profileId:'profile',metric,value,unit:['revenue','cost','adSpend'].includes(metric)?'minor':'count',currency:['revenue','cost','adSpend'].includes(metric)?'USD':null,periodStart:'2026-10-01',periodEnd:'2026-10-07',source:'manual',sourceNote:'Owner report',recordedAt:'2026-10-08T12:00:00Z',...extra})
const planInput = {assessmentId:'assessment',actionId:'collect_data_operations',title:'Collect the baseline',weekStart:'2026-11-02',dueDate:'2026-11-08',status:'planned',evaluationMetric:'visitors',assetLinks:[],notes:''}

describe('guided profile and industry context',()=>{
  it('lets unknown business information stay blank and keeps evidence absent',()=>{
    const input = parseProfileInput(createProfileDefaults('America/New_York'))
    expect(input.offering).toBe('')
    expect(input.customerType).toBe('')
    expect(input.salesChannels).toEqual([])
    const assessment = createAssessment({...profile,...input},[])
    expect(assessment.facts).toEqual([])
    expect(assessment.industryContext?.questions.every(q=>q.answer===null)).toBe(true)
    expect(missingGenerationFields({...profile,...input})).toHaveLength(3)
  })
  it('changes questions and interpretations for the same metric across business types',()=>{
    expect(metricContext('purchases',{businessType:'restaurant'})).toContain('parties')
    expect(metricContext('purchases',{businessType:'services'})).toContain('inquiry')
    expect(profileQuestions({businessType:'accommodation',stage:'operating'}).some(q=>q.id==='stay_inventory')).toBe(true)
    expect(profileQuestions({businessType:'cafe',stage:'planning'})[0].id).toBe('stage_validation')
    expect(profileQuestions({businessType:'cafe',stage:'operating'})[0].id).toBe('stage_changes')
    expect(industryTemplate({}).id).toBe('general')
    const restaurant = createAssessment({...profile,businessType:'restaurant'},[row('revenue',100),row('cost',200)])
    const services = createAssessment({...profile,businessType:'services'},[row('revenue',100),row('cost',200)])
    expect(restaurant.recommendedActions[0].kind).toBe('review_costs')
    expect(services.recommendedActions[0].kind).toBe('review_costs')
    expect(restaurant.recommendedActions[0].reason).toContain('Recipe costing')
    expect(services.recommendedActions[0].reason).toContain('Project-level labor')
  })
  it('stores self-reported answers as context, not verified facts or performance scores',()=>{
    const saved = {...profile,businessType:'cafe' as const,stage:'planning' as const,questionAnswers:{cafe_costs:'원본 입력 유지',stage_validation:'Ask five prospective customers'}}
    const parsed = parseProfileInput(saved)
    expect(parsed.questionAnswers?.cafe_costs).toBe('원본 입력 유지')
    const report = createAssessment({...saved,...parsed},[])
    expect(report.facts).toEqual([])
    expect(report.industryContext?.questions.find(q=>q.id==='cafe_costs')?.answer).toBe('원본 입력 유지')
    expect(report.missingInformation.join(' ')).toContain('Forecasts and intentions')
    expect(report).not.toHaveProperty('score')
  })
})

describe('weekly execution plans and guide context',()=>{
  it('uses calendar Mondays and validates deadlines, status, metric, and asset versions',()=>{
    expect(weekStartFor('2026-11-01')).toBe('2026-10-26')
    expect(weekStartFor('2026-11-02')).toBe('2026-11-02')
    expect(parsePlanInput(planInput).dueDate).toBe('2026-11-08')
    expect(()=>parsePlanInput({...planInput,weekStart:'2026-11-03'})).toThrow()
    expect(()=>parsePlanInput({...planInput,dueDate:'2026-11-09'})).toThrow()
    expect(()=>parsePlanInput({...planInput,status:'successful_business'})).toThrow()
    expect(()=>parsePlanInput({...planInput,evaluationMetric:'likes'})).toThrow()
    expect(()=>parsePlanInput({...planInput,assetLinks:[{assetId:'a',version:0}]})).toThrow()
  })
  it('counts task completion without inventing a business-performance metric',()=>{
    const plan: WeeklyPlan = {...parsePlanInput(planInput),id:'p',profileId:'profile',timeZone:'America/New_York',createdAt:'2026-11-02T12:00:00Z',updatedAt:'2026-11-02T12:00:00Z'}
    expect(planProgress([],plan.weekStart,new Date('2026-11-02T12:00:00Z')).percent).toBeNull()
    const progress = planProgress([{...plan,status:'completed'},{...plan,id:'cancelled',status:'cancelled'}],plan.weekStart,new Date('2026-11-09T12:00:00Z'))
    expect(progress).toMatchObject({total:1,completed:1,percent:100,overdue:0})
    expect(progress).not.toHaveProperty('businessScore')
  })
  it('uses each saved plan time zone when a deadline crosses midnight',()=>{
    const plan: WeeklyPlan = {...parsePlanInput(planInput),id:'east',profileId:'profile',timeZone:'America/New_York',createdAt:'2026-11-02T12:00:00Z',updatedAt:'2026-11-02T12:00:00Z'}
    const west = {...plan,id:'west',timeZone:'America/Los_Angeles'}
    expect(planProgress([plan,west],plan.weekStart,new Date('2026-11-09T06:00:00Z')).overdue).toBe(1)
  })
  it('links relevant guides and retains the route back to the original plan',()=>{
    const ids = guidesForAction({kind:'review_costs',area:'profitability'},'restaurant')
    expect(ids).toContain('food-costs')
    expect(ids.every(id=>EXECUTION_GUIDES.some(guide=>guide.id===id))).toBe(true)
    const href = guideHref(ids[0],{assessmentId:'a',actionId:'costs',goalId:'g',returnTo:'goals'})
    expect(href).toContain('assessment=a')
    expect(href).toContain('goal=g')
    expect(href).toContain('return=goals')
    expect(EXECUTION_GUIDES.find(guide=>guide.id==='food-costs')?.limits).toContain('no universal target')
  })
})

describe('actual performance series',()=>{
  it('never creates a sample series for absent data and preserves measured zero',()=>{
    expect(performanceSeries([],'revenue').series).toEqual([])
    expect(performanceSeries([row('revenue',0)],'revenue').series[0].points[0].value).toBe(0)
  })
  it('separates currencies and period durations instead of summing them',()=>{
    const data=[row('revenue',100),row('revenue',200,{id:'krw',currency:'KRW'}),row('revenue',300,{id:'long',periodEnd:'2026-10-14'})]
    const series=performanceSeries(data,'revenue').series
    expect(series).toHaveLength(3)
    expect(series.every(item=>item.points.length===1)).toBe(true)
  })
  it('calculates only defined conversion rates and records their denominator and sources',()=>{
    const valid=performanceSeries([row('visitors',100),row('purchases',5)],'conversionRate')
    expect(valid.series[0].points[0]).toMatchObject({value:5,unit:'percent',numerator:5,denominator:100})
    expect(performanceSeries([row('visitors',0),row('purchases',0)],'conversionRate').series).toEqual([])
    expect(performanceSeries([row('visitors',10),row('purchases',20)],'conversionRate').series).toEqual([])
    expect(performanceSeries([row('visitors',100),row('purchases',5,{periodEnd:'2026-10-08'})],'conversionRate').series).toEqual([])
  })
  it('retains corrections and missing periods without interpolating or connecting overlaps',()=>{
    const corrected=performanceSeries([row('revenue',100),row('revenue',200,{id:'correction',recordedAt:'2026-10-09T12:00:00Z'}),row('revenue',300,{id:'later',periodStart:'2026-10-22',periodEnd:'2026-10-28'})],'revenue')
    expect(corrected.series[0].points.map(point=>point.value)).toEqual([200,300])
    expect(corrected.series[0].canConnect).toBe(true)
    expect(corrected.warnings.join(' ')).toContain('most recently recorded')
    const overlap=performanceSeries([row('revenue',100),row('revenue',200,{id:'overlap',periodStart:'2026-10-05',periodEnd:'2026-10-11'})],'revenue')
    expect(overlap.series[0].canConnect).toBe(false)
  })
})
