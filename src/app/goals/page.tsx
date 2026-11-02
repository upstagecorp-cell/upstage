import type { Metadata } from 'next'
import { WorkspaceApp } from '@/components/workspace/WorkspaceApp'
export const metadata: Metadata = { title:'Weekly execution plan',description:'Manage weekly goals connected to your saved recommendations, assets, and evaluation metrics.' }
export default function GoalsPage() { return <WorkspaceApp initialSection="goals"/> }
