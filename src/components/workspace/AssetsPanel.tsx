'use client'

import { useState, type FormEvent } from 'react'
import { Check, Copy, Download, FileText, Sparkles } from 'lucide-react'
import type { Asset, AssetCounts, AssetVersion, Assessment, GenerationInput, WorkspaceData } from '@/lib/business/types'
import { missingGenerationFields } from '@/lib/business/industry'
import Link from 'next/link'
import { buttonClass, Card, Empty, ErrorText, Field, fieldClass, labelFor, secondaryClass, timestamp, type Mutation } from './shared'

interface PendingRequest { fingerprint: string; key: string }
function readPending(storageKey: string): PendingRequest | null {
  try { const parsed = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); return parsed && typeof parsed.fingerprint === 'string' && typeof parsed.key === 'string' ? parsed : null } catch { return null }
}

export function AssetsPanel({ data, assessment, selectedActionId, userId, mutate, busy, refresh, openAssessment }: {
  data: WorkspaceData; assessment: Assessment | null; selectedActionId: string | null; userId: string; mutate: Mutation; busy: boolean;
  refresh: () => Promise<WorkspaceData | null>; openAssessment: () => void;
}) {
  const marketingActions = assessment?.recommendedActions.filter(action => action.kind === 'marketing_assets') ?? []
  const initialActionId = marketingActions.some(action => action.id === selectedActionId) ? selectedActionId! : marketingActions[0]?.id ?? ''
  const timeZone = data.profile?.timeZone ?? 'UTC'

  return <div className="space-y-6">
    {assessment && marketingActions.length ? <GenerationForm key={`${assessment.id}:${initialActionId}`} assessment={assessment} actionId={initialActionId} data={data} userId={userId} mutate={mutate} busy={busy} refresh={refresh} /> : <Card title="Create Marketing Assets"><Empty>{assessment ? 'This assessment prioritizes evidence collection or other business work. Marketing generation is not recommended for this assessment.' : 'Run a Business Assessment to connect an asset package to a recommended action.'}</Empty><button className={`${secondaryClass} mt-4`} onClick={openAssessment}>View Business Assessment</button></Card>}

    <Card title="Review and Approve" description="Review each draft, verify its claims, and approve the exact version before copying or downloading it.">
      {data.assets.length ? <div className="space-y-5">{[...data.assets].reverse().map(asset => <AssetCard key={`${asset.id}:${asset.currentVersion}`} asset={asset} mutate={mutate} busy={busy} timeZone={timeZone} />)}</div> : <Empty>No assets yet. Generated packages will appear here. Short-form scripts are text, not completed videos.</Empty>}
    </Card>

    {data.jobs.length > 0 && <Card title="Generation history"><div className="space-y-4">{[...data.jobs].reverse().map(job => <div key={job.id} className="rounded-xl border border-[var(--border)] p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{job.status === 'succeeded' ? 'Generated' : job.status === 'running' ? 'Generation in progress' : 'Generation failed'}</span><span className="text-xs opacity-65">{timestamp(job.createdAt, 'en-US', timeZone)}</span></div><p className="mt-1 text-xs opacity-65">{job.provider} · {job.model}{job.replacesJobId ? ' · Regenerated package (earlier assets preserved)' : ''}</p>{job.status === 'failed' && <p className="mt-3 text-sm text-red-700 dark:text-red-300">No successful package was saved for this request. Review the service configuration or retry from the generation form.</p>}{job.status === 'running' && <p className="mt-3 text-sm opacity-65">Refresh the workspace before retrying. The same request key will not create a second package.</p>}{job.referenceAnalysis && <details className="mt-3"><summary className="cursor-pointer font-medium">Reference structure analysis</summary><p className="mt-2 whitespace-pre-wrap leading-relaxed">{job.referenceAnalysis}</p><p className="mt-2 break-words text-xs opacity-65">Source: {job.referenceSource}</p></details>}</div>)}</div></Card>}
  </div>
}

function GenerationForm({ assessment, actionId: initialActionId, data, userId, mutate, busy, refresh }: {
  assessment: Assessment; actionId: string; data: WorkspaceData; userId: string; mutate: Mutation; busy: boolean; refresh: () => Promise<WorkspaceData | null>;
}) {
  const [actionId, setActionId] = useState(initialActionId)
  const [counts, setCounts] = useState<AssetCounts>({ hooks: 3, adCopy: 2, scripts: 2, ctas: 2 })
  const [referenceText, setReferenceText] = useState('')
  const [referenceSource, setReferenceSource] = useState('')
  const [replacesJobId, setReplacesJobId] = useState('')
  const [error, setError] = useState('')
  const storageKey = `nexora-pending-generation-${userId}`
  const [pending, setPending] = useState<PendingRequest | null>(() => readPending(storageKey))
  const action = assessment.recommendedActions.find(item => item.id === actionId)
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const existingJob = pending ? data.jobs.find(job => job.idempotencyKey === pending.key) : null
  const missingProfileFields = missingGenerationFields(assessment.profileSnapshot)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!total) { setError('Choose at least one asset.'); return }
    if (referenceText.trim() && !referenceSource.trim()) { setError('Add a source description for the reference material.'); return }
    const payload = { assessmentId: assessment.id, actionId, counts, referenceText: referenceText.trim() || undefined, referenceSource: referenceText.trim() ? referenceSource.trim() : undefined, replacesJobId: replacesJobId || undefined }
    const fingerprint = JSON.stringify(payload)
    const previous = pending
    const knownJob = previous && data.jobs.find(job => job.idempotencyKey === previous.key)
    // Reuse an unresolved request after a network interruption. Starting another
    // package is explicit once the previous request has reached a terminal state.
    const key = previous?.fingerprint === fingerprint && (!knownJob || knownJob.status === 'running') ? previous.key : crypto.randomUUID()
    const nextPending = { fingerprint, key }
    setPending(nextPending)
    try { sessionStorage.setItem(storageKey, JSON.stringify(nextPending)) } catch { /* request remains protected for the mounted session */ }
    const input: GenerationInput = { ...payload, idempotencyKey: key }
    const result = await mutate('/api/generate', 'POST', input, 'Marketing package generated. Review and approve each asset before use.')
    if (!result) await refresh()
  }

  return <Card title="Create Marketing Assets" description="Generate a text package from your saved profile, assessment evidence, goal, and brand tone.">
    {!data.generationAvailable && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">Content generation is not configured on this server. Your profile and assessment work normally. An administrator must connect the text generation provider to enable this step.</p>}
    {missingProfileFields.length>0&&<p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">To create tailored drafts, add {missingProfileFields.join(', ')} to your <Link className="underline" href="/workspace#profile">Business Profile</Link>, then reassess. You can keep using the limited assessment and guides meanwhile.</p>}
    {assessment.profileVersion !== data.profile?.version && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This package will use the profile snapshot saved with this assessment. Reassess first if you want to use your updated profile.</p>}
    <form onSubmit={submit} className="space-y-5">
      <Field label="Recommended action"><select className={fieldClass} value={actionId} onChange={e => setActionId(e.target.value)}>{assessment.recommendedActions.filter(item => item.kind === 'marketing_assets').map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
      {action && <p className="text-sm leading-relaxed opacity-70">{action.reason} Evaluate with: {labelFor(action.metric)}.</p>}
      <fieldset><legend className="mb-3 text-sm font-semibold">Package quantities</legend><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{([['hooks', 'Hooks'], ['adCopy', 'Ad copy'], ['scripts', 'Short-form scripts'], ['ctas', 'Calls to action']] as const).map(([key, label]) => <Field key={key} label={label}><input className={fieldClass} type="number" required min={0} max={5} step={1} value={counts[key]} onChange={e => setCounts(previous => ({ ...previous, [key]: Number(e.target.value) }))} /></Field>)}</div><p className="mt-2 text-xs opacity-65">{total} text assets · American English · Scripts are text for a video, not rendered video files.</p></fieldset>
      <details className="rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer text-sm font-semibold">Reference content (optional)</summary><div className="mt-4 space-y-4"><p className="text-xs leading-relaxed opacity-65">Provide material you are allowed to use. We analyze structure such as hooks, offers, and calls to action, rather than copy another creator’s wording. Public views and likes do not prove sales performance.</p><Field label="Reference text"><textarea className={fieldClass} rows={4} maxLength={12000} value={referenceText} onChange={e => setReferenceText(e.target.value)} /></Field><Field label="Reference source" hint="Describe where the material came from. URLs are stored as references and are not fetched."><input className={fieldClass} maxLength={2000} required={Boolean(referenceText.trim())} value={referenceSource} onChange={e => setReferenceSource(e.target.value)} /></Field></div></details>
      {data.jobs.some(job => job.assessmentId === assessment.id && job.status === 'succeeded') && <Field label="Regenerate a previous package (optional)" hint="The earlier package and its approved versions remain in your history."><select className={fieldClass} value={replacesJobId} onChange={e => setReplacesJobId(e.target.value)}><option value="">Create a separate package</option>{data.jobs.filter(job => job.assessmentId === assessment.id && job.status === 'succeeded').map(job => <option key={job.id} value={job.id}>{timestamp(job.createdAt, 'en-US', data.profile?.timeZone)} · {job.id.slice(-8)}</option>)}</select></Field>}
      <ErrorText error={error} />
      <button className={buttonClass} disabled={busy || !data.generationAvailable || total < 1 || missingProfileFields.length>0}><Sparkles size={16} aria-hidden="true" />{busy ? 'Generating…' : existingJob?.status === 'failed' ? 'Retry as a new generation' : existingJob?.status === 'succeeded' ? 'Generate another package' : existingJob?.status === 'running' ? 'Check existing generation' : replacesJobId ? 'Regenerate package' : 'Generate package'}</button>
      <p className="text-xs leading-relaxed opacity-65">Nothing is posted automatically. Downloads and copying do not count as actual use or business results.</p>
    </form>
  </Card>
}

function AssetCard({ asset, mutate, busy, timeZone }: { asset: Asset; mutate: Mutation; busy: boolean; timeZone: string }) {
  const [versionNumber, setVersionNumber] = useState(asset.currentVersion)
  const version = asset.versions.find(item => item.version === versionNumber) ?? asset.versions[asset.versions.length - 1]
  return <article className="rounded-2xl border border-[var(--border)] p-4 sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} className="text-violet-600" aria-hidden="true" />{labelFor(asset.kind)}</div><label className="flex items-center gap-2 text-xs">Version<select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2" value={version.version} onChange={e => setVersionNumber(Number(e.target.value))}>{[...asset.versions].reverse().map(item => <option key={item.version} value={item.version}>{item.version} · {item.reviewStatus === 'approved' ? 'Approved' : 'Draft'}</option>)}</select></label></div>
    <details className="mb-4 text-sm"><summary className="cursor-pointer font-medium">Business context and measurement</summary><dl className="mt-3 grid gap-3 rounded-xl bg-[var(--surface-muted)] p-4 sm:grid-cols-2">{[['Linked problem', asset.linkedProblem], ['Target audience', asset.target], ['Key message', asset.keyMessage], ['Channel', asset.channel], ['Expected action', asset.expectedAction], ['Measurement metric', labelFor(asset.measurementMetric)]].map(([title, value]) => <div key={title}><dt className="text-xs font-medium opacity-60">{title}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl></details>
    {asset.claimsToVerify.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Claims to verify before use</p><ul className="mt-2 list-disc space-y-1 pl-5">{asset.claimsToVerify.map((claim, index) => <li key={index}>{claim}</li>)}</ul></div>}
    <VersionEditor key={`${asset.id}:${version.version}`} asset={asset} version={version} mutate={mutate} busy={busy} timeZone={timeZone} />
  </article>
}

function VersionEditor({ asset, version, mutate, busy, timeZone }: { asset: Asset; version: AssetVersion; mutate: Mutation; busy: boolean; timeZone: string }) {
  const [title, setTitle] = useState(version.title)
  const [body, setBody] = useState(version.body)
  const [checked, setChecked] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const changed = title !== version.title || body !== version.body
  const approved = version.reviewStatus === 'approved'

  async function copy() {
    setError('')
    try { await navigator.clipboard.writeText(`${version.title}\n\n${version.body}`); setFeedback(`Version ${version.version} copied.`) } catch { setError('Copy is unavailable in this browser. Download the approved text instead.') }
  }

  return <div className="space-y-4">
    <Field label="Title"><input className={fieldClass} required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></Field>
    <Field label="Asset text"><textarea className={fieldClass} required maxLength={12000} rows={7} value={body} onChange={e => setBody(e.target.value)} /></Field>
    <p className="text-xs opacity-65">Version {version.version} · {timestamp(version.createdAt, 'en-US', timeZone)} · {approved ? `Approved ${version.approvedAt ? timestamp(version.approvedAt, 'en-US', timeZone) : ''}` : 'Draft — awaiting your review'}</p>
    <div className="flex flex-wrap gap-2"><button className={secondaryClass} disabled={busy || !changed || !title.trim() || !body.trim()} onClick={() => mutate(`/api/assets/${asset.id}`, 'PUT', { title, body }, 'New draft version saved. Earlier versions and approvals are preserved.')}>Save as new version</button>
    {approved && <><button className={secondaryClass} disabled={changed || busy} onClick={copy}><Copy size={15} aria-hidden="true" />Copy approved version {version.version}</button><a className={`${secondaryClass} ${changed || busy ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={changed || busy} tabIndex={changed || busy ? -1 : undefined} href={changed || busy ? undefined : `/api/assets/${asset.id}/download?version=${version.version}`} download><Download size={15} aria-hidden="true" />Download version {version.version}</a></>}</div>
    {changed && <p className="text-xs text-amber-700 dark:text-amber-300">You have unsaved changes. Save a new draft version, then review and approve it.</p>}
    {!approved && <div className="rounded-xl bg-[var(--surface-muted)] p-4"><label className="flex items-start gap-3 text-sm leading-relaxed"><input className="mt-1 size-4 shrink-0 accent-violet-700" type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>I reviewed this exact version and verified any prices, offers, and claims before use.</span></label><button className={`${buttonClass} mt-4`} disabled={busy || changed || !checked} onClick={() => mutate(`/api/assets/${asset.id}/approve`, 'POST', { version: version.version }, `Version ${version.version} approved. Nothing has been posted.`)}><Check size={15} aria-hidden="true" />Approve version {version.version}</button></div>}
    <ErrorText error={error} />{feedback && <p role="status" className="text-xs text-violet-700 dark:text-violet-300">{feedback}</p>}
  </div>
}
