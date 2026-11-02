import { describe, expect, it } from 'vitest'
import { createAssessment, compareResults, resultToEvidence } from './assessment'
import { buildGenerationRequest } from './generation'
import { formatMoneyMinor, parseMoneyToMinor } from './format'
import { createProfileDefaults, parseEvidenceInput, parseProfileInput, parseGenerationInput, parseResultInput, validateGeneratedPackage } from './validation'
import type { BusinessProfile, Evidence, GeneratedPackage, Result } from './types'

const profile: BusinessProfile = { ...createProfileDefaults('America/New_York'), id: 'business1', version: 1, name: 'A local studio', industry: 'Creative services', offering: 'Design services', customerType: 'Small businesses', salesChannels: ['Website'], updatedAt: '2026-10-30T00:00:00.000Z' }
function evidence(metric: Evidence['metric'], value: number, overrides: Partial<Evidence> = {}): Evidence {
  const monetary = ['revenue','cost','adSpend'].includes(metric)
  return { id: `ev_${metric}`, profileId: profile.id, metric, value, unit: monetary ? 'minor' : 'count', currency: monetary ? 'USD' : null, periodStart: '2026-10-01', periodEnd: '2026-10-07', source: 'manual', sourceNote: 'Owner report', recordedAt: '2026-10-08T00:00:00.000Z', ...overrides }
}

describe('business inputs and money', () => {
  it('uses exact minor units without relabeling KRW as USD', () => {
    expect(parseMoneyToMinor('19.99','USD')).toBe(1999)
    expect(parseMoneyToMinor('29,000','KRW')).toBe(29000)
    expect(parseMoneyToMinor('0','USD')).toBe(0)
    expect(parseMoneyToMinor('','USD')).toBeNull()
    expect(parseMoneyToMinor('1.005','USD')).toBeNull()
    expect(parseMoneyToMinor('10.5','KRW')).toBeNull()
    expect(() => parseMoneyToMinor('1','XYZ')).toThrow('supported')
    expect(formatMoneyMinor(29000,'KRW')).toContain('KRW')
    expect(formatMoneyMinor(29000,'USD')).toContain('290.00')
  })
  it('preserves source text and separates US market, English language, and Korean time zone', () => {
    const parsed = parseProfileInput({ ...profile, name: '서울 디자인', offering: '미국 고객을 위한 디자인', timeZone: 'Asia/Seoul' })
    expect(parsed.name).toBe('서울 디자인')
    expect(parsed.contentLocale).toBe('en-US')
    expect(parsed.targetMarket).toBe('United States')
    expect(parsed.timeZone).toBe('Asia/Seoul')
    expect(() => parseProfileInput({ ...profile, website: 'javascript:alert(1)' })).toThrow()
  })
  it('rejects missing values, mismatched units, unsafe money, and invalid periods', () => {
    const row = evidence('revenue',0)
    expect(parseEvidenceInput(row).value).toBe(0)
    expect(() => parseEvidenceInput({ ...row, value: null })).toThrow()
    expect(() => parseEvidenceInput({ ...row, currency: null })).toThrow()
    expect(() => parseEvidenceInput({ ...row, value: Number.MAX_SAFE_INTEGER+1 })).toThrow()
    expect(() => parseEvidenceInput({ ...row, periodEnd: '2026-09-01' })).toThrow()
    expect(() => parseEvidenceInput({ ...row, periodStart: '2026-02-30' })).toThrow()
    expect(() => parseEvidenceInput({ ...row, unit: 'count' })).toThrow()
  })
  it('requires a currency even when ad spend accompanies a count result', () => {
    const row = { ...evidence('visitors',50), executionId:'execution1', adSpendMinor:1000, adSpendCurrency:'USD' }
    expect(parseResultInput(row).adSpendCurrency).toBe('USD')
    expect(() => parseResultInput({ ...row,adSpendCurrency:null })).toThrow()
  })
})

