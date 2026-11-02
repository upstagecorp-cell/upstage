import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { LocaleProvider } from '@/lib/i18n/locale-provider'

export const metadata: Metadata = {
  title: { default: 'NEXORA — Business Assessment and Marketing Assets', template: '%s | NEXORA' },
  description: 'Understand your business challenges, choose your next action, and create marketing assets based on the evidence you provide.',
  openGraph: {
    title: 'NEXORA — Understand your business. Act with a purpose.',
    description: 'Connect business assessment with recommended actions, marketing drafts, and measured results.',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f7f7f5] dark:bg-[#191919] text-[#37352f] dark:text-[#f1f1ef] antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <Navbar />
            <main className="pb-20 md:pb-0">
              {children}
            </main>
            <BottomNav />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
