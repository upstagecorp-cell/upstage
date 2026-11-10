'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, CalendarDays, ChartNoAxesCombined } from 'lucide-react'

const navItems = [
  { href: '/workspace', label: 'Workspace', icon: LayoutDashboard },
  { href: '/goals', label: 'Weekly plan', icon: CalendarDays },
  { href: '/metrics', label: 'Performance', icon: ChartNoAxesCombined },
  { href: '/explore', label: 'Guides', icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()
  if (!['/workspace','/goals','/metrics','/history'].includes(pathname)) return null
  return (
    <nav aria-label="Mobile navigation" style={{paddingBottom:'env(safe-area-inset-bottom)'}} className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:hidden">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold ${pathname === href ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#6b6a67] dark:text-[#b9b8b4]'}`}><Icon className="h-5 w-5" aria-hidden="true" /><span>{label}</span></Link>)}
      </div>
    </nav>
  )
}
