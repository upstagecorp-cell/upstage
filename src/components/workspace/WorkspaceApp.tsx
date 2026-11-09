'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, LogOut, RefreshCw } from 'lucide-react'
import type { SessionUser, WorkspaceData } from '@/lib/business/types'
import { ProfileEditor, EvidenceEditor } from './ProfileAndEvidence'
import { AssessmentPanel } from './AssessmentPanel'
import { AssetsPanel } from './AssetsPanel'
import { ResultsPanel } from './ResultsPanel'
import { HistoryPanel } from './HistoryPanel'
import { WeeklyPlanPanel } from './WeeklyPlanPanel'
import { PerformancePanel } from './PerformancePanel'
import { FocusedPanel } from './FocusedPanel'
import { ApiError, buttonClass, Card, ErrorText, friendlyError, requestJson, secondaryClass, type Mutation } from './shared'

const sections = [
  ['focus', 'Your next move'], ['profile', 'Business Profile'], ['evidence', 'Business Evidence'], ['assessment', 'Business Assessment'],
  ['assets', 'Marketing Assets'], ['goals','Weekly Plan'], ['results', 'Results'], ['performance','Performance'], ['history', 'History'],
] as const
type Section = typeof sections[number][0]
function currentSection(fallback: Section): Section { const hash = window.location.hash.slice(1); return sections.find(([id]) => id === hash)?.[0] ?? fallback }

