'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTheme } from 'next-themes'
import { ArrowRight, ChevronDown, Menu, Moon, Pause, Play, Sun, X } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandMark'
import { useMounted } from '@/lib/use-mounted'
import { NAV_GROUPS } from '@/lib/marketing/catalog'

type MenuId = typeof NAV_GROUPS[number]['id']
export function Navbar() {
  const pathname=usePathname(),{resolvedTheme,setTheme}=useTheme(),mounted=useMounted()
  const [open,setOpen]=useState<MenuId|null>(null),[mobile,setMobile]=useState(false),[paused,setPaused]=useState(false)
  const shell=useRef<HTMLElement>(null),closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null),mobileButton=useRef<HTMLButtonElement>(null)
  const triggerRefs=useRef<Partial<Record<MenuId,HTMLButtonElement|null>>>({})
  const openedByHover=useRef(false)
  const home=pathname==='/',checking=pathname==='/start'
  function cancelClose(){if(closeTimer.current){clearTimeout(closeTimer.current);closeTimer.current=null}}
  function close(){cancelClose();setOpen(null)}
  function scheduleClose(){cancelClose();closeTimer.current=setTimeout(()=>setOpen(null),170)}
  function toggleMotion(){const next=!paused;setPaused(next);document.documentElement.dataset.motion=next?'paused':'running';try{localStorage.setItem('nexora-motion',next?'paused':'running')}catch{ /* Optional preference. */ }}
  useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const value=localStorage.getItem('nexora-motion')==='paused';setPaused(value);document.documentElement.dataset.motion=value?'paused':'running'}catch{ /* Optional preference. */ }});return()=>cancelAnimationFrame(frame)},[])
  useEffect(()=>{const frame=requestAnimationFrame(()=>{setOpen(null);setMobile(false)});return()=>{cancelAnimationFrame(frame);if(closeTimer.current)clearTimeout(closeTimer.current)}},[pathname])
  useEffect(()=>{
    function outside(event:PointerEvent){if(shell.current&&!shell.current.contains(event.target as Node))setOpen(null)}
    function escape(event:globalThis.KeyboardEvent){if(event.key==='Escape'){if(mobile){setMobile(false);mobileButton.current?.focus()}else if(open){setOpen(null);triggerRefs.current[open]?.focus()}}}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}
  },[open,mobile])
  useEffect(()=>{if(!mobile)return;const previous=document.body.style.overflow;const background=[...document.querySelectorAll<HTMLElement>('body > main,body > footer')].map(element=>({element,inert:element.inert}));document.body.style.overflow='hidden';for(const item of background)item.element.inert=true;return()=>{document.body.style.overflow=previous;for(const item of background)item.element.inert=item.inert}},[mobile])
  useEffect(()=>{const query=window.matchMedia('(min-width:981px)');const resize=()=>{setOpen(null);if(query.matches)setMobile(false)};query.addEventListener('change',resize);return()=>query.removeEventListener('change',resize)},[])
  function keyOpen(event:KeyboardEvent<HTMLButtonElement>,id:MenuId){if(event.key==='ArrowDown'){event.preventDefault();cancelClose();setOpen(id);requestAnimationFrame(()=>document.querySelector<HTMLElement>(`#nx-menu-${id} a`)?.focus())}}
  if(['/workspace','/goals','/metrics','/history'].includes(pathname))return null
  const selected=NAV_GROUPS.find(group=>group.id===open)
  return <header ref={shell} className={`nx-nav-shell ${checking?'nx-nav-checking':''} ${home?'nx-nav-home':''} ${open||mobile?'nx-nav-expanded':''}`} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))close()}}>
    <div className="nx-nav-inner"><Link href="/" aria-label="NEXORA home" className="nx-logo"><BrandMark/>nexora<span className="nx-brand-period">.</span></Link>
      {!checking&&<nav className="nx-primary-nav" aria-label="Main navigation" onPointerLeave={scheduleClose}>
        {NAV_GROUPS.map(group=><button type="button" key={group.id} ref={node=>{triggerRefs.current[group.id]=node}} aria-expanded={open===group.id} aria-controls={`nx-menu-${group.id}`} onPointerEnter={event=>{if(event.pointerType==='mouse'){cancelClose();openedByHover.current=true;setOpen(group.id)}}} onClick={event=>{cancelClose();if(open===group.id&&openedByHover.current&&event.detail>0){openedByHover.current=false;return}openedByHover.current=false;setOpen(open===group.id?null:group.id)}} onKeyDown={event=>keyOpen(event,group.id)}>{group.label}<ChevronDown size={12}/></button>)}
        <Link href="/guide" onPointerEnter={close}>How it works</Link><Link href="/pricing" onPointerEnter={close}>Pricing</Link>
      </nav>}
      <div className="nx-nav-actions">{home&&<button type="button" onClick={toggleMotion} className="nx-nav-icon nx-nav-motion" aria-label={paused?'Resume visual motion':'Pause visual motion'} aria-pressed={paused}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>}<button type="button" onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')} className="nx-nav-icon nx-nav-theme" aria-label="Switch color theme">{mounted&&resolvedTheme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><Link href="/login" className="nx-nav-login">Sign in <ArrowRight size={13}/></Link>{!checking&&<Link href="/start" className="nx-nav-cta">Get started <ArrowRight size={14}/></Link>}{!checking&&<button type="button" ref={mobileButton} className="nx-nav-mobile-trigger" aria-label={mobile?'Close navigation':'Open navigation'} aria-expanded={mobile} aria-controls="nx-mobile-navigation" onClick={()=>{close();setMobile(!mobile)}}>{mobile?<X size={21}/>:<Menu size={21}/>}</button>}</div>
    </div>
    {!checking&&selected&&<div id={`nx-menu-${selected.id}`} className="nx-mega-wrap" onPointerEnter={cancelClose} onPointerLeave={scheduleClose}><div className="nx-mega-panel"><div className="nx-mega-intro"><span className="nx-platform-eyebrow">{selected.eyebrow}</span><h2>{selected.title}</h2><p>{selected.description}</p><Link href={selected.featuredHref} className="nx-mega-feature" onClick={close}><span>{selected.featuredTitle}</span><ArrowRight size={17}/><small>{selected.featuredText}</small></Link></div><div className="nx-mega-columns">{selected.columns.map(column=><div key={column.label}><p className="nx-mega-label">{column.label}</p>{column.items.map(({label,text,href,icon:Icon})=><Link href={href} className="nx-mega-link" key={label} onClick={close}><span className="nx-mega-icon"><Icon size={20} strokeWidth={1.65}/></span><span><strong>{label}<ArrowRight size={13}/></strong><small>{text}</small></span></Link>)}</div>)}</div><div className="nx-mega-bottom"><span>Your business context. Your judgment. Your next move.</span><Link href="/start" onClick={close}>Start with a free business check <ArrowRight size={14}/></Link></div></div></div>}
    {!checking&&mobile&&<div id="nx-mobile-navigation" className="nx-mobile-navigation"><nav aria-label="Mobile main navigation">{NAV_GROUPS.map(group=><details key={group.id}><summary>{group.label}<ChevronDown size={16}/></summary><div className="nx-mobile-group">{group.columns.map(column=><div key={column.label}><p>{column.label}</p>{column.items.map(({label,text,href,icon:Icon})=><Link key={label} href={href} onClick={()=>setMobile(false)}><Icon size={19}/><span><strong>{label}</strong><small>{text}</small></span><ArrowRight size={13}/></Link>)}</div>)}<Link className="nx-mobile-all" href={group.featuredHref} onClick={()=>setMobile(false)}>{group.featuredTitle}<ArrowRight size={14}/></Link></div></details>)}<Link className="nx-mobile-direct" href="/guide" onClick={()=>setMobile(false)}>How it works <ArrowRight size={16}/></Link><Link className="nx-mobile-direct" href="/pricing" onClick={()=>setMobile(false)}>Plans & pricing <ArrowRight size={16}/></Link><Link className="nx-mobile-direct" href="/workspace" onClick={()=>setMobile(false)}>My workspace <ArrowRight size={16}/></Link></nav><div className="nx-mobile-nav-bottom"><Link href="/start" className="nx-platform-button" onClick={()=>setMobile(false)}>Start my business check <ArrowRight size={16}/></Link><button className="nx-nav-icon" onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')} aria-label="Switch mobile color theme">{mounted&&resolvedTheme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button></div></div>}
  </header>
}
