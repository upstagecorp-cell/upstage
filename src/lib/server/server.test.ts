import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Asset, GeneratedPackage, SessionUser } from '@/lib/business/types'
import { createProfileDefaults } from '@/lib/business/validation'
import { addCalendarDays, getLocalDateKey } from '@/lib/date-time'
import { POST as register } from '@/app/api/auth/register/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as signOut } from '@/app/api/auth/logout/route'
import { GET as getSession } from '@/app/api/session/route'
import { GET as getWorkspace } from '@/app/api/workspace/route'
import { PUT as editAsset } from '@/app/api/assets/[id]/route'
import { POST as approve } from '@/app/api/assets/[id]/approve/route'
import { GET as download } from '@/app/api/assets/[id]/download/route'
import { POST as generateRoute } from '@/app/api/generate/route'
import { closeDatabases, database, saveRecord, workspace } from './database'
import { addEvidence, assess, generate, importLegacy, recordExecution, recordResult, updateProfile } from './operations'

const origin = 'http://localhost:3000'
const password = 'safe-test-password-123'
function measuredToday(timeZone: string) {
  const date = getLocalDateKey(new Date(), timeZone)
  return { periodStart: date, periodEnd: date }
}
function request(path: string, body?: unknown, cookie = '', method = 'POST', from = origin) {
  return new Request(`${origin}${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: from, Cookie: cookie }, ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}) })
}
async function account(email = 'first@example.com') {
  const response = await register(request('/api/auth/register', { email, password }))
  expect(response.status).toBe(200)
  const user = (await response.json()).user as SessionUser
  // Existing generation fixtures represent a paid account; production has no fixture grant API.
  saveRecord(user.id, 'billing', 'current', { id: 'fixture-subscription', plan: 'focus', status: 'active', paid: true, periodStart: new Date(Date.now()-86_400_000).toISOString(), periodEnd: new Date(Date.now()+29*86_400_000).toISOString(), cancelAtPeriodEnd: false })
  return { user, cookie: response.headers.get('set-cookie')!.split(';')[0] }
}
function prepare(owner: string) {
  updateProfile(owner, { ...createProfileDefaults('America/New_York'), name: 'Sample Studio', industry: 'Design', offering: 'Design consultations', customerType: 'Small business owners', salesChannels: ['Website'], goal: 'awareness' })
  const w = assess(owner, { evidenceIds: [] })
  const assessment = w.assessments[0]
  return { assessmentId: assessment.id, actionId: assessment.recommendedActions.find(a => a.kind === 'marketing_assets')!.id, idempotencyKey: 'request-key-123', counts: { hooks: 1, adCopy: 0, scripts: 0, ctas: 0 } }
}
function packageValue(): GeneratedPackage {
  return { language: 'en-US', referenceAnalysis: null, assets: [{ kind: 'hook', title: 'Make your next design decision clearer', body: 'Explore design consultations for your business. Ask us about your project.', linkedProblem: 'Reach prospective clients', target: 'Small business owners', keyMessage: 'Discuss your design needs', channel: 'Website', expectedAction: 'Request a consultation', measurementMetric: 'visitors', claimsToVerify: [] }] }
}
function providerResponse(value: unknown = packageValue()) {
  return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }], usage: { input_tokens: 25, output_tokens: 18 } }), { status: 200 })
}

describe('approved wording continuity across generation requests',()=>{
  it('sends only the requesting account’s approved wording and preserves the exact reference snapshot',async()=>{
    const first=await account('wording-owner@example.com')
    const second=await account('wording-other@example.com')
    const own=fixtureAsset(first.user.id),other=fixtureAsset(second.user.id)
    own.versions[0]={...own.versions[0],reviewStatus:'approved',approvedAt:new Date().toISOString(),body:'Approved phrase owned by first account'}
    own.versions.push({...own.versions[0],version:2,body:'Unapproved revision must stay out',reviewStatus:'draft',approvedAt:null})
    own.currentVersion=2
    other.versions[0]={...other.versions[0],reviewStatus:'approved',approvedAt:new Date().toISOString(),body:'Private phrase owned by second account'}
    saveRecord(first.user.id,'asset',own.id,own);saveRecord(second.user.id,'asset',other.id,other)
    const fetchMock=vi.fn().mockResolvedValue(providerResponse());vi.stubGlobal('fetch',fetchMock)
    const action=workspace(first.user.id).assessments[0].recommendedActions.find(item=>item.kind==='marketing_assets')!
    const result=await generate(first.user.id,{assessmentId:own.assessmentId,actionId:action.id,idempotencyKey:'approved-context-request',counts:{hooks:1,adCopy:0,scripts:0,ctas:0},useApprovedContext:true})
    const sent=JSON.parse(JSON.parse(fetchMock.mock.calls[0][1].body).input)
    expect(sent.approvedWordingReferences).toHaveLength(1)
    expect(sent.approvedWordingReferences[0]).toMatchObject({assetId:own.id,version:1,body:'Approved phrase owned by first account'})
    expect(JSON.stringify(sent)).not.toContain('Private phrase owned by second account')
    expect(JSON.stringify(sent)).not.toContain('Unapproved revision must stay out')
    expect(result.jobs[0].approvedWordingReferences).toEqual(sent.approvedWordingReferences)
  })
  it('omits prior wording when reuse is switched off',async()=>{
    const {user}=await account('no-wording@example.com')
    const own=fixtureAsset(user.id)
    own.versions[0]={...own.versions[0],reviewStatus:'approved',approvedAt:new Date().toISOString(),body:'This reference was not requested'}
    saveRecord(user.id,'asset',own.id,own)
    const fetchMock=vi.fn().mockResolvedValue(providerResponse());vi.stubGlobal('fetch',fetchMock)
    await generate(user.id,{assessmentId:own.assessmentId,actionId:own.actionId,idempotencyKey:'wording-optout-request',counts:{hooks:1,adCopy:0,scripts:0,ctas:0},useApprovedContext:false})
    const sent=JSON.parse(JSON.parse(fetchMock.mock.calls[0][1].body).input)
    expect(sent.approvedWordingReferences).toBeUndefined()
  })
})
function fixtureAsset(owner: string): Asset {
  const input = prepare(owner)
  const asset: Asset = { ...packageValue().assets[0], id: 'private-asset', jobId: 'private-job', assessmentId: input.assessmentId, actionId: input.actionId, profileId: workspace(owner).profile!.id, language: 'en-US', versions: [{ version: 1, title: 'First title', body: 'First draft', createdAt: new Date().toISOString(), reviewStatus: 'draft', approvedAt: null }], currentVersion: 1 }
  saveRecord(owner, 'asset', asset.id, asset)
  return asset
}

beforeEach(() => {
  closeDatabases()
  vi.stubEnv('NEXORA_DB_PATH', ':memory:')
  vi.stubEnv('OPENAI_API_KEY', 'test-not-a-real-key')
  vi.stubEnv('OPENAI_MODEL', 'configured-test-model')
  vi.stubEnv('APP_ORIGIN', origin)
})
afterEach(() => { closeDatabases(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('account isolation and request security', () => {
  it('hashes passwords and sessions, authenticates, logs out, and rejects unauthenticated access', async () => {
    const { user, cookie } = await account()
    expect(user.locale).toBe('en-US')
    const row = database().prepare('SELECT password_hash FROM users WHERE id=?').get(user.id)!
    expect(row.password_hash).not.toContain(password)
    const token = database().prepare('SELECT token_hash FROM sessions WHERE user_id=?').get(user.id)!
    expect(token.token_hash).not.toBe(cookie.split('=')[1])
    expect((await getWorkspace(request('/api/workspace', undefined, '', 'GET'))).status).toBe(401)
    expect((await (await getSession(request('/api/session', undefined, cookie, 'GET'))).json()).user.id).toBe(user.id)
    expect((await login(request('/api/auth/login', { email: user.email, password: 'incorrect-password' }))).status).toBe(401)
    const signedIn = await login(request('/api/auth/login', { email: user.email, password }))
    expect(signedIn.status).toBe(200)
    await signOut(request('/api/auth/logout', {}, cookie))
    expect((await (await getSession(request('/api/session', undefined, cookie, 'GET'))).json()).user).toBeNull()
  })

  it('rejects cross-origin mutations and access to another owner’s asset, approval, download, evidence, and assessment', async () => {
    const a = await account()
    const b = await account('other@example.com')
    const asset = fixtureAsset(a.user.id)
    prepare(b.user.id)
    const context = { params: Promise.resolve({ id: asset.id }) }
    expect((await editAsset(request(`/api/assets/${asset.id}`, { title: 'Stolen', body: 'Changed' }, b.cookie, 'PUT'), context)).status).toBe(404)
    expect((await approve(request(`/api/assets/${asset.id}/approve`, { version: 1 }, b.cookie), context)).status).toBe(404)
    expect((await download(request(`/api/assets/${asset.id}/download?version=1`, undefined, b.cookie, 'GET'), context)).status).toBe(404)
    expect((await editAsset(request(`/api/assets/${asset.id}`, { title: 'Changed', body: 'Changed' }, a.cookie, 'PUT', 'https://attacker.example'), context)).status).toBe(403)
    const w = addEvidence(a.user.id, { metric: 'visitors', value: 0, unit: 'count', currency: null, ...measuredToday('America/New_York'), source: 'manual', sourceNote: 'Analytics export' })
    expect(() => assess(b.user.id, { evidenceIds: [w.evidence[0].id] })).toThrow('not found in your account')
    await expect(generate(b.user.id, { assessmentId: asset.assessmentId, actionId: asset.actionId, idempotencyKey: 'private-request-key', counts: { hooks: 1, adCopy: 0, scripts: 0, ctas: 0 } })).rejects.toMatchObject({ status: 404 })
    expect(workspace(b.user.id).assets).toHaveLength(0)
    expect(workspace(a.user.id).assets[0].versions[0].body).toBe('First draft')
  })
})

describe('real provider protocol and duplicate handling', () => {
  it('deduplicates in-flight and completed calls, binds payloads, and sends strict structured output to the configured model', async () => {
    const { user } = await account()
    const input = prepare(user.id)
    let finish!: (response: Response) => void
    const fetchMock = vi.fn<typeof fetch>(() => new Promise<Response>(resolve => { finish = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    const first = generate(user.id, input)
    await expect(generate(user.id, input)).rejects.toMatchObject({ code: 'JOB_RUNNING' })
    finish(providerResponse())
    const w = await first
    expect(w.jobs[0].status).toBe('succeeded')
    expect(w.assets).toHaveLength(1)
    expect(w.assets[0].versions[0].reviewStatus).toBe('draft')
    await generate(user.id, input)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(workspace(user.id).usage).toMatchObject([{ status: 'succeeded', inputTokens: 25, outputTokens: 18, estimated: false }])
    await expect(generate(user.id, { ...input, counts: { ...input.counts, hooks: 2 } })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
    const options = fetchMock.mock.calls[0][1] as RequestInit
    const sent = JSON.parse(options.body as string)
    expect(sent.model).toBe('configured-test-model')
    expect(sent.store).toBe(false)
    expect(sent.text.format).toMatchObject({ type: 'json_schema', strict: true })
    expect(sent.tools).toBeUndefined()
  })

  it('records missing configuration as failure, preserves failed idempotency keys, and never fakes assets', async () => {
    const { user, cookie } = await account()
    const input = prepare(user.id)
    vi.stubEnv('OPENAI_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await generateRoute(request('/api/generate', input, cookie))
    expect(response.status).toBe(503)
    expect((await response.json()).code).toBe('PROVIDER_NOT_CONFIGURED')
    expect(workspace(user.id).jobs[0].status).toBe('failed')
    expect(workspace(user.id).assets).toHaveLength(0)
    expect(workspace(user.id).usage[0]).toMatchObject({ status: 'failed', inputTokens: null, outputTokens: null, estimated: true })
    await expect(generate(user.id, input)).rejects.toMatchObject({ code: 'JOB_FAILED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid schema and incomplete responses while retaining actual failed-call usage', async () => {
    const { user } = await account()
    const input = prepare(user.id)
    const fetchMock = vi.fn().mockResolvedValue(providerResponse({ ...packageValue(), assets: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(generate(user.id, input)).rejects.toMatchObject({ code: 'PROVIDER_INVALID_RESPONSE' })
    expect(workspace(user.id).assets).toHaveLength(0)
    expect(workspace(user.id).usage[0]).toMatchObject({ status: 'failed', inputTokens: 25, outputTokens: 18, estimated: false })
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: 'incomplete', output: [], usage: { input_tokens: 4, output_tokens: 2 } })))
    await expect(generate(user.id, { ...input, idempotencyKey: 'second-request-key' })).rejects.toMatchObject({ code: 'PROVIDER_INCOMPLETE' })
    expect(workspace(user.id).assets).toHaveLength(0)
    expect(workspace(user.id).usage).toHaveLength(2)
  })

  it('does not retry unknown timeout outcomes and stores a recoverable failed job', async () => {
    const { user } = await account()
    const input = prepare(user.id)
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('timeout detail must not leak', 'TimeoutError'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(generate(user.id, input)).rejects.toMatchObject({ code: 'PROVIDER_TIMEOUT' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(workspace(user.id).jobs[0].errorCode).toBe('PROVIDER_TIMEOUT')
    expect(workspace(user.id).usage[0].estimated).toBe(true)
  })
})

describe('revision approvals, actual use, result evidence, and durable migration', () => {
  it('records a cost-review action and its results without requiring any marketing assets', async () => {
    const { user } = await account()
    updateProfile(user.id, { ...createProfileDefaults('America/Chicago'), name: 'Repair Studio', industry: 'Repair services', offering: 'Equipment repairs', customerType: 'Local businesses', salesChannels: ['Direct'], goal: 'profitability' })
    const baseline = assess(user.id, { evidenceIds: [] })
    const assessment = baseline.assessments[0]
    const action = assessment.recommendedActions.find(item => item.kind === 'review_costs')!
    const completed = recordExecution(user.id, { assessmentId: assessment.id, actionId: action.id, channel: 'Internal cost review', usedAt: new Date().toISOString(), notes: 'Reviewed supplier and fixed costs.' })
    expect(completed.assets).toHaveLength(0)
    expect(completed.executions[0]).toMatchObject({ assetId: null, assetVersion: null, assessmentId: assessment.id, actionId: action.id })
    const recorded = recordResult(user.id, { executionId: completed.executions[0].id, metric: 'cost', value: 32500, unit: 'minor', currency: 'USD', ...measuredToday('America/Chicago'), adSpendMinor: null, adSpendCurrency: null, priceChangeNote: '', source: 'manual', sourceNote: 'Expense ledger', notes: 'Complete recorded daily costs.' })
    expect(recorded.results[0].value).toBe(32500)
    expect(recorded.evidence[0]).toMatchObject({ profileId: baseline.profile!.id, metric: 'cost', value: 32500, currency: 'USD' })
    const reassessed = assess(user.id, { evidenceIds: recorded.evidence.map(item => item.id) })
    expect(reassessed.assessments).toHaveLength(2)
    expect(reassessed.assessments[1].previousAssessmentId).toBe(assessment.id)
    expect(reassessed.assessments[1].evidenceIds).toContain(recorded.evidence[0].id)
    expect(reassessed.assets).toHaveLength(0)
  })

  it('rejects cross-owner manual action completion and prevents bypassing asset approval', async () => {
    const first = await account()
    const second = await account('second-action@example.com')
    const input = prepare(first.user.id)
    const data = workspace(first.user.id)
    const collect = data.assessments[0].recommendedActions.find(action => action.kind === 'collect_data')!
    const completion = { assessmentId: input.assessmentId, actionId: collect.id, channel: 'Internal review', usedAt: new Date().toISOString(), notes: 'Reviewed inputs' }
    expect(() => recordExecution(second.user.id, completion)).toThrow('not found in your account')
    expect(() => recordExecution(first.user.id, { ...completion, actionId: 'invented-action' })).toThrow('Select an action')
    expect(() => recordExecution(first.user.id, { ...completion, actionId: input.actionId })).toThrow('Create and approve an asset')
    expect(workspace(first.user.id).executions).toHaveLength(0)
    expect(workspace(second.user.id).executions).toHaveLength(0)
  })

  it('rejects a manual completion before its owned recommendation was created', async () => {
    const { user } = await account()
    const input = prepare(user.id)
    const assessment = workspace(user.id).assessments[0]
    const action = assessment.recommendedActions.find(item => item.kind === 'collect_data')!
    const beforeAssessment = new Date(Date.parse(assessment.createdAt) - 1000).toISOString()
    expect(() => recordExecution(user.id, { assessmentId: input.assessmentId, actionId: action.id, channel: 'Internal review', usedAt: beforeAssessment, notes: '' })).toThrow('Completion must be on or after')
    expect(workspace(user.id).executions).toHaveLength(0)
  })

  it('validates outcome periods against the linked snapshot time zone and retains older evidence as a baseline', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-31T02:00:00.000Z'))
    const first = await account()
    const second = await account('other-results@example.com')
    const input = prepare(first.user.id)
    const assessment = workspace(first.user.id).assessments[0]
    const collect = assessment.recommendedActions.find(action => action.kind === 'collect_data')!
    const used = recordExecution(first.user.id, { assessmentId: input.assessmentId, actionId: collect.id, channel: 'Internal review', usedAt: new Date().toISOString(), notes: '' })
    const execution = used.executions[0]
    // A later profile edit must not reinterpret a previous execution's local reporting date.
    updateProfile(first.user.id, { ...used.profile!, timeZone: 'Pacific/Kiritimati' })
    const result = { executionId: execution.id, metric: 'visitors', value: 0, unit: 'count', currency: null, ...measuredToday('America/New_York'), adSpendMinor: null, adSpendCurrency: null, priceChangeNote: '', source: 'manual', sourceNote: 'Analytics export', notes: '' }
    expect(result.periodEnd).toBe('2026-10-30')
    expect(() => recordResult(second.user.id, result)).toThrow('not found in your account')
    expect(() => recordResult(first.user.id, { ...result, periodStart: '2026-10-29', periodEnd: '2026-10-29' })).toThrow('before the related action')
    expect(() => recordResult(first.user.id, { ...result, periodStart: '2026-10-31', periodEnd: '2026-10-31' })).toThrow('cannot end in the future')
    expect(workspace(first.user.id).results).toHaveLength(0)
    expect(recordResult(first.user.id, result).results).toHaveLength(1)
    const earlier = { metric: 'visitors', value: 10, unit: 'count', currency: null, periodStart: '2026-10-01', periodEnd: '2026-10-07', source: 'manual', sourceNote: 'Baseline analytics' }
    expect(addEvidence(first.user.id, earlier).evidence.some(row => row.sourceNote === 'Baseline analytics')).toBe(true)
    const future = addCalendarDays(getLocalDateKey(new Date(), 'Pacific/Kiritimati'), 1)
    expect(() => addEvidence(first.user.id, { ...earlier, periodStart: future, periodEnd: future })).toThrow('cannot end in the future')
    expect(workspace(second.user.id).results).toHaveLength(0)
  })

  it('keeps prior versions, requires exact approval, and never turns a download into actual use', async () => {
    const { user, cookie } = await account()
    const asset = fixtureAsset(user.id)
    const context = { params: Promise.resolve({ id: asset.id }) }
    expect((await download(request(`/api/assets/${asset.id}/download?version=1`, undefined, cookie, 'GET'), context)).status).toBe(409)
    expect((await approve(request(`/api/assets/${asset.id}/approve`, { version: 1 }, cookie), context)).status).toBe(200)
    const file = await download(request(`/api/assets/${asset.id}/download?version=1`, undefined, cookie, 'GET'), context)
    expect(file.status).toBe(200)
    expect(await file.text()).toContain('First draft')
    expect(workspace(user.id).executions).toHaveLength(0)
    expect((await editAsset(request(`/api/assets/${asset.id}`, { title: 'Second title', body: 'Second draft' }, cookie, 'PUT'), context)).status).toBe(200)
    expect((await approve(request(`/api/assets/${asset.id}/approve`, { version: 1 }, cookie), context)).status).toBe(409)
    expect((await download(request(`/api/assets/${asset.id}/download?version=2`, undefined, cookie, 'GET'), context)).status).toBe(409)
    expect(workspace(user.id).assets[0].versions).toMatchObject([{ version: 1, body: 'First draft', reviewStatus: 'approved' }, { version: 2, body: 'Second draft', reviewStatus: 'draft' }])
    expect(() => recordExecution(user.id, { assetId: asset.id, assetVersion: 2, channel: 'Website', usedAt: new Date().toISOString(), notes: '' })).toThrow('Approve this exact version')
    const used = recordExecution(user.id, { assetId: asset.id, assetVersion: 1, channel: 'Website', usedAt: new Date().toISOString(), notes: 'Manually published' })
    const result = recordResult(user.id, { executionId: used.executions[0].id, metric: 'visitors', value: 0, unit: 'count', currency: null, ...measuredToday('America/New_York'), adSpendMinor: 0, adSpendCurrency: 'USD', priceChangeNote: 'No price changes', source: 'manual', sourceNote: 'Analytics export', notes: '' })
    expect(result.results[0].value).toBe(0)
    expect(result.evidence[0]).toMatchObject({ id: `result_${result.results[0].id}`, value: 0, unit: 'count', currency: null })
    expect(assess(user.id, { evidenceIds: result.evidence.map(e => e.id) }).assessments).toHaveLength(2)
    expect(workspace(user.id).assessments[0].evidenceIds).toEqual([])
  })

  it('preserves a KRW legacy archive without changing the current USD business or uploading twice', async () => {
    const { user } = await account()
    prepare(user.id)
    const w = importLegacy(user.id, { data: { locale: 'ko-KR', industry: 'restaurant', stage: 'operating', businessMetrics: [{ date: '2026-09-01', revenue: 120000, customerCount: 10, averageOrderValue: 12000, memo: '원본 기록' }] } })
    expect(w.profile!.currency).toBe('USD')
    expect(w.legacyImport).toMatchObject({ currency: 'KRW', locale: 'ko-KR' })
    expect(w.evidence).toHaveLength(0)
    expect(w.legacyImport!.data.businessMetrics).toMatchObject([{ revenue: 120000 }])
    expect(() => importLegacy(user.id, { data: {} })).toThrow('already been imported')
  })

  it('imports a full persistence envelope and preserves original fields that sanitation cannot interpret', async () => {
    const { user } = await account()
    const original = { state: { locale: 'ko-KR', industry: 'restaurant', customHistory: '기존 원문', scores: { main_customer: 600 } }, version: 1 }
    const w = importLegacy(user.id, { data: original })
    expect(w.legacyImport!.data.originalImport).toEqual(original)
    expect(w.legacyImport!.data.persistenceVersion).toBe(1)
    expect(w.legacyImport!.locale).toBe('ko-KR')
    expect(w.profile).toBeNull()
    expect(w.evidence).toHaveLength(0)
  })

  it('recovers an interrupted job as an unknown-outcome failure without replaying its provider call', async () => {
    const { user } = await account()
    const input = prepare(user.id)
    saveRecord(user.id, 'job', 'interrupted-job', { id: 'interrupted-job', assessmentId: input.assessmentId, actionId: input.actionId, status: 'running', provider: 'openai', model: 'configured-test-model', idempotencyKey: input.idempotencyKey, createdAt: new Date(Date.now() - 11 * 60_000).toISOString(), completedAt: null, errorCode: null, referenceAnalysis: null, referenceSource: null, replacesJobId: null })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const recovered = workspace(user.id)
    expect(recovered.jobs[0]).toMatchObject({ status: 'failed', errorCode: 'JOB_INTERRUPTED' })
    expect(recovered.usage[0]).toMatchObject({ status: 'failed', estimated: true, inputTokens: null })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(workspace(user.id).usage).toHaveLength(1)
  })

  it('retains account-scoped data and schema migration after closing and reopening SQLite', async () => {
    closeDatabases()
    const directory = mkdtempSync(join(tmpdir(), 'nexora-server-test-'))
    vi.stubEnv('NEXORA_DB_PATH', join(directory, 'test.sqlite'))
    try {
      const { user } = await account()
      prepare(user.id)
      closeDatabases()
      expect(workspace(user.id).profile!.name).toBe('Sample Studio')
      expect(workspace(user.id).assessments).toHaveLength(1)
      expect(database().prepare('SELECT version FROM schema_migrations').all()).toHaveLength(2)
    } finally {
      closeDatabases()
      for (const name of readdirSync(directory)) unlinkSync(join(directory, name))
      rmdirSync(directory)
    }
  })
})
