'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Check, Compass, Eye, EyeOff } from 'lucide-react'
import type { SessionUser } from '@/lib/business/types'
import { buttonClass, ErrorText, Field, fieldClass, friendlyError, requestJson } from './shared'
import { readFirstCheck } from '@/lib/first-check-session'
import { CHECK_FOCUSES } from '@/lib/business/first-check'
import { SignalCanvas } from '@/components/marketing/ProductVisuals'
import { authDestinationFromSearch, authHref } from '@/lib/auth-destination'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  return <Suspense fallback={<div className="nx-page" role="status">Opening your account…</div>}><AuthFormContent mode={mode}/></Suspense>
}

function AuthFormContent({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const destination = authDestinationFromSearch(search)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedFocus,setSavedFocus]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const lock = useRef(false)
  const register = mode === 'register'
  useEffect(()=>{const frame=requestAnimationFrame(()=>{const check=readFirstCheck();if(check)setSavedFocus(CHECK_FOCUSES.find(item=>item.id===check.focus)?.title??'Your first direction')});return()=>cancelAnimationFrame(frame)},[])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      await requestJson<{ user: SessionUser }>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password, locale: 'en-US' }) })
      router.replace(destination)
      router.refresh()
    } catch (failure) { setError(friendlyError(failure)) }
    finally { lock.current = false; setBusy(false) }
  }

  return <div className="nx-page grid !max-w-[1040px] items-center gap-12 !py-12 md:grid-cols-2 md:gap-20 md:!py-20">
    <div><p className="nx-eyebrow">Keep moving forward</p><h1 className="nx-heading mt-6">{register?'A place for your next move.':'Welcome back.'}</h1><p className="nx-copy mt-5 max-w-sm !text-sm">{savedFocus?'Your answers are still here. Save your first direction and build a plan around it.':'Keep your business questions, weekly actions, and what you learn in one place.'}</p><div className="nx-auth-visual" aria-hidden="true"><SignalCanvas focus={CHECK_FOCUSES.find(item=>item.title===savedFocus)?.id}/></div><div className="nx-auth-journey"><span><i><Check size={12}/></i>Your context, kept together</span><span><i><Compass size={12}/></i>A clear place to pick up your next action</span></div></div>
    <div className="nx-panel !p-7 sm:!p-9"><h2 className="text-xl font-semibold tracking-tight">{register?'Create your account':'Log in to your workspace'}</h2><p className="mt-3 mb-7 text-xs leading-6 text-[var(--muted)]">{register?'Just an email and password to keep going.':'Your saved business and next actions are waiting.'}</p>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email"><input className={fieldClass} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
        <Field label="Password" hint={register ? 'Use at least 12 characters.' : undefined}>
          <input className={fieldClass} type={showPassword?'text':'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field><button type="button" onClick={()=>setShowPassword(!showPassword)} className="inline-flex items-center gap-2 text-[11px] text-[var(--muted)]">{showPassword?<EyeOff size={13}/>:<Eye size={13}/>} {showPassword?'Hide password':'Show password'}</button>
        <ErrorText error={error} />
        <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}<ArrowRight size={16} aria-hidden="true" /></button>
      </form>
    <p className="mt-6 text-xs leading-6 text-[var(--muted)]">{register ? 'Already have an account?' : 'New to NEXORA?'}{' '}<Link className="font-semibold text-[var(--foreground)] underline underline-offset-4" href={authHref(register ? '/login' : '/register', destination, search)}>{register ? 'Log in' : 'Create an account'}</Link></p>
    {!register&&<p className="mt-4 text-xs"><Link className="underline underline-offset-4" href="/forgot-password">Forgot your password?</Link></p>}
    {register&&<p className="mt-4 text-[11px] leading-6 text-[var(--muted)]">By creating an account, you agree to the <Link href="/terms" className="underline">terms</Link>. Review how we handle your data in the <Link href="/privacy" className="underline">privacy notice</Link>.</p>}
    <p className="mt-4 text-[11px] leading-6 text-[var(--muted)]"><Link href="/start" className="underline underline-offset-4">{savedFocus?'Review my first direction':'Explore a business check before signing up'}</Link></p></div>
  </div>
}
