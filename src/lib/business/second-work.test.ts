import { describe, expect, it } from 'vitest'
import { buildSecondWorkContext } from './second-work'
import type { Asset, Assessment, AssetExecution, Result } from './types'

const assessment = { id: 'assessment-2', profileId: 'profile-1', profileVersion: 2, profileSnapshot: {} as Assessment['profileSnapshot'], createdAt: '2026-11-16T00:00:00.000Z', evidenceIds: [], facts: [], opportunities: [], possibleCauses: [], alternativeExplanations: [], missingInformation: [], recommendedActions: [], previousAssessmentId: 'assessment-1' } satisfies Assessment
const asset = { id: 'asset-1', jobId: 'job-1', assessmentId: 'assessment-1', actionId: 'action-1', profileId: 'profile-1', kind: 'ad_copy', language: 'en-US', linkedProblem: 'low discovery', target: 'owners', keyMessage: 'clear offer', channel: 'Instagram', expectedAction: 'inquire', measurementMetric: 'visitors', claimsToVerify: [], currentVersion: 2, versions: [{ version: 1, title: 'Draft', body: 'clear offer for owners', createdAt: '2026-11-01T00:00:00.000Z', reviewStatus: 'approved', approvedAt: '2026-11-02T00:00:00.000Z' }, { version: 2, title: 'Revised', body: 'clear offer for local owners', createdAt: '2026-11-03T00:00:00.000Z', reviewStatus: 'approved', approvedAt: '2026-11-03T00:00:00.000Z' }] } satisfies Asset
const execution = { id: 'execution-1', assetId: asset.id, assetVersion: 2, assessmentId: asset.assessmentId, actionId: asset.actionId, channel: 'Instagram', usedAt: '2026-11-04T00:00:00.000Z', recordedAt: '2026-11-04T00:00:00.000Z', notes: '', status: 'used' } satisfies AssetExecution
const result = { id: 'result-1', executionId: execution.id, metric: 'visitors', value: 10, unit: 'count', currency: null, periodStart: '2026-11-04', periodEnd: '2026-11-05', adSpendMinor: null, adSpendCurrency: null, priceChangeNote: '', source: 'manual', sourceNote: 'analytics export', notes: '', recordedAt: '2026-11-06T00:00:00.000Z' } satisfies Result

function context(overrides: Partial<{ executions: AssetExecution[]; results: Result[] }> = {}) {
  return buildSecondWorkContext({ assessment, previousAssessments: [], assets: [asset], executions: overrides.executions ?? [], results: overrides.results ?? [] })
}

describe('second work context', () => {
  it('asks about a usage blocker before performance optimization', () => {
    expect(context().status).toBe('approved_not_used')
    expect(context().directive).toContain('usage blocker')
  })

  it('requests measurement when an approved asset was used without a result', () => {
    expect(context({ executions: [execution] }).status).toBe('used_no_result')
    expect(context({ executions: [execution] }).nextQuestion).toContain('metric')
  })

  it('does not declare a winner from one observation', () => {
    const next = context({ executions: [execution], results: [result] })
    expect(next.status).toBe('result_insufficient')
    expect(next.directive).toContain('not yet a compatible prior observation')
    expect(next.revisionSignals[0]).toContain('local')
  })

  it('uses a compatible prior observation to constrain the next change', () => {
    const prior = { ...result, id: 'result-0', executionId: 'execution-0', periodStart: '2026-10-20', periodEnd: '2026-10-25' }
    const next = context({ executions: [execution], results: [result, prior] })
    expect(next.status).toBe('result_observed')
    expect(next.directive).toContain('change one controllable message element')
  })
})
