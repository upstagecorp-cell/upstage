'use client'

import { useSyncExternalStore } from 'react'
import { getLocalDateKey } from '@/lib/date-time'

const SERVER_DATE_KEY = '1970-01-01'

function subscribe(onStoreChange: () => void) {
  const intervalId = window.setInterval(onStoreChange, 60_000)
  window.addEventListener('focus', onStoreChange)
  document.addEventListener('visibilitychange', onStoreChange)

  return () => {
    window.clearInterval(intervalId)
    window.removeEventListener('focus', onStoreChange)
    document.removeEventListener('visibilitychange', onStoreChange)
  }
}

function getSnapshot() {
  return getLocalDateKey()
}

function getServerSnapshot() {
  return SERVER_DATE_KEY
}

export function useLocalDateKey() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
