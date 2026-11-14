'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Compass, X } from 'lucide-react'

export function LandingHelp() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function close(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside) }
  }, [open])

  return <div className="nx-landing-help" ref={root}>
    {open && <div id="nx-start-help" className="nx-help-panel" aria-label="Find a starting point"><button type="button" autoFocus className="nx-help-close" aria-label="Close getting started help" onClick={() => { setOpen(false); trigger.current?.focus() }}><X size={16} /></button><span className="nx-help-icon"><Compass size={21} /></span><h2>Not sure where to begin?</h2><p>One question is enough. Get a first direction before creating an account.</p><Link href="/start">Start my free check <ArrowRight size={14} /></Link><Link href="/demo">Try a fictional example <ArrowRight size={14} /></Link><small>This is a getting-started guide, not a live chat.</small></div>}
    <button ref={trigger} type="button" className="nx-help-trigger" aria-expanded={open} aria-controls="nx-start-help" onClick={() => setOpen(value => !value)}><Compass size={17} /> Find my next move {open ? <X size={14} /> : <ArrowRight size={14} />}</button>
  </div>
}
