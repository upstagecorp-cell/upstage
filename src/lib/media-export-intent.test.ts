import { describe, expect, it, vi } from 'vitest'
import { nextMediaExportIntent, type MediaExportIntent } from './media-export-intent'

const signature = 'project-a:1:1:1:png'

describe('explicit local image export intents', () => {
  it('creates a key for a new selection and binds it to project, version, ratio, and format', () => {
    const createId = vi.fn(() => 'new-request')
    const first = nextMediaExportIntent(null, signature, [], createId)
    expect(first).toEqual({ signature, id: 'new-request' })
    for (const changed of ['project-b:1:1:1:png', 'project-a:2:1:1:png', 'project-a:1:4:5:png', 'project-a:1:1:1:jpg']) {
      expect(nextMediaExportIntent(first, changed, [], createId)).toEqual({ signature: changed, id: 'new-request' })
    }
    expect(createId).toHaveBeenCalledTimes(5)
  })

  it('keeps a key for double clicks and an unknown POST outcome, even if an older export failed', () => {
    const current: MediaExportIntent = { signature, id: 'unknown-request' }
    const createId = vi.fn(() => 'must-not-create')
    const jobs = [{ id: 'older-job', status: 'failed' }]
    expect(nextMediaExportIntent(current, signature, jobs, createId)).toBe(current)
    expect(nextMediaExportIntent(current, signature, jobs, createId)).toBe(current)
    expect(createId).not.toHaveBeenCalled()
  })

  it('preserves queued, running, succeeded, and missing stored job outcomes', () => {
    const current: MediaExportIntent = { signature, id: 'saved-request', jobId: 'saved-job' }
    const createId = vi.fn(() => 'must-not-create')
    for (const status of ['queued', 'running', 'succeeded', 'unknown']) {
      expect(nextMediaExportIntent(current, signature, [{ id: current.jobId!, status }], createId)).toBe(current)
    }
    expect(nextMediaExportIntent(current, signature, [], createId)).toBe(current)
    expect(nextMediaExportIntent(current, signature, [{ id: 'other-job', status: 'failed' }], createId)).toBe(current)
    expect(createId).not.toHaveBeenCalled()
  })

  it('rotates once on an explicit click after that exact stored job failed, never from observation alone', () => {
    const current: MediaExportIntent = { signature, id: 'failed-request', jobId: 'failed-job' }
    const jobs = [{ id: 'failed-job', status: 'failed' }]
    const createId = vi.fn(() => 'retry-request')
    // Merely loading stored status does not mutate the intent or enqueue another job.
    expect(current).toEqual({ signature, id: 'failed-request', jobId: 'failed-job' })
    const retry = nextMediaExportIntent(current, signature, jobs, createId)
    expect(retry).toEqual({ signature, id: 'retry-request' })
    expect(nextMediaExportIntent(retry, signature, jobs, createId)).toBe(retry)
    retry.jobId = 'retry-job'
    expect(nextMediaExportIntent(retry, signature, [...jobs, { id: 'retry-job', status: 'queued' }], createId)).toBe(retry)
    expect(createId).toHaveBeenCalledTimes(1)
  })
})
