import type { Metadata } from 'next'
import { AuthForm } from '@/components/workspace/AuthForm'

export const metadata: Metadata = { title: 'Create an account | NEXORA', description: 'Create your NEXORA business workspace.' }
export default function RegisterPage() { return <AuthForm mode="register" /> }
