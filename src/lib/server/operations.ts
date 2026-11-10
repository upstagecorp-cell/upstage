import { createHash, randomUUID } from 'node:crypto'
import type { Asset, AssetExecution, Assessment, BusinessProfile, Evidence, ExecutionJob, GeneratedPackage, LegacyImport, Result, UsageRecord, WorkspaceData } from '@/lib/business/types'
import { createAssessment, resultToEvidence } from '@/lib/business/assessment'
import { buildGenerationRequest } from '@/lib/business/generation'
import { parseEvidenceInput, parseGenerationInput, parseProfileInput, parseResultInput, validateGeneratedPackage } from '@/lib/business/validation'
import { sanitizePersistedState } from '@/lib/store-persistence'
import { getLocalDateKey, isDateKey } from '@/lib/date-time'
import { database, getRecord, listRecords, saveRecord, transaction, workspace } from './database'
import { limit } from './auth'
import { HttpError, invalid, objectInput, textInput, versionInput } from './errors'
import { boundedConfig, generateFromProvider, ProviderError, type TokenUsage } from './provider'
import { missingGenerationFields } from '@/lib/business/industry'
import { approvedWordingForProfile } from '@/lib/business/approved-wording'
import { requireGenerationAllowance } from './billing'

function requiredRecord<T>(owner: string, kind: string, id: string): T {
  const value = getRecord<T>(owner, kind, id)
  if (!value) throw new HttpError(404, 'NOT_FOUND', 'This item was not found in your account.')
  return value
}
const profileFor = (owner: string) => requiredRecord<BusinessProfile>(owner, 'profile', 'current')
const now = () => new Date().toISOString()

function requireMeasuredPeriod(periodEnd: string, timeZone: string): void {
  if (periodEnd > getLocalDateKey(new Date(), timeZone)) invalid('A measured reporting period cannot end in the future in the business time zone.')
}

export function updateProfile(owner: string, raw: unknown): WorkspaceData {
  const input = parseProfileInput(raw)
  transaction(() => {
    const previous = getRecord<BusinessProfile>(owner, 'profile', 'current')
    const profile: BusinessProfile = { ...input, id: previous?.id || randomUUID(), version: (previous?.version || 0) + 1, updatedAt: now() }
    saveRecord(owner, 'profile', 'current', profile)
    saveRecord(owner, 'profile_version', `${profile.id}:${profile.version}`, profile)
    database().prepare('UPDATE users SET locale=? WHERE id=?').run(profile.uiLocale, owner)
  })
  return workspace(owner)
}

export function addEvidence(owner: string, raw: unknown): WorkspaceData {
  const input = parseEvidenceInput(raw)
  transaction(() => {
    const profile = profileFor(owner)
    requireMeasuredPeriod(input.periodEnd, profile.timeZone)
    const item: Evidence = { ...input, id: randomUUID(), profileId: profile.id, recordedAt: now() }
    saveRecord(owner, 'evidence', item.id, item)
  })
  return workspace(owner)
}

export function assess(owner: string, raw: unknown): WorkspaceData {
  const input = objectInput(raw)
  if (!Array.isArray(input.evidenceIds) || input.evidenceIds.length > 500 || input.evidenceIds.some(id => typeof id !== 'string' || id.length > 200)) invalid('Select valid evidence records.')
  const ids = [...new Set(input.evidenceIds as string[])]
  transaction(() => {
    const profile = profileFor(owner)
    const evidence = ids.map(id => requiredRecord<Evidence>(owner, 'evidence', id))
    if (evidence.some(item => item.profileId !== profile.id)) invalid('Select evidence for the current business profile.')
    const previous = listRecords<Assessment>(owner, 'assessment').at(-1)
    const assessment = createAssessment(profile, evidence, previous?.id || null)
    saveRecord(owner, 'assessment', assessment.id, assessment)
  })
  return workspace(owner)
}

function writeUsage(owner: string, job: ExecutionJob, status: UsageRecord['status'], usage?: TokenUsage): void {
  const entry: UsageRecord = { id: randomUUID(), jobId: job.id, operation: 'marketing_package', provider: job.provider, model: job.model, status, inputTokens: usage?.inputTokens ?? null, outputTokens: usage?.outputTokens ?? null, estimated: usage?.estimated ?? true, recordedAt: now() }
  saveRecord(owner, 'usage', job.id, entry)
}

