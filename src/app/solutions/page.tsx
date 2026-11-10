import type { Metadata } from 'next'
import { SolutionsExperience } from '@/components/marketing/SolutionsExperience'
import { BUSINESS_PATHS } from '@/lib/marketing/catalog'
export const metadata:Metadata={title:'Solutions for independent businesses',description:'Explore business context and next actions for service businesses, online shops, and creators.'}
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;const business=BUSINESS_PATHS.find(item=>item.id===params.business)?.id??'services';return <SolutionsExperience key={business} initialBusiness={business}/>}
