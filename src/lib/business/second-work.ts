import type { Asset, AssetExecution, Assessment, Result } from './types'

export type SecondWorkStatus =
  | 'first_work'
  | 'approved_not_used'
  | 'used_no_result'
  | 'result_insufficient'
  | 'result_observed'

export interface SecondWorkContext {
  status: SecondWorkStatus
  priorAssessmentId: string | null
  priorAssetId: string | null
  priorExecutionId: string | null
  priorResultId: string | null
  nextQuestion: string
  directive: string
  observations: string[]
  revisionSignals: string[]
  constraints: string[]
}

interface SecondWorkInput {
  assessment: Assessment
  previousAssessments: Assessment[]
  assets: Asset[]
  executions: AssetExecution[]
  results: Result[]
}

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'your', 'from', 'into', '이', '그', '및', '을', '를', '에'])

function words(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(word => word.length > 2 && !STOP_WORDS.has(word))
}

function changedWords(previous: string, current: string): string[] {
  const before = new Set(words(previous))
  return [...new Set(words(current).filter(word => !before.has(word)))].slice(0, 8)
}

function latestApprovedAsset(assets: Asset[], assessment: Assessment): Asset | null {
  return assets
    .filter(asset => asset.profileId === assessment.profileId)
    .filter(asset => asset.versions.some(version => version.reviewStatus === 'approved'))
    .sort((a, b) => {
      const at = a.versions.at(-1)?.createdAt ?? ''
      const bt = b.versions.at(-1)?.createdAt ?? ''
      return Date.parse(bt) - Date.parse(at)
    })[0] ?? null
}

function latestExecution(executions: AssetExecution[], asset: Asset): AssetExecution | null {
  return executions
    .filter(execution => execution.assetId === asset.id && execution.status === 'used')
    .sort((a, b) => Date.parse(b.usedAt) - Date.parse(a.usedAt))[0] ?? null
}

function resultForExecution(results: Result[], execution: AssetExecution | null): Result | null {
  if (!execution) return null
  return results
    .filter(result => result.executionId === execution.id)
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0] ?? null
}

function hasComparableResult(result: Result, results: Result[]): boolean {
  return results.some(other => other.id !== result.id && other.metric === result.metric && other.unit === result.unit && other.currency === result.currency && Date.parse(other.periodEnd) < Date.parse(result.periodStart))
}

function revisionSignals(asset: Asset | null): string[] {
  if (!asset) return []
  const approved = asset.versions.filter(version => version.reviewStatus === 'approved')
  if (approved.length < 2) return []
  const current = approved.at(-1)!
  const previous = approved.at(-2)!
  const changed = changedWords(previous.body, current.body)
  return changed.length ? [`Previous approved revision changed or added these terms: ${changed.join(', ')}.`] : ['The previous approved revision was materially reviewed; preserve the owner-approved tone and verify the next message.']
}

/**
 * Deterministically turns prior owned work into a bounded instruction for the next generation.
 * It never declares causation, never overwrites evidence, and never crosses account boundaries.
 */
export function buildSecondWorkContext(input: SecondWorkInput): SecondWorkContext {
  const { assessment, previousAssessments, assets, executions, results } = input
  const priorAssessment = previousAssessments
    .filter(item => item.id !== assessment.id && item.profileId === assessment.profileId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null
  const asset = latestApprovedAsset(assets, assessment)
  const execution = asset ? latestExecution(executions, asset) : null
  const result = resultForExecution(results, execution)
  const revision = revisionSignals(asset)
  const constraints = [
    'Use current business facts before historical wording.',
    'Do not claim that a recorded result proves causation or guarantees performance.',
    'Do not reuse historical prices, guarantees, benefits, or claims unless current facts independently support them.',
  ]

  if (!asset) {
    return { status: 'first_work', priorAssessmentId: priorAssessment?.id ?? null, priorAssetId: null, priorExecutionId: null, priorResultId: null,
      nextQuestion: 'What is the single customer-acquisition or marketing question this first work should answer?',
      directive: 'This is the first available marketing work. Start from the current problem, customer, offer, channel, and missing information.', observations: [], revisionSignals: revision, constraints }
  }

  if (!execution) {
    return { status: 'approved_not_used', priorAssessmentId: priorAssessment?.id ?? null, priorAssetId: asset.id, priorExecutionId: null, priorResultId: null,
      nextQuestion: 'What prevented the owner from using the approved result: content, channel access, time, offer uncertainty, or another blocker?',
      directive: 'The previous approved result was not recorded as used. Ask about the usage blocker before optimizing performance or declaring a winning message.', observations: ['An approved prior asset exists, but no actual use record is attached.'], revisionSignals: revision, constraints }
  }

  if (!result) {
    return { status: 'used_no_result', priorAssessmentId: priorAssessment?.id ?? null, priorAssetId: asset.id, priorExecutionId: execution.id, priorResultId: null,
      nextQuestion: 'Which metric, source, currency, and completed reporting period can be recorded for the actual use?',
      directive: 'The previous result was used, but no compatible outcome is recorded. Request a measured result and keep performance conclusions provisional.', observations: [`The prior asset was used on ${execution.usedAt.slice(0, 10)} via ${execution.channel || 'an unspecified channel'}.`], revisionSignals: revision, constraints }
  }

  if (!hasComparableResult(result, results)) {
    return { status: 'result_insufficient', priorAssessmentId: priorAssessment?.id ?? null, priorAssetId: asset.id, priorExecutionId: execution.id, priorResultId: result.id,
      nextQuestion: 'What additional compatible observation or denominator is needed before comparing this result?',
      directive: 'A result is recorded, but there is not yet a compatible prior observation. Do not declare a winner; propose one additional measurement or a clearer definition.', observations: [`Recorded ${result.metric}=${result.value} for ${result.periodStart} to ${result.periodEnd}.`], revisionSignals: revision, constraints }
  }

  return { status: 'result_observed', priorAssessmentId: priorAssessment?.id ?? null, priorAssetId: asset.id, priorExecutionId: execution.id, priorResultId: result.id,
    nextQuestion: 'Which single element should change next: target customer, offer framing, channel, or CTA?',
    directive: 'A compatible prior observation exists. Describe the measured change and alternative explanations, then change one controllable message element in the next draft.', observations: [`A compatible ${result.metric} observation is available for ${result.periodStart} to ${result.periodEnd}.`], revisionSignals: revision, constraints }
}

export function secondWorkPromptContext(context: SecondWorkContext): string {
  return JSON.stringify({ status: context.status, nextQuestion: context.nextQuestion, directive: context.directive, observations: context.observations, revisionSignals: context.revisionSignals, constraints: context.constraints })
}
