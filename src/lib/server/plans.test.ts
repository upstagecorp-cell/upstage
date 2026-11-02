import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest'
import { POST as register } from '@/app/api/auth/register/route'
import { POST as createPlan } from '@/app/api/goals/route'
import { PUT as updatePlan } from '@/app/api/goals/[id]/route'
import { createProfileDefaults } from '@/lib/business/validation'
import type { Asset,SessionUser } from '@/lib/business/types'
import { assess,generate,updateProfile } from './operations'
import { closeDatabases,saveRecord,workspace } from './database'

const origin='http://localhost:3000'
const request=(path: string,body: unknown,cookie='',method='POST',from=origin)=>new Request(`${origin}${path}`,{method,headers:{'Content-Type':'application/json',Origin:from,Cookie:cookie},body:JSON.stringify(body)})
async function account(email: string) {
  const response=await register(request('/api/auth/register',{email,password:'A-test-password-12345'}))
  expect(response.status).toBe(200)
  const user=(await response.json()).user as SessionUser
  return {user,cookie:response.headers.get('set-cookie')!.split(';')[0]}
}
function prepare(owner: string) {
  updateProfile(owner,{...createProfileDefaults('America/New_York'),name:'Plan test',goal:'profitability',offering:'Design',customerType:'Business owners',salesChannels:['Website']})
  const data=assess(owner,{evidenceIds:[]})
  const assessment=data.assessments[0]
  return {assessmentId:assessment.id,actionId:assessment.recommendedActions.find(action=>action.kind==='review_costs')!.id,title:'Review complete costs',weekStart:'2026-11-02',dueDate:'2026-11-08',status:'planned',evaluationMetric:'cost',assetLinks:[],notes:''}
}
beforeEach(()=>{closeDatabases();vi.stubEnv('NEXORA_DB_PATH',':memory:');vi.stubEnv('APP_ORIGIN',origin)})
afterEach(()=>{closeDatabases();vi.unstubAllEnvs();vi.restoreAllMocks()})
describe('owned weekly execution plans',()=>{
  it('persists a recommendation and updates activity without changing business evidence or outcomes',async()=>{
    const owner=await account('plan@example.com')
    const input=prepare(owner.user.id)
    const before=workspace(owner.user.id)
    const created=await createPlan(request('/api/goals',input,owner.cookie))
    expect(created.status).toBe(200)
    const saved=(await created.json()).workspace
    const goal=saved.weeklyPlans[0]
    expect(goal).toMatchObject({assessmentId:input.assessmentId,actionId:input.actionId,dueDate:'2026-11-08',status:'planned',evaluationMetric:'cost',timeZone:'America/New_York'})
    const updated=await updatePlan(request(`/api/goals/${goal.id}`,{status:'completed',notes:'Reviewed the record; no outcome assumed.'},owner.cookie,'PUT'),{params:Promise.resolve({id:goal.id})})
    expect(updated.status).toBe(200)
    const after=(await updated.json()).workspace
    expect(after.weeklyPlans[0].status).toBe('completed')
    for(const key of ['profile','evidence','assessments','assets','executions','results'] as const) expect(after[key]).toEqual(before[key])
    expect(workspace(owner.user.id).weeklyPlans[0].id).toBe(goal.id)
  })
  it('rejects cross-account recommendations, plan edits, invalid assets, dates and origins',async()=>{
    const owner=await account('owner-plan@example.com'),other=await account('other-plan@example.com')
    const input=prepare(owner.user.id)
    prepare(other.user.id)
    expect((await createPlan(request('/api/goals',input,other.cookie))).status).toBe(404)
    expect((await createPlan(request('/api/goals',{...input,dueDate:'2026-11-09'},owner.cookie))).status).toBe(400)
    expect((await createPlan(request('/api/goals',{...input,assetLinks:[{assetId:'not-owned',version:1}]},owner.cookie))).status).toBe(400)
    expect((await createPlan(request('/api/goals',input,owner.cookie,'POST','https://other.example'))).status).toBe(403)
    const created=await createPlan(request('/api/goals',input,owner.cookie))
    const goal=(await created.json()).workspace.weeklyPlans[0]
    expect((await updatePlan(request(`/api/goals/${goal.id}`,{status:'completed'},other.cookie,'PUT'),{params:Promise.resolve({id:goal.id})})).status).toBe(404)
    expect(workspace(other.user.id).weeklyPlans).toEqual([])
    expect(workspace(owner.user.id).weeklyPlans[0].status).toBe('planned')
  })
  it('binds related artifacts to exact owned versions and the original recommendation',async()=>{
    const {user,cookie}=await account('artifacts-plan@example.com')
    const input=prepare(user.id)
    const asset: Asset={id:'asset',jobId:'job',assessmentId:input.assessmentId,actionId:input.actionId,profileId:workspace(user.id).profile!.id,kind:'ad_copy',language:'en-US',linkedProblem:'Cost review',target:'Owners',keyMessage:'Review',channel:'Internal',expectedAction:'Review',measurementMetric:'cost',claimsToVerify:[],currentVersion:1,versions:[{version:1,title:'Draft',body:'Draft text',createdAt:new Date().toISOString(),reviewStatus:'draft',approvedAt:null}]}
    saveRecord(user.id,'asset',asset.id,asset)
    expect((await createPlan(request('/api/goals',{...input,assetLinks:[{assetId:asset.id,version:2}]},cookie))).status).toBe(400)
    const good=await createPlan(request('/api/goals',{...input,assetLinks:[{assetId:asset.id,version:1}]},cookie))
    expect(good.status).toBe(200)
    expect((await good.json()).workspace.weeklyPlans[0].assetLinks).toEqual([{assetId:'asset',version:1}])
    expect(workspace(user.id).assets[0].versions[0].reviewStatus).toBe('draft')
  })
  it('allows a limited profile but refuses tailored generation before its core context is provided',async()=>{
    const {user}=await account('unknown-plan@example.com')
    updateProfile(user.id,createProfileDefaults('America/New_York'))
    const data=assess(user.id,{evidenceIds:[]})
    const action=data.assessments[0].recommendedActions.find(item=>item.kind==='marketing_assets')!
    await expect(generate(user.id,{assessmentId:data.assessments[0].id,actionId:action.id,idempotencyKey:'unknown_context_request',counts:{hooks:1,adCopy:0,scripts:0,ctas:0}})).rejects.toThrow('Business Profile')
    expect(workspace(user.id).jobs).toEqual([])
  })
})
