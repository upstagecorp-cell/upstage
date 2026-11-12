import type { Metadata } from 'next'
import './globals.css'
import './experience.css'
import './platform.css'
import './creative-offer.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { MarketingFooter } from '@/components/layout/MarketingFooter'
import { LocaleProvider } from '@/lib/i18n/locale-provider'

export const metadata: Metadata = {
  title: { default: 'NEXORA — Your connected business workspace', template: '%s | NEXORA' },
  description: 'Understand your business. Find a clear next action. Connect business context, reviewed marketing drafts, and measured outcomes in one workspace.',
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
    <html lang="en-US" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <Navbar />
            <main>
              {children}
            </main>
            <MarketingFooter />
            <BottomNav />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
