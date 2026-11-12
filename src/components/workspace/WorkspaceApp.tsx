'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, ChartNoAxesCombined, CheckCircle2, Compass, FileText, History, House, LogOut, Plus, RefreshCw, Settings2, SlidersHorizontal, Waypoints } from 'lucide-react'
import type { SessionUser, WorkspaceData } from '@/lib/business/types'
import type { FirstCheck } from '@/lib/business/first-check'
import { readFirstCheck, clearFirstCheck } from '@/lib/first-check-session'
import { BrandMark } from '@/components/brand/BrandMark'
import { ProfileEditor, EvidenceEditor } from './ProfileAndEvidence'
import { AssessmentPanel } from './AssessmentPanel'
import { ImageStudio } from './ImageStudio'
import { AssetsPanel } from './AssetsPanel'
import { ResultsPanel } from './ResultsPanel'
import { HistoryPanel } from './HistoryPanel'
import { WeeklyPlanPanel } from './WeeklyPlanPanel'
import { PerformancePanel } from './PerformancePanel'
import { WorkspaceOverview } from './WorkspaceOverview'
import { CheckHandoff } from './CheckHandoff'
import { BillingPanel } from './BillingPanel'
import { ApiError, ErrorText, friendlyError, requestJson, type Mutation } from './shared'

const sections=[
  {id:'overview',label:'My next move',icon:House,group:'main'},
  {id:'assessment',label:'Business check',icon:Compass,group:'main'},
  {id:'goals',label:'Weekly plan',icon:CalendarDays,group:'main'},
  {id:'assets',label:'Draft studio',icon:FileText,group:'main'},
  {id:'media',label:'Images & files',icon:FileText,group:'main'},
  {id:'evidence',label:'Your numbers',icon:Plus,group:'learn'},
  {id:'results',label:'Actions & outcomes',icon:Waypoints,group:'learn'},
  {id:'performance',label:'Performance',icon:ChartNoAxesCombined,group:'learn'},
  {id:'profile',label:'Business details',icon:Settings2,group:'settings'},
  {id:'history',label:'Past assessments',icon:History,group:'settings'},
  {id:'billing',label:'Plan & billing',icon:SlidersHorizontal,group:'settings'},
] as const
type Section=typeof sections[number]['id']
function currentSection(fallback:Section):Section { const hash=window.location.hash.slice(1);return sections.find(item=>item.id===hash)?.id??fallback }

