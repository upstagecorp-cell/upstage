import type { Metadata } from 'next'
import { WorkspaceApp } from '@/components/workspace/WorkspaceApp'
export const metadata: Metadata = { title:'Measured business performance',description:'Review actual revenue, costs, and conversion with reporting periods, sources, and units.' }
export default function MetricsPage() { return <WorkspaceApp initialSection="performance"/> }
