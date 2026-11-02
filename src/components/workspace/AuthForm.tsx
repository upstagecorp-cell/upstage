'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import type { SessionUser } from '@/lib/business/types'
import { buttonClass, Card, ErrorText, Field, fieldClass, friendlyError, requestJson } from './shared'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const register = mode === 'register'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      await requestJson<{ user: SessionUser }>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password, locale: 'en-US' }) })
      router.replace('/workspace')
      router.refresh()
    } catch (failure) { setError(friendlyError(failure)) }
    finally { lock.current = false; setBusy(false) }
  }

  return <div className="mx-auto max-w-md px-5 py-12 sm:py-20">
    <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><LockKeyhole aria-hidden="true" size={23} /></div>
    <h1 className="text-3xl font-semibold tracking-tight">{register ? 'Create your account' : 'Welcome back'}</h1>
    <p className="mt-3 mb-7 text-sm leading-relaxed opacity-65">Keep your business assessments, approved assets, and results together.</p>
    <Card>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email"><input className={fieldClass} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
        <Field label="Password" hint={register ? 'Use at least 12 characters. No phone number or business registration is required.' : undefined}>
          <input className={fieldClass} type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <ErrorText error={error} />
        <button className={`${buttonClass} w-full`} disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}<ArrowRight size={16} aria-hidden="true" /></button>
      </form>
    </Card>
    <p className="mt-6 text-center text-sm">{register ? 'Already have an account?' : 'New to NEXORA?'}{' '}<Link className="font-semibold text-violet-700 dark:text-violet-300 hover:underline" href={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p>
  </div>
}
