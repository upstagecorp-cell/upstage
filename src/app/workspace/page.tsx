import type { Metadata } from 'next'
import { WorkspaceApp } from '@/components/workspace/WorkspaceApp'

export const metadata: Metadata = { title: 'Business Workspace | NEXORA', description: 'Investigate an online-shop funnel, finish a cost worksheet or improvement plan, and review the result.' }
export default function WorkspacePage() { return <WorkspaceApp /> }
