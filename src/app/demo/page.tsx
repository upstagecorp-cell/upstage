import type { Metadata } from 'next'
import { DemoExperience } from '@/components/workspace/DemoExperience'
export const metadata: Metadata = { title:'Explore a fictional example',description:'Preview an explicitly fictional assessment, marketing draft, and performance format before creating an account.' }
export default function DemoPage() { return <DemoExperience/> }
