import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as register } from '@/app/api/auth/register/route'
import { POST as saveRoute } from '@/app/api/first-check/route'
import { firstCheckProfile, firstDirection, parseFirstCheck, type FirstCheck } from '@/lib/business/first-check'
import { createAssessment } from '@/lib/business/assessment'
import type { BusinessProfile, Evidence, SessionUser } from '@/lib/business/types'
import { closeDatabases, workspace } from './database'
import { saveFirstCheck } from './first-check'
import { updateProfile } from './operations'

const origin='http://localhost:3000'
const draft:FirstCheck={version:1,id:'check_test_1234',focus:'awareness',businessType:'services',stage:'operating',offering:'Brand design',timeZone:'America/New_York',evidence:[]}
const request=(path:string,body:unknown,cookie='',from=origin)=>new Request(`${origin}${path}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:from,Cookie:cookie},body:JSON.stringify(body)})
async function account(email:string){const response=await register(request('/api/auth/register',{email,password:'Only-for-local-testing-123'}));expect(response.status).toBe(200);return {user:(await response.json()).user as SessionUser,cookie:response.headers.get('set-cookie')!.split(';')[0]}}
beforeEach(()=>{closeDatabases();vi.stubEnv('NEXORA_DB_PATH',':memory:');vi.stubEnv('APP_ORIGIN',origin)})
afterEach(()=>{closeDatabases();vi.unstubAllEnvs()})

describe('first direction and explicit account handoff',()=>{
  it('keeps unknown numbers absent and rejects invalid choices and duplicate metrics',()=>{
    expect(parseFirstCheck(draft).evidence).toEqual([])
    const profile:BusinessProfile={...firstCheckProfile(draft),id:'p',version:1,updatedAt:'2026-01-01T12:00:00Z'}
    const report=createAssessment(profile,[])
    expect(report.facts).toEqual([])
    expect(firstDirection(report).headline).toContain('paid project')
    expect(()=>parseFirstCheck({...draft,businessType:'invented'})).toThrow()
    expect(()=>parseFirstCheck({...draft,stage:'guaranteed_success'})).toThrow()
    const measurement={metric:'visitors',value:0,unit:'count',currency:null,periodStart:'2026-01-01',periodEnd:'2026-01-07',source:'manual',sourceNote:'My report'}
    expect(()=>parseFirstCheck({...draft,evidence:[measurement,measurement]})).toThrow('one value per metric')
    const profitability=createAssessment({...profile,goal:'profitability'},[])
    expect(firstDirection(profitability).action?.metric).toBe('cost')
  })
  it('uses measured losses to prioritize costs over an awareness goal',()=>{
    const profile:BusinessProfile={...firstCheckProfile(draft),id:'p',version:1,updatedAt:'2026-01-01T12:00:00Z'}
    const rows:Evidence[]=['revenue','cost'].map((metric,index)=>({id:`m${index}`,profileId:'p',metric:metric as Evidence['metric'],value:index?200:100,unit:'minor',currency:'USD',periodStart:'2026-01-01',periodEnd:'2026-01-07',source:'manual',sourceNote:'Owner ledger',recordedAt:'2026-01-08T12:00:00Z'}))
    const direction=firstDirection(createAssessment(profile,rows))
    expect(direction.action?.kind).toBe('review_costs')
    expect(direction.headline).toContain('each sale')
    expect(direction.task).toContain('direct costs')
  })
  it('keeps the leading display action aligned with the saved recommendation',()=>{
    const profile:BusinessProfile={...firstCheckProfile(draft),id:'p',version:1,updatedAt:'2026-01-01T12:00:00Z'}
    const metrics:Evidence['metric'][]=['visitors','purchases','revenue','cost','adSpend','customers','returningCustomers']
    const values=[100,10,10000,5000,1000,10,2]
    const rows:Evidence[]=metrics.map((metric,index)=>({id:`m${index}`,profileId:'p',metric,value:values[index],unit:['revenue','cost','adSpend'].includes(metric)?'minor':'count',currency:['revenue','cost','adSpend'].includes(metric)?'USD':null,periodStart:'2026-01-01',periodEnd:'2026-01-07',source:'manual',sourceNote:'Owner report',recordedAt:'2026-01-08T12:00:00Z'}))
    const report=createAssessment(profile,rows)
    const direction=firstDirection(report)
    expect(report.recommendedActions[0].kind).toBe('marketing_assets')
    expect(direction.action?.id).toBe(report.recommendedActions[0].id)
    expect(direction.task).toContain('draft')
  })
  it('requires explicit confirmation before creating an account profile or assessment',async()=>{
    const {user}=await account('consent-check@example.com')
    expect(()=>saveFirstCheck(user.id,{check:draft,expectedVersion:0})).toThrow('confirm')
    expect(workspace(user.id).profile).toBeNull()
    expect(workspace(user.id).assessments).toEqual([])
    const saved=saveFirstCheck(user.id,{check:draft,confirmed:true,expectedVersion:0})
    expect(saved.profile?.offering).toBe('Brand design')
    expect(saved.assessments).toHaveLength(1)
    expect(saved.assessments[0].facts).toEqual([])
    expect(saved.executions).toEqual([])
    expect(saved.results).toEqual([])
  })
  it('persists real zero and its source without duplicating a retried check',async()=>{
    const {user}=await account('retry-check@example.com')
    const check={...draft,evidence:[{metric:'visitors',value:0,unit:'count',currency:null,periodStart:'2026-01-01',periodEnd:'2026-01-07',source:'manual',sourceNote:'My analytics export'}]}
    const input={check,confirmed:true,expectedVersion:0}
    const first=saveFirstCheck(user.id,input)
    const retried=saveFirstCheck(user.id,input)
    expect(retried.assessments).toEqual(first.assessments)
    expect(retried.profile?.version).toBe(1)
    expect(retried.evidence).toHaveLength(1)
    expect(retried.evidence[0]).toMatchObject({value:0,sourceNote:'My analytics export'})
    expect(()=>saveFirstCheck(user.id,{...input,check:{...check,offering:'Changed'}})).toThrow('different answers')
  })
  it('guards existing-profile versions and preserves older snapshots',async()=>{
    const {user}=await account('existing-check@example.com')
    const first=saveFirstCheck(user.id,{check:draft,confirmed:true,expectedVersion:0})
    updateProfile(user.id,{...first.profile!,name:'My established studio',customerType:'Local owners',salesChannels:['Website']})
    const changed={...draft,id:'second_check_123',focus:'profitability',offering:''}
    expect(()=>saveFirstCheck(user.id,{check:changed,confirmed:true,expectedVersion:1})).toThrow('another tab')
    const saved=saveFirstCheck(user.id,{check:changed,confirmed:true,expectedVersion:2})
    expect(saved.profile).toMatchObject({name:'My established studio',customerType:'Local owners',offering:'Brand design',goal:'profitability'})
    expect(saved.assessments[0]).toEqual(first.assessments[0])
  })
  it('rejects future evidence atomically before changing business records',async()=>{
    const {user}=await account('future-check@example.com')
    const check={...draft,evidence:[{metric:'revenue',value:100,unit:'minor',currency:'USD',periodStart:'2999-01-01',periodEnd:'2999-01-07',source:'manual',sourceNote:'A forecast'}]}
    expect(()=>saveFirstCheck(user.id,{check,confirmed:true,expectedVersion:0})).toThrow('future')
    expect(workspace(user.id).profile).toBeNull()
    expect(workspace(user.id).evidence).toEqual([])
  })
  it('enforces authentication, origin, and account isolation on handoff',async()=>{
    const a=await account('a-check@example.com'),b=await account('b-check@example.com')
    const input={check:draft,confirmed:true,expectedVersion:0}
    expect((await saveRoute(request('/api/first-check',input))).status).toBe(401)
    expect((await saveRoute(request('/api/first-check',input,a.cookie,'https://other.example'))).status).toBe(403)
    expect((await saveRoute(request('/api/first-check',input,a.cookie))).status).toBe(200)
    expect(workspace(b.user.id).profile).toBeNull()
    expect((await saveRoute(request('/api/first-check',input,b.cookie))).status).toBe(200)
    expect(workspace(a.user.id).profile?.id).not.toBe(workspace(b.user.id).profile?.id)
  })
})