export function WorkspaceApp({ initialSection = 'focus' }: { initialSection?: Section }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState<Section>(initialSection)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)
  const [selectedGoalId,setSelectedGoalId] = useState<string|null>(null)
  const lock = useRef(false)

  const refresh = useCallback(async (): Promise<WorkspaceData | null> => {
    try {
      const result = await requestJson<{ workspace: WorkspaceData }>('/api/workspace')
      setData(result.workspace)
      return result.workspace
    } catch (failure) {
      setError(friendlyError(failure))
      if (failure instanceof ApiError && failure.status === 401) setUser(null)
      return null
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const session = await requestJson<{ user: SessionUser | null }>('/api/session')
      setUser(session.user)
      if (session.user) await refresh()
    } catch (failure) { setError(friendlyError(failure)) }
    finally { setLoading(false) }
  }, [refresh])

  useEffect(() => {
    let active = true
    const onHashChange = () => setSection(currentSection(initialSection))
    const readContext = () => {
      onHashChange()
      const params = new URLSearchParams(window.location.search)
      const id = (key: string) => { const value=params.get(key);return value&&/^[A-Za-z0-9_-]{1,200}$/.test(value)?value:null }
      setSelectedAssessmentId(id('assessment'));setSelectedActionId(id('action'));setSelectedGoalId(id('goal'))
    }
    const frame = window.requestAnimationFrame(readContext)
    window.addEventListener('hashchange', onHashChange)
    void requestJson<{ user: SessionUser | null }>('/api/session').then(async session => {
      if (!active) return
      setUser(session.user)
      if (session.user) await refresh()
    }).catch(failure => { if (active) setError(friendlyError(failure)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; window.cancelAnimationFrame(frame); window.removeEventListener('hashchange', onHashChange) }
  }, [refresh,initialSection])

  const mutate: Mutation = async (path, method, body, success) => {
    if (lock.current) return null
    lock.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await requestJson<{ workspace: WorkspaceData }>(path, { method, body: JSON.stringify(body) })
      setData(result.workspace)
      setNotice(success)
      return result.workspace
    } catch (failure) {
      setError(friendlyError(failure))
      if (failure instanceof ApiError && failure.status === 401) setUser(null)
      return null
    } finally { lock.current = false; setBusy(false) }
  }

  function navigate(next: Section, context?: { assessmentId: string|null; actionId: string|null; goalId: string|null }) {
    setSection(next)
    setNotice('')
    const url = new URL(window.location.href)
    url.hash = next
    const selection = context ?? {assessmentId:selectedAssessmentId,actionId:selectedActionId,goalId:selectedGoalId}
    for (const [key,value] of [['assessment',selection.assessmentId],['action',selection.actionId],['goal',selection.goalId]] as const) {
      if (value) url.searchParams.set(key,value)
      else url.searchParams.delete(key)
    }
    window.history.replaceState(null, '', url)
  }

  async function logout() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await requestJson('/api/auth/logout', { method: 'POST', body: '{}' })
      setUser(null)
      setData(null)
      setNotice('')
    } catch (failure) { setError(friendlyError(failure)) }
    finally { lock.current = false; setBusy(false) }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-5 py-16" role="status"><p className="text-sm opacity-65">Loading your workspace…</p></div>
  if (!user) return <div className="mx-auto max-w-2xl px-5 py-16"><h1 className="text-3xl font-semibold tracking-tight">Your business workspace</h1><p className="mt-4 mb-7 text-base leading-relaxed opacity-65">Understand your business challenges and create the assets to act on them. Create an account to save your profile, evidence, assessments, and results.</p><ErrorText error={error} /><div className="mt-6 flex flex-wrap gap-3"><Link className={buttonClass} href="/register">Create an account <ArrowRight size={16} aria-hidden="true" /></Link><Link className={secondaryClass} href="/login">Log in</Link>{error && <button className={secondaryClass} onClick={() => void load()}>Try again</button>}</div></div>
  if (!data) return <div className="mx-auto max-w-2xl px-5 py-16"><ErrorText error={error || 'Your workspace could not be loaded.'} /><button className={`${buttonClass} mt-5`} onClick={() => void load()}>Retry loading workspace</button></div>

  const selectedAssessment = data.assessments.find(item => item.id === selectedAssessmentId) ?? data.assessments[data.assessments.length - 1] ?? null
  const approvedCount = data.assets.filter(asset => asset.versions.some(version => version.reviewStatus === 'approved')).length
  function openAssets(assessmentId: string, actionId: string) { setSelectedAssessmentId(assessmentId); setSelectedActionId(actionId);setSelectedGoalId(null); navigate('assets',{assessmentId,actionId,goalId:null}) }
  function openPlan(assessmentId: string,actionId: string) { setSelectedAssessmentId(assessmentId);setSelectedActionId(actionId);setSelectedGoalId(null);navigate('goals',{assessmentId,actionId,goalId:null}) }
  function openResults(assessmentId: string,actionId: string,goalId: string|null = null) { setSelectedAssessmentId(assessmentId);setSelectedActionId(actionId);setSelectedGoalId(goalId);navigate('results',{assessmentId,actionId,goalId}) }
  const selectedGoal = data.weeklyPlans.find(plan=>plan.id===selectedGoalId && plan.assessmentId===selectedAssessmentId && plan.actionId===selectedActionId)

  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-12">
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">NEXORA Workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{data.profile ? data.profile.name || 'Your business' : 'Start with your business'}</h1><p className="mt-2 text-sm opacity-65">{data.profile ? `${data.profile.industry || 'Industry not provided'} · ${data.profile.targetMarket} · ${data.profile.timeZone}` : 'Save your profile, assess the evidence, and choose your next action.'}</p></div><div className="flex flex-wrap items-center gap-2"><button className={secondaryClass} disabled={busy} onClick={() => void refresh()}><RefreshCw size={15} aria-hidden="true" />Refresh</button><button className={secondaryClass} disabled={busy} onClick={logout}><LogOut size={15} aria-hidden="true" />Log out</button></div></header>
    <div className="mb-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-xs font-medium opacity-65">Assessment evidence</p><p className="mt-2 text-xl font-semibold tabular-nums">{data.evidence.length} <span className="text-xs font-normal opacity-65">records</span></p></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-xs font-medium opacity-65">Execution activity</p><p className="mt-2 text-xl font-semibold tabular-nums">{data.executions.length} <span className="text-xs font-normal opacity-65">recorded actions · {approvedCount} approved assets</span></p></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-xs font-medium opacity-65">Measured business outcomes</p><p className="mt-2 text-xl font-semibold tabular-nums">{data.results.length} <span className="text-xs font-normal opacity-65">measurements</span></p></div></div>
    <nav aria-label="Workspace sections" className="mb-6 flex flex-wrap gap-2">{sections.map(([id, label]) => <button key={id} aria-current={section === id ? 'page' : undefined} className={`rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${section === id ? 'bg-violet-700 text-white' : 'border border-[var(--border)] bg-[var(--surface)] hover:border-violet-400'}`} onClick={() => navigate(id)}>{label}</button>)}</nav>
    <div className="mb-5 space-y-3" aria-live="polite"><ErrorText error={error} />{notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm leading-relaxed text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{notice}</p>}{busy && <p role="status" className="text-sm opacity-65">Processing your request. Keep this page open…</p>}</div>
    <div aria-busy={busy}>
      {data.profile && section === 'focus' && <FocusedPanel data={data} mutate={mutate} busy={busy} openProfile={() => navigate('profile')} />}
      {(section === 'profile' || section === 'focus' && !data.profile) && <ProfileEditor key={data.profile?.version ?? 'new'} profile={data.profile} mutate={mutate} busy={busy} onSaved={() => navigate('focus')} />}
      {section !== 'profile' && section !== 'focus' && section !== 'history' && !data.profile && <Card title="Save your Business Profile first"><p className="text-sm leading-relaxed opacity-65">Your assessment and assets need a saved profile to provide context.</p><button className={`${buttonClass} mt-5`} onClick={() => navigate('profile')}>Create Business Profile</button></Card>}
      {data.profile && section === 'evidence' && <EvidenceEditor profile={data.profile} evidence={data.evidence} mutate={mutate} busy={busy} />}
      {data.profile && section === 'assessment' && <AssessmentPanel profile={data.profile} evidence={data.evidence} assessments={data.assessments} selected={selectedAssessment} selectAssessment={setSelectedAssessmentId} mutate={mutate} busy={busy} openAssets={openAssets} openEvidence={() => navigate('evidence')} openResults={openResults} openPlan={openPlan} />}
      {data.profile && section === 'assets' && <AssetsPanel data={data} assessment={selectedAssessment} selectedActionId={selectedActionId} userId={user.id} mutate={mutate} busy={busy} refresh={refresh} openAssessment={() => navigate('assessment')} />}
      {data.profile && section === 'results' && <ResultsPanel data={data} mutate={mutate} busy={busy} assessmentId={selectedAssessmentId} actionId={selectedActionId} plan={selectedGoal} openAssets={() => navigate('assets')} openAssessment={() => navigate('assessment')} />}
      {data.profile && section === 'goals' && <WeeklyPlanPanel data={data} mutate={mutate} busy={busy} assessmentId={selectedAssessmentId} actionId={selectedActionId} goalId={selectedGoalId} openAssessment={()=>navigate('assessment')} openResults={openResults}/>}
      {data.profile && section === 'performance' && <PerformancePanel evidence={data.evidence}/>}
      {section === 'history' && <HistoryPanel data={data} mutate={mutate} busy={busy} viewAssessment={id => { setSelectedAssessmentId(id);setSelectedActionId(null);setSelectedGoalId(null); navigate('assessment',{assessmentId:id,actionId:null,goalId:null}) }} />}
    </div>
    <footer className="mt-8 text-xs leading-relaxed opacity-55">Signed in as {user.email}. Records are saved to this account. Generated assets require your review; nothing is posted or advertised automatically.</footer>
  </div>
}
