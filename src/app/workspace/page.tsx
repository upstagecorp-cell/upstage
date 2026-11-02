import type { Metadata } from 'next'
import { WorkspaceApp } from '@/components/workspace/WorkspaceApp'

export const metadata: Metadata = { title: 'Business Workspace | NEXORA', description: 'Assess your business, review recommended actions, create marketing assets, and measure results.' }
export default function WorkspacePage() { return <WorkspaceApp /> }
