import type { Metadata } from 'next'
import { GuideExplorer, type GuideContext } from '@/components/workspace/GuideExplorer'
export const metadata: Metadata = { title:'Strategy and execution guides',description:'Find practical guides connected to business assessment, weekly actions, and measured results.' }
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams
  const id = (key: string) => typeof params[key]==='string' && /^[A-Za-z0-9_-]{1,200}$/.test(params[key] as string)?params[key] as string:undefined
  const context: GuideContext = { guide:id('guide'),assessment:id('assessment'),action:id('action'),goal:id('goal'),returnTo:params.return==='goals'?'goals':'assessment' }
  return <GuideExplorer context={context}/>
}
