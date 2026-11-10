'use client'

import { useState } from 'react'
import { Download, History } from 'lucide-react'
import type { WorkspaceData } from '@/lib/business/types'
import { buttonClass, Card, downloadJson, Empty, ErrorText, labelFor, secondaryClass, timestamp, type Mutation } from './shared'

export function HistoryPanel({ data, mutate, busy, viewAssessment }: { data: WorkspaceData; mutate: Mutation; busy: boolean; viewAssessment: (id: string) => void }) {
  const [legacyData, setLegacyData] = useState<Record<string, unknown> | null>(null)
  const [checked, setChecked] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function inspectLegacy() {
    setError('')
    setMessage('')
    try {
      const raw = localStorage.getItem('startup-platform-store')
      if (!raw) { setMessage('No earlier NEXORA data was found in this browser.'); return }
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
      setLegacyData(parsed as Record<string, unknown>)
      setMessage('Earlier browser data is available. It has not been uploaded or converted.')
    } catch { setError('The earlier browser data could not be read. It has not been changed or removed.') }
  }

  return <div className="space-y-6">
    <Card title="History and exports" description="Assessments retain their profile snapshot and evidence references. Editing a profile or reassessing does not overwrite earlier assessments.">
      <button className={secondaryClass} onClick={() => downloadJson({ exportedAt: new Date().toISOString(), workspace: data }, 'nexora-workspace.json')}><Download size={16} aria-hidden="true" />Export my workspace</button>
      <div className="mt-5 space-y-3">{data.assessments.length ? [...data.assessments].reverse().map((assessment, index) => <article key={assessment.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">{index === 0 ? 'Latest assessment' : 'Earlier assessment'} · {assessment.profileSnapshot.name || 'Unnamed business'}</h3><p className="mt-1 text-xs opacity-65">{timestamp(assessment.createdAt, 'en-US', data.profile?.timeZone)} · Profile v{assessment.profileVersion} · {labelFor(assessment.profileSnapshot.goal)}</p><p className="mt-1 text-xs opacity-65">{assessment.evidenceIds.length} evidence records · {assessment.recommendedActions.length} recommended actions</p></div><button className={secondaryClass} onClick={() => viewAssessment(assessment.id)}><History size={15} aria-hidden="true" />View report</button></div></article>) : <Empty>No saved assessments yet.</Empty>}</div>
    </Card>

    <Card title="Generation usage" description="Provider-reported token counts are shown when available. Missing usage is not represented as zero, and no billing amount is inferred.">
      {data.usage.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Marketing package generation usage records</caption><thead><tr className="border-b border-[var(--border)]"><th scope="col" className="p-2">Recorded</th><th scope="col" className="p-2">Provider / model</th><th scope="col" className="p-2">Status</th><th scope="col" className="p-2">Input / output tokens</th><th scope="col" className="p-2">Usage basis</th></tr></thead><tbody>{[...data.usage].reverse().map(record => <tr key={record.id} className="border-b border-[var(--border)]"><td className="p-2 text-xs">{timestamp(record.recordedAt, 'en-US', data.profile?.timeZone)}</td><td className="p-2 text-xs">{record.provider}<br />{record.model}</td><td className="p-2">{record.status === 'succeeded' ? 'Succeeded' : 'Failed'}</td><td className="p-2 tabular-nums">{record.inputTokens === null ? 'Not reported' : new Intl.NumberFormat('en-US').format(record.inputTokens)} / {record.outputTokens === null ? 'Not reported' : new Intl.NumberFormat('en-US').format(record.outputTokens)}</td><td className="p-2 text-xs">{record.inputTokens === null && record.outputTokens === null ? 'Unavailable' : record.estimated ? 'Estimated' : 'Provider reported'}</td></tr>)}</tbody></table></div> : <Empty>No generation usage yet. Running a rule-based assessment does not call an AI provider.</Empty>}
    </Card>

    <Card title="Earlier browser data" description="Earlier NEXORA records remain in this browser. You can export them or explicitly upload an archival copy. Historical KRW amounts keep their original meaning and are not converted into USD.">
      <div className="flex flex-wrap gap-3"><button className={secondaryClass} onClick={inspectLegacy}>Check this browser for earlier data</button>{data.legacyImport && <button className={secondaryClass} onClick={() => downloadJson(data.legacyImport?.data.originalImport ?? data.legacyImport, 'nexora-earlier-data-archive.json')}><Download size={15} aria-hidden="true" />Export saved archive</button>}</div>
      {message && <p role="status" className="mt-4 text-sm leading-relaxed opacity-75">{message}</p>}
      {data.legacyImport && <p className="mt-4 text-xs leading-relaxed opacity-65">An archive was saved {timestamp(data.legacyImport.importedAt, 'en-US', data.profile?.timeZone)}. Its currency is KRW. The original locale is {data.legacyImport.locale ?? 'not recorded'}. Archived scores are historical records and are not used as current business measurements.</p>}
      {legacyData && <div className="mt-5 space-y-4 rounded-xl border border-[var(--border)] p-4"><button className={secondaryClass} onClick={() => downloadJson(legacyData, 'nexora-original-browser-data.json')}><Download size={15} aria-hidden="true" />Export original browser data</button><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-emerald-700" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>Upload an archival copy to my account. I understand it stays separate from current assessments and is not converted to USD.</span></label><button className={buttonClass} disabled={!checked || busy || Boolean(data.legacyImport)} onClick={() => mutate('/api/legacy-import', 'POST', { data: legacyData }, 'Earlier data archived. The original browser data is unchanged.')}>{data.legacyImport ? 'Archive already saved' : busy ? 'Saving archive…' : 'Save archival copy'}</button></div>}
      <div className="mt-4"><ErrorText error={error} /></div>
    </Card>
  </div>
}