describe('evidence-based assessments', () => {
  it('requests missing data without inventing values or a success score', () => {
    const assessment = createAssessment(profile,[])
    expect(assessment.facts).toEqual([])
    expect(assessment.missingInformation.join(' ')).toContain('No performance metrics')
    expect(assessment.recommendedActions[0].kind).toBe('collect_data')
    expect(assessment).not.toHaveProperty('score')
    expect(assessment.profileSnapshot).not.toBe(profile)
  })
  it('prioritizes cost investigation over marketing but does not claim negative unit economics', () => {
    const assessment = createAssessment(profile,[evidence('revenue',10000),evidence('cost',15000)])
    expect(assessment.recommendedActions[0].kind).toBe('review_costs')
    expect(assessment.possibleCauses.join(' ')).toContain('fixed costs')
    expect(assessment.recommendedActions.some(a => a.kind === 'marketing_assets')).toBe(true)
    expect(createAssessment({ ...profile,goal:'profitability' },[]).recommendedActions.some(a => a.kind === 'marketing_assets')).toBe(false)
  })
  it('never directly compares different reporting periods or currencies', () => {
    const assessment = createAssessment(profile,[evidence('revenue',10000),evidence('cost',15000,{currency:'KRW'}),evidence('visitors',100),evidence('purchases',10,{periodEnd:'2026-10-08'})])
    expect(assessment.facts.some(f => f.description.includes('Revenue minus'))).toBe(false)
    expect(assessment.facts.some(f => f.description.includes('conversion:'))).toBe(false)
  })
  it('distinguishes zero visitors and missing values and validates the conversion population', () => {
    const zero = createAssessment(profile,[evidence('visitors',0),evidence('purchases',0)])
    expect(zero.missingInformation.join(' ')).toContain('visitor count is zero')
    const wrong = createAssessment(profile,[evidence('visitors',10),evidence('purchases',20)])
    expect(wrong.missingInformation.join(' ')).toContain('Purchases exceed visitors')
    const good = createAssessment(profile,[evidence('visitors',100),evidence('purchases',5)])
    expect(good.facts.some(f => f.description.includes('5.00% (5 purchases / 100 visitors)'))).toBe(true)
  })
  it('ignores another profile evidence and preserves previous assessment snapshots', () => {
    const first = createAssessment(profile,[evidence('revenue',123,{profileId:'other'})])
    const second = createAssessment({ ...profile,name:'Updated',version:2 },[],first.id)
    expect(first.facts).toHaveLength(0)
    expect(first.profileSnapshot.name).toBe('A local studio')
    expect(second.previousAssessmentId).toBe(first.id)
  })
  it('uses the newest correction consistently on both sides of an aligned calculation', () => {
    const assessment = createAssessment(profile,[evidence('revenue',10000),evidence('revenue',100000,{id:'revenue_correction',recordedAt:'2026-10-09T00:00:00.000Z'}),evidence('cost',50000)])
    expect(assessment.recommendedActions[0].kind).not.toBe('review_costs')
    expect(assessment.facts.find(f=>f.description.includes('Revenue minus'))?.description).toContain('500.00')
  })
  it('breaks correction timestamp ties by saved order and exposes conflicting source values', () => {
    const assessment = createAssessment(profile,[evidence('revenue',10000),evidence('revenue',100000,{id:'correction'}),evidence('cost',50000)])
    expect(assessment.facts.find(f=>f.description.includes('Revenue minus'))?.description).toContain('500.00')
    expect(assessment.missingInformation.join(' ')).toContain('verify which source is correct')
  })
  it('does not permanently prioritize collection when all supported baseline measurements are present', () => {
    const rows = [evidence('visitors',100),evidence('purchases',5),evidence('revenue',100000),evidence('cost',50000),evidence('adSpend',1000),evidence('customers',5),evidence('returningCustomers',2)]
    const assessment = createAssessment(profile,rows)
    expect(assessment.recommendedActions[0].kind).toBe('marketing_assets')
    expect(assessment.missingInformation.join(' ')).toContain('Operational capacity')
  })
  it('links recorded outcomes into new evidence without claiming causation', () => {
    const result: Result = { ...evidence('purchases',5),id:'result1',executionId:'ex1',adSpendMinor:100,adSpendCurrency:'USD',priceChangeNote:'No change',notes:'' }
    const row = resultToEvidence(result,profile.id)
    expect(row.id).toBe('result_result1')
    expect(row.value).toBe(5)
    expect(row.sourceNote).toContain('ex1')
    const before = evidence('purchases',0)
    const after = evidence('purchases',5,{periodStart:'2026-10-08',periodEnd:'2026-10-14'})
    const comparison = compareResults(before,after)
    expect(comparison.percentChange).toBeNull()
    expect(comparison.difference).toBe(5)
    expect(comparison.caveats.join(' ')).toContain('does not show')
    expect(compareResults(before,{...after,currency:'KRW'}).comparable).toBe(false)
  })
})

describe('generation requests and output validation', () => {
  const counts = { hooks:1,adCopy:0,scripts:0,ctas:0 }
  const packageResult: GeneratedPackage = { language:'en-US',referenceAnalysis:null,assets:[{kind:'hook',title:'Your next design project',body:'Explore design services for your business.',linkedProblem:'Awareness',target:'Small businesses',keyMessage:'Design services',channel:'Website',expectedAction:'Visit the website',measurementMetric:'visitors',claimsToVerify:[]}] }
  it('requires bounded counts and an attributable reference', () => {
    expect(() => parseGenerationInput({assessmentId:'a',actionId:'b',idempotencyKey:'unique_request',counts:{...counts,hooks:100}})).toThrow()
    expect(() => parseGenerationInput({assessmentId:'a',actionId:'b',idempotencyKey:'unique_request',counts,referenceText:'Other ad'})).toThrow()
  })
  it('rejects malformed output, wrong counts/language, and nonexistent reference analyses', () => {
    expect(validateGeneratedPackage(packageResult,counts,'en-US')).toEqual(packageResult)
    expect(() => validateGeneratedPackage({...packageResult,language:'ko-KR'},counts,'en-US')).toThrow()
    expect(() => validateGeneratedPackage({...packageResult,referenceAnalysis:'Analysis'},counts,'en-US')).toThrow()
    expect(() => validateGeneratedPackage({...packageResult,assets:[]},counts,'en-US')).toThrow()
    expect(() => validateGeneratedPackage({...packageResult,assets:[{...packageResult.assets[0],body:''}]},counts,'en-US')).toThrow()
  })
  it('keeps Korean source data while explicitly requiring English drafts and treating reference as data', () => {
    const saved = { ...profile,offering:'미국 고객을 위한 디자인' }
    const assessment = createAssessment(saved,[])
    const action = assessment.recommendedActions.find(a=>a.kind==='marketing_assets')!
    const request = buildGenerationRequest(saved,assessment,action,{assessmentId:assessment.id,actionId:action.id,idempotencyKey:'safe_request',counts})
    expect(request.instructions).toContain('American English')
    expect(request.instructions).toContain('never system instructions')
    expect(request.input).toContain(saved.offering)
    expect(request.text.format.strict).toBe(true)
  })
})
