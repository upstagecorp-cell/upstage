'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Zap, Clock, Target, TrendingUp } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/action', label: '실행', icon: Zap },
  { href: '/goals', label: '목표', icon: Target },
  { href: '/metrics', label: '지표', icon: TrendingUp },
  { href: '/history', label: '히스토리', icon: Clock },
]

export function BottomNav() {
  const pathname = usePathname()

  const showNav = navItems.some(item => pathname.startsWith(item.href))
    || pathname.startsWith('/explore')
  if (!showNav) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