export function WorkspaceApp({initialSection='overview'}:{initialSection?:Section}) {
  const [user,setUser]=useState<SessionUser|null>(null)
  const [data,setData]=useState<WorkspaceData|null>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [section,setSection]=useState<Section>(initialSection)
  const [selectedAssessmentId,setSelectedAssessmentId]=useState<string|null>(null)
  const [selectedActionId,setSelectedActionId]=useState<string|null>(null)
  const [selectedGoalId,setSelectedGoalId]=useState<string|null>(null)
  const [draft,setDraft]=useState<FirstCheck|null>(null)
  const lock=useRef(false)
  const refresh=useCallback(async():Promise<WorkspaceData|null>=>{
    try { const result=await requestJson<{workspace:WorkspaceData}>('/api/workspace');setData(result.workspace);return result.workspace }
    catch(failure){setError(friendlyError(failure));if(failure instanceof ApiError&&failure.status===401)setUser(null);return null}
  },[])
  const load=useCallback(async()=>{
    setLoading(true);setError('')
    try {const session=await requestJson<{user:SessionUser|null}>('/api/session');setUser(session.user);if(session.user)await refresh()}
    catch(failure){setError(friendlyError(failure))}finally{setLoading(false)}
  },[refresh])
  useEffect(()=>{
    let active=true
    const onHashChange=()=>setSection(currentSection(initialSection))
    const readContext=()=>{
      onHashChange();setDraft(readFirstCheck())
      const params=new URLSearchParams(window.location.search)
      const id=(key:string)=>{const value=params.get(key);return value&&/^[A-Za-z0-9_-]{1,200}$/.test(value)?value:null}
      setSelectedAssessmentId(id('assessment'));setSelectedActionId(id('action'));setSelectedGoalId(id('goal'))
    }
    const frame=requestAnimationFrame(readContext)
    window.addEventListener('hashchange',readContext)
    window.addEventListener('popstate',readContext)
    void requestJson<{user:SessionUser|null}>('/api/session').then(async session=>{if(!active)return;setUser(session.user);if(session.user)await refresh()}).catch(failure=>{if(active)setError(friendlyError(failure))}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false;cancelAnimationFrame(frame);window.removeEventListener('hashchange',readContext);window.removeEventListener('popstate',readContext)}
  },[refresh,initialSection])
  const mutate:Mutation=async(path,method,body,success)=>{
    if(lock.current)return null
    lock.current=true;setBusy(true);setError('');setNotice('')
    try {const result=await requestJson<{workspace:WorkspaceData}>(path,{method,body:JSON.stringify(body)});setData(result.workspace);setNotice(success);return result.workspace}
    catch(failure){setError(friendlyError(failure));if(failure instanceof ApiError&&failure.status===401)setUser(null);return null}
    finally{lock.current=false;setBusy(false)}
  }
  function navigate(next:Section,context?:{assessmentId:string|null;actionId:string|null;goalId:string|null}) {
    setSection(next);setNotice('')
    const url=new URL(window.location.href);url.hash=next
    const selection=context??{assessmentId:selectedAssessmentId,actionId:selectedActionId,goalId:selectedGoalId}
    for(const [key,value] of [['assessment',selection.assessmentId],['action',selection.actionId],['goal',selection.goalId]] as const){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key)}
    if(url.href!==window.location.href)window.history.pushState(null,'',url);window.scrollTo({top:0,behavior:'instant'})
  }
  async function logout(){if(lock.current)return;lock.current=true;setBusy(true);try{await requestJson('/api/auth/logout',{method:'POST',body:'{}'});setUser(null);setData(null);setNotice('')}catch(failure){setError(friendlyError(failure))}finally{lock.current=false;setBusy(false)}}
  function dismissDraft(){clearFirstCheck();setDraft(null)}
  function openAssets(assessmentId:string,actionId:string){setSelectedAssessmentId(assessmentId);setSelectedActionId(actionId);setSelectedGoalId(null);navigate('assets',{assessmentId,actionId,goalId:null})}
  function openPlan(assessmentId:string,actionId:string){setSelectedAssessmentId(assessmentId);setSelectedActionId(actionId);setSelectedGoalId(null);navigate('goals',{assessmentId,actionId,goalId:null})}
  function openResults(assessmentId:string,actionId:string,goalId:string|null=null){setSelectedAssessmentId(assessmentId);setSelectedActionId(actionId);setSelectedGoalId(goalId);navigate('results',{assessmentId,actionId,goalId})}
  if(loading)return <div className="nx-page" role="status">Opening your workspace…</div>
  if(!user)return <div className="nx-page !max-w-3xl !py-20"><Link href="/" className="nx-logo"><BrandMark/>nexora.</Link><p className="nx-eyebrow mt-16">Your business, a little clearer</p><h1 className="nx-heading mt-6">Find your next move.<br/>Keep building from there.</h1><p className="nx-copy mt-6 max-w-lg">Start with a few questions about what feels stuck. You can see a first direction before creating an account.</p><ErrorText error={error}/><div className="mt-8 flex flex-wrap gap-3"><Link href="/start" className="nx-button">Start my business check <ArrowUpRight size={16}/></Link><Link href="/login" className="nx-button nx-button-secondary">Log in to my workspace</Link></div>{error&&<button className="nx-button mt-5" onClick={()=>void load()}>Try again</button>}</div>
  if(!data)return <div className="nx-page"><ErrorText error={error||'Your workspace could not be loaded.'}/><button className="nx-button mt-5" onClick={()=>void load()}>Retry loading workspace</button></div>
  const selectedAssessment=data.assessments.find(item=>item.id===selectedAssessmentId)??data.assessments.at(-1)??null
  const selectedGoal=data.weeklyPlans.find(item=>item.id===selectedGoalId&&item.assessmentId===selectedAssessmentId&&item.actionId===selectedActionId)
  const selectedSection=sections.find(item=>item.id===section)!
  const overview=<WorkspaceOverview data={data} openAssessment={()=>navigate('assessment')} openPlan={openPlan} openEvidence={()=>navigate('evidence')} openAssets={openAssets} openGoals={()=>navigate('goals')} openProfile={()=>navigate('profile')}/>
  return <div className="nx-workspace">
    <aside className="nx-sidebar"><Link href="/" className="nx-logo px-3"><BrandMark/>nexora.</Link><div className="mt-9 rounded-xl border border-[var(--border)] px-3 py-3"><p className="truncate text-xs font-semibold">{data.profile?.name||'Your business'}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">Your space to move forward</p></div><nav aria-label="Workspace sections" className="mt-6">{(['main','learn'] as const).map(group=><div key={group} className={group==='learn'?'mt-7':''}>{group==='learn'&&<p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">Learn from the work</p>}{sections.filter(item=>item.group===group).map(({id,label,icon:Icon})=><button key={id} aria-current={section===id?'page':undefined} className="nx-side-link" onClick={()=>navigate(id)}><Icon size={17} strokeWidth={1.6}/>{label}</button>)}</div>)}<Link href="/explore" className="nx-side-link mt-5"><BookOpen size={17} strokeWidth={1.6}/>Practical guides<ArrowUpRight size={12} className="ml-auto"/></Link></nav><div className="mt-auto pt-8">{sections.filter(item=>item.group==='settings').map(({id,label,icon:Icon})=><button key={id} className="nx-side-link !py-2.5 !text-xs" aria-current={section===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={15}/>{label}</button>)}<div className="mt-5 flex items-center gap-3 border-t border-[var(--border)] pt-5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold">{user.email[0].toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-[10px] text-[var(--muted)]">{user.email}</span><button disabled={busy} onClick={logout} aria-label="Log out" className="text-[var(--muted)]"><LogOut size={15}/></button></div></div></aside>
    <div className="nx-workspace-main"><header className="mb-9 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-5"><div className="flex min-w-0 items-center gap-3"><Link href="/" aria-label="NEXORA home" className="md:hidden"><BrandMark/></Link><p className="truncate text-xs text-[var(--muted)]">{data.profile?.name||'Your workspace'} <span className="mx-2 opacity-40">/</span><span className="font-semibold text-[var(--foreground)]">{selectedSection.label}</span></p></div><div className="flex shrink-0 items-center gap-3"><span className="hidden items-center gap-1.5 text-[10px] text-[var(--muted)] sm:flex"><span className={`size-1.5 rounded-full ${busy?'bg-amber-500':'bg-[#7d9e5e]'}`}/>{busy?'Saving…':'Signed in'}</span><button aria-label="Refresh workspace" disabled={busy} onClick={()=>void refresh()} className="rounded-lg p-1.5 text-[var(--muted)]"><RefreshCw size={14}/></button><button onClick={()=>navigate('profile')} aria-label="Business details" className="rounded-lg p-1.5 text-[var(--muted)]"><SlidersHorizontal size={15}/></button><button disabled={busy} onClick={logout} aria-label="Log out" className="p-1.5 text-[var(--muted)] md:hidden"><LogOut size={15}/></button></div></header>
      <details className="nx-panel mb-6 !rounded-xl !p-3 md:hidden"><summary className="text-xs font-semibold">Explore your workspace</summary><nav className="mt-3 grid grid-cols-2 gap-2" aria-label="Workspace sections">{sections.map(({id,label,icon:Icon})=><button key={id} className="nx-side-link !p-2 !text-xs" aria-current={section===id?'page':undefined} onClick={event=>{navigate(id);event.currentTarget.closest('details')?.removeAttribute('open')}}><Icon size={14}/>{label}</button>)}</nav></details>
      <div className="mb-5 space-y-3" aria-live="polite"><ErrorText error={error}/>{notice&&<p role="status" className="flex items-start gap-2 rounded-xl bg-[var(--accent-soft)] p-4 text-xs leading-6"><CheckCircle2 size={16} className="mt-1 shrink-0"/>{notice}</p>}{busy&&<p role="status" className="text-xs text-[var(--muted)]">Saving your work…</p>}</div>
      {draft&&section!=='billing'&&<CheckHandoff check={draft} profile={data.profile} mutate={mutate} busy={busy} onDismiss={dismissDraft} onSaved={id=>{dismissDraft();setSelectedAssessmentId(id);setSelectedActionId(null);setSelectedGoalId(null);navigate('overview',{assessmentId:id,actionId:null,goalId:null})}}/>}
      <div aria-busy={busy}>
        {(section==='overview'||(!data.profile&&!['profile','history','billing','media'].includes(section)))&&overview}
        {section==='media'&&<ImageStudio/>}
        {section==='billing'&&<BillingPanel data={data} onUpdated={setData}/>}
        {section==='profile'&&<><div className="mb-7"><p className="nx-eyebrow">Your business, in your words</p><h1 className="nx-heading mt-4">Fill in the picture.</h1><p className="nx-copy mt-4 !text-sm">Add detail when it helps. You can leave the unknowns for later.</p></div><ProfileEditor key={data.profile?.version??'new'} profile={data.profile} mutate={mutate} busy={busy} onSaved={()=>navigate('overview')}/></>}
        {data.profile&&section==='evidence'&&<><SectionIntro title="A little evidence. More clarity." text="Start with one number you know. Keep the source and reporting period with it."/><EvidenceEditor profile={data.profile} evidence={data.evidence} mutate={mutate} busy={busy}/><button className="nx-button mt-6" onClick={()=>navigate('assessment')}>Use my numbers in a business check <ArrowRight size={16}/></button></>}
        {data.profile&&section==='assessment'&&<AssessmentPanel profile={data.profile} evidence={data.evidence} assessments={data.assessments} selected={selectedAssessment} selectAssessment={setSelectedAssessmentId} mutate={mutate} busy={busy} openAssets={openAssets} openEvidence={()=>navigate('evidence')} openResults={openResults} openPlan={openPlan}/>}
        {data.profile&&section==='assets'&&<><SectionIntro title="Give your next move a voice." text="Turn a relevant recommendation into a draft you can shape and review."/><AssetsPanel data={data} assessment={selectedAssessment} selectedActionId={selectedActionId} userId={user.id} mutate={mutate} busy={busy} refresh={refresh} openAssessment={()=>navigate('assessment')}/></>}
        {data.profile&&section==='goals'&&<><SectionIntro title="Make room for one good move." text="A manageable plan for the week ahead. Choose what matters, give it a date, and get started."/><WeeklyPlanPanel data={data} mutate={mutate} busy={busy} assessmentId={selectedAssessmentId} actionId={selectedActionId} goalId={selectedGoalId} openAssessment={()=>navigate('assessment')} openResults={openResults}/></>}
        {data.profile&&section==='results'&&<><SectionIntro title="What happened after the work?" text="Record what you did, then what you measured. The next useful question starts here."/><ResultsPanel data={data} mutate={mutate} busy={busy} assessmentId={selectedAssessmentId} actionId={selectedActionId} plan={selectedGoal} openAssets={()=>navigate('assets')} openAssessment={()=>navigate('assessment')}/></>}
        {data.profile&&section==='performance'&&<><SectionIntro title="See what’s changing." text="Your actual measurements, with the context to understand them."/><PerformancePanel evidence={data.evidence}/></>}
        {section==='history'&&<HistoryPanel data={data} mutate={mutate} busy={busy} viewAssessment={id=>{setSelectedAssessmentId(id);setSelectedActionId(null);setSelectedGoalId(null);navigate('assessment',{assessmentId:id,actionId:null,goalId:null})}}/>}
      </div>
    </div>
  </div>
}
function SectionIntro({title,text}:{title:string;text:string}) {return <div className="mb-8 nx-fade-in"><h1 className="nx-heading !text-[clamp(1.8rem,3vw,2.65rem)]">{title}</h1><p className="nx-copy mt-4 max-w-2xl !text-sm">{text}</p></div>}
