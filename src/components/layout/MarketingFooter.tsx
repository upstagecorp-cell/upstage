'use client'
import { usePathname } from 'next/navigation'
import { PlatformFooter } from '@/components/marketing/PlatformExperience'
const routes=new Set(['/','/product','/solutions','/resources','/guide','/pricing','/explore','/demo','/terms','/privacy'])
export function MarketingFooter(){const pathname=usePathname();return routes.has(pathname)?<PlatformFooter/>:null}
