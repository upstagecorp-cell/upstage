import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'UpStage - BRING YOUR BRAND TO THE STAGE',
  description: '업종별 맞춤 진단으로 창업 준비도를 측정하고, 오늘 당장 실행할 수 있는 액션을 제안합니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f7f7f5] dark:bg-[#191919] text-[#37352f] dark:text-[#f1f1ef] antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
