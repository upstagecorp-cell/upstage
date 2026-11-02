import Link from 'next/link'
import { ArrowRight, ClipboardCheck, FileText, LineChart, SearchCheck } from 'lucide-react'

const steps = [
  { icon: SearchCheck, title: 'Understand the challenge', text: 'Describe your business and add the evidence you have. See observed facts, possible causes, and information you still need.' },
  { icon: ClipboardCheck, title: 'Choose the next action', text: 'Review recommendations tied to your goal. Gathering data or reviewing costs can come before creating an ad.' },
  { icon: FileText, title: 'Create and review', text: 'Turn a relevant recommendation into hooks, ad copy, short-form scripts, and calls to action. Edit and approve the version you want to use.' },
  { icon: LineChart, title: 'Record what happened', text: 'Log where you used the assets and the results you observed. Reassess with the new evidence while keeping earlier assessments.' },
]

export default function LandingPage() {
  return <div className="min-h-screen bg-[#f7f5ff] text-slate-950 dark:bg-[#12091f] dark:text-white">
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="hero-ribbon hero-ribbon-primary" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/65 dark:from-[#12091f] dark:via-[#12091f]/95 dark:to-[#12091f]/65" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Business assessment + purposeful execution</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">Understand your business challenges.<span className="mt-3 block bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-300 dark:to-fuchsia-300">Create the assets to act on them.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">Connect the evidence behind your business decisions with a clear next action, marketing drafts you can use, and results you can measure.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/workspace" className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/15 hover:bg-violet-800">Open your workspace <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/demo" className="rounded-full border border-violet-200 bg-white px-6 py-3.5 text-sm font-bold text-violet-800 dark:border-white/15 dark:bg-white/5 dark:text-violet-100">Explore a fictional example</Link></div>
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">For independent businesses and teams. Your business, your evidence, your approval.</p>
        </div>
        <div className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_24px_80px_rgba(76,29,149,0.12)] dark:border-white/10 dark:bg-[#20162d]">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">One connected workflow</p>
          <div className="mt-5 space-y-4">{['Business Profile', 'Business Assessment', 'Recommended Actions', 'Create Marketing Assets', 'Review and Approve', 'Results and Reassessment'].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">{index + 1}</span><span className="text-sm font-semibold">{label}</span></div>)}</div>
          <p className="mt-5 text-sm leading-6 text-slate-500 dark:text-slate-400">Start with the facts you have. Missing information stays visible.</p>
        </div>
      </div>
    </section>
    <section className="border-y border-violet-100 bg-white px-4 py-16 dark:border-white/10 dark:bg-[#171022]"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-extrabold tracking-tight">Move from a question to a practical next step.</h2><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{steps.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10"><Icon className="h-6 w-6 text-violet-600 dark:text-violet-300" aria-hidden="true" /><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div></div></section>
    <section className="mx-auto max-w-6xl px-4 py-16"><div className="grid gap-8 rounded-[28px] bg-violet-700 p-8 text-white md:grid-cols-2 md:p-12"><div><h2 className="text-3xl font-extrabold tracking-tight">Marketing drafts with a reason behind them.</h2><p className="mt-5 leading-8 text-violet-100">When content is the right next action, create hooks, ad copy, short-form video scripts, and calls to action based on your profile and assessment.</p></div><div className="space-y-4 text-sm leading-7 text-violet-100"><p>You review and approve the content before using it. Downloading a draft does not count as publishing it or achieving a sale.</p><p>Finished images, rendered videos, automatic publishing, and ad spending are not connected in this release. Content generation requires a configured AI provider.</p><Link href="/workspace" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-violet-800">Start with your business <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div></section>
    <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 pb-10 text-xs text-slate-500 dark:text-slate-400"><span>NEXORA · Understand. Act. Measure.</span><div className="flex gap-5"><Link href="/guide">How it works</Link><Link href="/pricing">Pricing and availability</Link></div></footer>
  </div>
}
