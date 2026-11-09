import type { Metadata } from 'next'
import { FocusedDemo } from '@/components/workspace/FocusedDemo'

export const metadata: Metadata = {
  title: 'Try a fictional online-shop investigation | NEXORA',
  description:
    'Explore follow-up questions, an order contribution worksheet, and a small experiment using explicitly invented online-shop data. No account required.',
}

export default function FocusDemoPage() {
  return <FocusedDemo />
}
