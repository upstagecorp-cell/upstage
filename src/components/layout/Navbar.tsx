'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useMounted } from '@/lib/use-mounted'

const navItems = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/action', label: '실행' },
  { href: '/history', label: '히스토리' },
  { href: '/explore', label: '탐색' },
  { href: '/guide', label: '이용 가이드' },
  { href: '/pricing', label: '가격' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9e9e7] dark:border-[#313131] bg-[#f7f7f5]/90 dark:bg-[#191919]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {mounted && theme === 'dark' ? (
            <Image src="/logo-red-bg.png" alt="UpStage" width={120} height={36} className="h-9 w-auto object-contain" />
          ) : (
            <Image src="/logo.jpg" alt="UpStage" width={120} height={36} className="h-9 w-auto object-contain" />
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-violet-50 dark:bg-violet-400/10 text-violet-700 dark:text-violet-200 border border-violet-100 dark:border-violet-400/15'
                  : 'text-[#6b6a67] dark:text-[#b9b8b4] hover:text-[#37352f] dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#252525]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md text-[#6b6a67] hover:text-[#37352f] dark:text-[#b9b8b4] dark:hover:text-white hover:bg-white dark:hover:bg-[#252525] transition-colors"
          aria-label="테마 변경"
        >
          {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
