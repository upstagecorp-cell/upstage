'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Compass, Zap, Clock } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: BarChart2 },
  { href: '/explore', label: '탐색', icon: Compass },
  { href: '/action', label: '실행', icon: Zap },
  { href: '/history', label: '히스토리', icon: Clock },
]

export function BottomNav() {
  const pathname = usePathname()

  const showNav = navItems.some(item => pathname.startsWith(item.href))
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
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
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
