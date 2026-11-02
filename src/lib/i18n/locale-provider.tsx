'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useMounted } from '@/lib/use-mounted'
import { DEFAULT_LOCALE, translate, type Locale } from './locale'

type LocaleContextValue = {
  locale: Locale
  ready: boolean
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const ready = useMounted()
  useEffect(() => {
    document.documentElement.lang = DEFAULT_LOCALE
  }, [])

  return <LocaleContext.Provider value={{ locale: DEFAULT_LOCALE, ready, t: (key) => translate(DEFAULT_LOCALE, key) }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('LocaleProvider is required for this screen.')
  return context
}
