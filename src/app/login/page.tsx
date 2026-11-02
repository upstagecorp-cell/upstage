import type { Metadata } from 'next'
import { AuthForm } from '@/components/workspace/AuthForm'

export const metadata: Metadata = { title: 'Log in | NEXORA', description: 'Log in to your NEXORA business workspace.' }
export default function LoginPage() { return <AuthForm mode="login" /> }