export async function generate(owner: string, raw: unknown): Promise<WorkspaceData> {
  const input = parseGenerationInput(raw)
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex')
  let reused = false
  const job = transaction(() => {
    const key = database().prepare('SELECT payload_hash,job_id FROM generation_keys WHERE owner_id=? AND key=?')
      .get(owner, input.idempotencyKey) as { payload_hash: string; job_id: string } | undefined
    if (key) {
      if (key.payload_hash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This request key belongs to different generation settings. Start a new request.')
      const saved = requiredRecord<ExecutionJob>(owner, 'job', key.job_id)
      if (saved.status === 'running' && Date.now() - Date.parse(saved.createdAt) > 10 * 60_000) {
        saved.status = 'failed'; saved.completedAt = now(); saved.errorCode = 'JOB_INTERRUPTED'
        saveRecord(owner, 'job', saved.id, saved)
        writeUsage(owner, saved, 'failed')
      }
      reused = true
      return saved
    }
    const assessment = requiredRecord<Assessment>(owner, 'assessment', input.assessmentId)
    const action = assessment.recommendedActions.find(item => item.id === input.actionId)
    if (!action || action.kind !== 'marketing_assets') invalid('Select a marketing action from this assessment.')
    const missing = missingGenerationFields(assessment.profileSnapshot)
    if (missing.length) invalid(`Add ${missing.join(', ')} to your Business Profile and reassess before creating tailored assets.`)
    if (input.replacesJobId) {
      const previous = requiredRecord<ExecutionJob>(owner, 'job', input.replacesJobId)
      if (previous.assessmentId !== assessment.id || previous.actionId !== action.id) invalid('Select a previous generation for the same assessment and action.')
    }
    const running = listRecords<ExecutionJob>(owner, 'job').find(item => item.status === 'running' && Date.now() - Date.parse(item.createdAt) <= 10 * 60_000)
    if (running) throw new HttpError(409, 'JOB_RUNNING', 'A package is already being generated. Wait for it to finish.')
    requireGenerationAllowance(owner, Object.values(input.counts).reduce((sum, count) => sum + count, 0))
    const fresh: ExecutionJob = { id: randomUUID(), assessmentId: assessment.id, actionId: action.id, status: 'running', provider: 'openai', model: process.env.OPENAI_MODEL?.trim() || 'not-configured', idempotencyKey: input.idempotencyKey, createdAt: now(), completedAt: null, errorCode: null, referenceAnalysis: null, referenceSource: input.referenceSource || null, replacesJobId: input.replacesJobId || null }
    if (input.useApprovedContext) fresh.approvedWordingReferences = approvedWordingForProfile(listRecords<Asset>(owner, 'asset'), assessment.profileId)
    database().prepare('INSERT INTO generation_keys(owner_id,key,payload_hash,job_id) VALUES(?,?,?,?)').run(owner, input.idempotencyKey, hash, fresh.id)
    saveRecord(owner, 'job', fresh.id, fresh)
    return fresh
  })
  if (reused) {
    if (job.status === 'running') throw new HttpError(409, 'JOB_RUNNING', 'This package is still being generated. Refresh its saved status shortly.')
    if (job.status === 'failed') throw new HttpError(409, 'JOB_FAILED', 'This saved request failed. Review its status and explicitly start a new generation to retry.')
    return workspace(owner)
  }
  let tokenUsage: TokenUsage | undefined
  try {
    limit(`generation:${owner}`, boundedConfig('NEXORA_GENERATIONS_PER_HOUR', 10, 1, 1000), 60 * 60_000)
    const assessment = requiredRecord<Assessment>(owner, 'assessment', job.assessmentId)
    const action = assessment.recommendedActions.find(item => item.id === job.actionId)!
    const request = buildGenerationRequest(assessment.profileSnapshot, assessment, action, input, job.approvedWordingReferences ?? [])
    const response = await generateFromProvider(request)
    tokenUsage = response.usage
    let generated: GeneratedPackage
    try { generated = validateGeneratedPackage(response.value, input.counts, 'en-US', Boolean(input.referenceText)) }
    catch { throw new ProviderError(502, 'PROVIDER_INVALID_RESPONSE', 'The provider returned an incomplete or inconsistent package. No assets were saved.', tokenUsage) }
    transaction(() => {
      for (const item of generated.assets) {
        const { title, body, ...metadata } = item
        const asset: Asset = { ...metadata, id: randomUUID(), jobId: job.id, assessmentId: assessment.id, actionId: action.id, profileId: assessment.profileId, language: generated.language, versions: [{ version: 1, title, body, createdAt: now(), reviewStatus: 'draft', approvedAt: null }], currentVersion: 1 }
        saveRecord(owner, 'asset', asset.id, asset)
      }
      job.status = 'succeeded'; job.completedAt = now(); job.referenceAnalysis = generated.referenceAnalysis
      saveRecord(owner, 'job', job.id, job)
      writeUsage(owner, job, 'succeeded', tokenUsage)
    })
  } catch (error) {
    transaction(() => {
      job.status = 'failed'; job.completedAt = now(); job.errorCode = error instanceof HttpError ? error.code : 'GENERATION_FAILED'
      saveRecord(owner, 'job', job.id, job)
      writeUsage(owner, job, 'failed', error instanceof ProviderError ? error.usage : tokenUsage)
    })
    throw error
  }
  return workspace(owner)
}

export function reviseAsset(owner: string, id: string, raw: unknown): WorkspaceData {
  const input = objectInput(raw)
  const title = textInput(input.title, 'asset title', 200)
  const body = textInput(input.body, 'asset body', 12000)
  transaction(() => {
    const asset = requiredRecord<Asset>(owner, 'asset', id)
    const version = asset.currentVersion + 1
    asset.versions.push({ version, title, body, createdAt: now(), reviewStatus: 'draft', approvedAt: null })
    asset.currentVersion = version
    saveRecord(owner, 'asset', id, asset)
  })
  return workspace(owner)
}

export function approveAsset(owner: string, id: string, raw: unknown): WorkspaceData {
  const version = versionInput(objectInput(raw).version)
  transaction(() => {
    const asset = requiredRecord<Asset>(owner, 'asset', id)
    if (asset.currentVersion !== version) throw new HttpError(409, 'VERSION_CONFLICT', 'This asset changed. Review the current version before approving it.')
    const current = asset.versions.find(item => item.version === version)!
    if (current.reviewStatus !== 'approved') { current.reviewStatus = 'approved'; current.approvedAt = now() }
    saveRecord(owner, 'asset', id, asset)
  })
  return workspace(owner)
}

export function downloadAsset(owner: string, id: string, version: number): { filename: string; body: string } {
  const asset = requiredRecord<Asset>(owner, 'asset', id)
  const revision = asset.versions.find(item => item.version === version)
  if (!revision) throw new HttpError(404, 'NOT_FOUND', 'This asset version was not found.')
  if (revision.reviewStatus !== 'approved') throw new HttpError(409, 'APPROVAL_REQUIRED', 'Review and approve this exact version before downloading it.')
  return { filename: `nexora-${asset.kind}-${id.slice(0,8)}-v${version}.txt`, body: `${revision.title}\n\n${revision.body}\n\nLanguage: ${asset.language}\nChannel: ${asset.channel}\nMeasurement metric: ${asset.measurementMetric}\n${asset.claimsToVerify.length ? `\nClaims to verify:\n${asset.claimsToVerify.map(item => `- ${item}`).join('\n')}` : ''}` }
}

export function recordExecution(owner: string, raw: unknown): WorkspaceData {
  const input = objectInput(raw)
  const assetId = input.assetId == null ? null : textInput(input.assetId, 'asset ID', 200)
  const assetVersion = assetId === null ? null : versionInput(input.assetVersion)
  const assessmentId = assetId === null ? textInput(input.assessmentId, 'assessment ID', 200) : null
  const actionId = assetId === null ? textInput(input.actionId, 'action ID', 200) : null
  const channel = textInput(input.channel, 'channel', 200)
  const notes = textInput(input.notes ?? '', 'usage notes', 5000, false)
  if (typeof input.usedAt !== 'string' || !/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(input.usedAt) || !isDateKey(input.usedAt.slice(0, 10)) || !Number.isFinite(Date.parse(input.usedAt))) invalid('Enter the actual usage date and time with a time zone.')
  const usedAt = new Date(input.usedAt).toISOString()
  if (Date.parse(usedAt) > Date.now() + 60_000) invalid('Actual usage cannot be in the future.')
  transaction(() => {
    let linkedAssessmentId: string
    let linkedActionId: string
    if (assetId !== null) {
      const asset = requiredRecord<Asset>(owner, 'asset', assetId)
      const revision = asset.versions.find(item => item.version === assetVersion)
      if (!revision || revision.reviewStatus !== 'approved') throw new HttpError(409, 'APPROVAL_REQUIRED', 'Approve this exact version before recording actual use.')
      if (revision.approvedAt && Date.parse(usedAt) < Date.parse(revision.approvedAt)) invalid('The usage time must be on or after approval of this version.')
      linkedAssessmentId = asset.assessmentId
      linkedActionId = asset.actionId
    } else {
      const assessment = requiredRecord<Assessment>(owner, 'assessment', assessmentId!)
      const action = assessment.recommendedActions.find(item => item.id === actionId)
      if (!action) invalid('Select an action from this assessment.')
      if (action.kind === 'marketing_assets') throw new HttpError(409, 'APPROVAL_REQUIRED', 'Create and approve an asset before recording its actual use. Other business actions can be recorded directly.')
      if (Date.parse(usedAt) < Date.parse(assessment.createdAt)) invalid('Completion must be on or after the selected assessment.')
      linkedAssessmentId = assessment.id
      linkedActionId = action.id
    }
    const item: AssetExecution = { id: randomUUID(), assetId, assetVersion, assessmentId: linkedAssessmentId, actionId: linkedActionId, channel, usedAt, notes, recordedAt: now(), status: 'used' }
    saveRecord(owner, 'execution', item.id, item)
  })
  return workspace(owner)
}

export function recordResult(owner: string, raw: unknown): WorkspaceData {
  const input = parseResultInput(raw)
  transaction(() => {
    const execution = requiredRecord<AssetExecution>(owner, 'execution', input.executionId)
    const assessmentId = execution.assetId !== null
      ? requiredRecord<Asset>(owner, 'asset', execution.assetId).assessmentId
      : textInput(execution.assessmentId, 'linked assessment ID', 200)
    const assessment = requiredRecord<Assessment>(owner, 'assessment', assessmentId)
    const timeZone = assessment.profileSnapshot.timeZone
    requireMeasuredPeriod(input.periodEnd, timeZone)
    const executionDate = getLocalDateKey(new Date(execution.usedAt), timeZone)
    if (input.periodEnd < executionDate) invalid('A result period cannot end before the related action. Add earlier measurements as baseline evidence instead.')
    const result: Result = { ...input, id: randomUUID(), recordedAt: now() }
    saveRecord(owner, 'result', result.id, result)
    const evidence = resultToEvidence(result, assessment.profileId)
    saveRecord(owner, 'evidence', evidence.id, evidence)
  })
  return workspace(owner)
}

export function importLegacy(owner: string, raw: unknown): WorkspaceData {
  const input = objectInput(raw)
  const data = objectInput(input.data)
  transaction(() => {
    if (getRecord(owner, 'legacy', 'current')) throw new HttpError(409, 'LEGACY_ALREADY_IMPORTED', 'Legacy data has already been imported. Your saved copy was kept.')
    const rawState = data.state && typeof data.state === 'object' && !Array.isArray(data.state) ? data.state as Record<string, unknown> : data
    const state = sanitizePersistedState(rawState)
    const locale = rawState.locale === 'ko-KR' || rawState.locale === 'en-US' ? rawState.locale : null
    // Keep the entire original, bounded request as inert archive data so sanitation cannot erase user history.
    const archived = { ...state, originalImport: data, persistenceVersion: Number.isSafeInteger(data.version) ? data.version : null }
    const saved: LegacyImport = { importedAt: now(), locale, currency: 'KRW', data: archived }
    saveRecord(owner, 'legacy', 'current', saved)
  })
  return workspace(owner)
}
