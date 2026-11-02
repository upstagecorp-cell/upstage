'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useMounted } from '@/lib/use-mounted'

const navItems = [
  { href: '/workspace', label: 'Workspace' },
  { href: '/goals', label: 'Weekly plan' },
  { href: '/explore', label: 'Guides' },
  { href: '/pricing', label: 'Pricing' },
]

export function Navbar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9e9e7] bg-[#f7f7f5]/95 backdrop-blur-md dark:border-[#313131] dark:bg-[#191919]/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="NEXORA home" className="text-xl font-black tracking-tight text-violet-700 dark:text-violet-300">NEXORA<span className="text-fuchsia-500">.</span></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${pathname === item.href ? 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200' : 'text-[#6b6a67] hover:bg-white dark:text-[#b9b8b4] dark:hover:bg-[#252525]'}`}>{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/workspace" className="rounded-full bg-violet-700 px-4 py-2 text-xs font-bold text-white hover:bg-violet-800 sm:text-sm">Open workspace</Link>
          <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="rounded-lg p-2 text-[#6b6a67] hover:bg-white dark:text-[#b9b8b4] dark:hover:bg-[#252525]" aria-label="Switch color theme">
            {mounted && resolvedTheme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  )
}
