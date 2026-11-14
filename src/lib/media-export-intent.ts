export interface MediaExportIntent {
  signature: string
  id: string
  jobId?: string
}

interface ExportJobStatus {
  id: string
  status: string
}

/** Call only on an explicit export click. Unknown outcomes must keep their request key. */
export function nextMediaExportIntent(
  current: MediaExportIntent | null,
  signature: string,
  jobs: readonly ExportJobStatus[],
  createId: () => string,
): MediaExportIntent {
  const confirmedFailed = current?.jobId && jobs.some(job => job.id === current.jobId && job.status === 'failed')
  if (!current || current.signature !== signature || confirmedFailed) return { signature, id: createId() }
  return current
}
