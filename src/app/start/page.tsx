import type { Metadata } from 'next'
import { FirstCheckExperience } from '@/components/check/FirstCheckExperience'
import { CHECK_FOCUSES } from '@/lib/business/first-check'
export const metadata:Metadata={title:'Your next business move',description:'Start with a few short questions. Get an initial investigation direction before creating an account.'}
export default async function StartPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const query=await searchParams
  const focus=CHECK_FOCUSES.find(item=>item.id===query.focus)?.id
  return <FirstCheckExperience initialFocus={focus}/>
}
