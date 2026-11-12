'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { ImageProject, studioWorkspace } from '@/lib/server/image-studio'
import { ApiError, ErrorText, Field, friendlyError, requestJson } from './shared'

type Studio = ReturnType<typeof studioWorkspace>
const empty = { name: '', photoId: '', logoId: '', headline: '', description: '', price: '', cta: 'Learn more', color: '#0a2540' }
export function ImageStudio() {
  const [studio, setStudio] = useState<Studio | null>(null), [draft, setDraft] = useState(empty)
  const [selected, setSelected] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [reviewed, setReviewed] = useState(false), [ratio, setRatio] = useState('1:1'), [format, setFormat] = useState('png')
  const intent = useRef<{ signature: string; id: string } | null>(null)
  const load = useCallback(async () => {
    const result = await requestJson<{ studio: Studio }>('/api/media/workspace'); setStudio(result.studio)
    setDraft(value => ({ ...value, photoId: value.photoId || result.studio.files.find(file => file.role === 'photo')?.id || '' }))
  }, [])
  useEffect(() => {
    let active = true
    void requestJson<{ studio: Studio }>('/api/media/workspace').then(result => {
      if (!active) return
      setStudio(result.studio)
      setDraft(value => ({ ...value, photoId: value.photoId || result.studio.files.find(file => file.role === 'photo')?.id || '' }))
    }).catch(failure => { if (active) setError(friendlyError(failure)) })
    return () => { active = false }
  }, [])
  const pending = studio?.jobs.some(job => job.status === 'queued' || job.status === 'running')
  useEffect(() => { if (!pending) return; const timer = setInterval(() => void load().catch(() => {}), 2000); return () => clearInterval(timer) }, [pending, load])
  const project = studio?.projects.find(item => item.id === selected), version = project?.versions.at(-1)
  const dirty = Boolean(project && version && (draft.name !== project.name || Object.entries(draft).some(([key, value]) => key !== 'name' && value !== String(version[key as keyof typeof version] ?? ''))))
  const existingDesign = studio?.jobs.some(job => job.projectId === selected && job.status === 'succeeded')
  function choose(id: string) {
    setSelected(id); setReviewed(false); setNotice('')
    const saved = studio?.projects.find(item => item.id === id), revision = saved?.versions.at(-1)
    setDraft(saved && revision ? { name: saved.name, photoId: revision.photoId, logoId: revision.logoId || '', headline: revision.headline, description: revision.description, price: revision.price, cta: revision.cta, color: revision.color } : { ...empty, photoId: studio?.files.find(file => file.role === 'photo')?.id || '' })
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget, body = new FormData(form)
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/media/files', { method: 'POST', credentials: 'same-origin', body, signal: AbortSignal.timeout(60_000) })
      const result = await response.json()
      if (!response.ok) throw new ApiError(result.error || 'Upload failed.', response.status, result.code)
      await load(); setDraft(value => ({ ...value, [result.file.role === 'logo' ? 'logoId' : 'photoId']: result.file.id })); setReviewed(false)
      form.reset(); setNotice('Your image was saved privately. Uploading is not an AI generation or a published ad.')
    } catch (failure) { setError(friendlyError(failure)) } finally { setBusy(false) }
  }
  async function action(kind: 'save' | 'approve' | 'export') {
    setBusy(true); setError(''); setNotice('')
    try {
      if (kind === 'save') {
        const result = await requestJson<{ project: ImageProject }>(selected ? `/api/media/projects/${selected}` : '/api/media/projects', { method: selected ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, expectedVersion: version?.version }) })
        setSelected(result.project.id); setReviewed(false); setNotice('Design saved. Review and approve this version before exporting.')
      } else if (kind === 'approve') {
        await requestJson(`/api/media/projects/${selected}/approve`, { method: 'POST', body: JSON.stringify({ version: version!.version, confirmProductFacts: reviewed }) })
        setNotice(`Version ${version!.version} approved. A later edit will need its own approval.`)
      } else {
        const signature = `${selected}:${version!.version}:${ratio}:${format}`
        if (intent.current?.signature !== signature) intent.current = { signature, id: crypto.randomUUID() }
        await requestJson(`/api/media/projects/${selected}/export`, { method: 'POST', body: JSON.stringify({ version: version!.version, ratio, format, requestId: intent.current!.id }) })
        setNotice('Export queued. Its status and download will appear below. Different sizes of this design do not use another image allowance.')
      }
      await load()
    } catch (failure) { setError(friendlyError(failure)) } finally { setBusy(false) }
  }
  return <div>
    <p className="nx-eyebrow">YOUR PRODUCT FILES</p><h1 className="nx-heading mt-5 !text-4xl">Images & files.</h1>
    <p className="nx-copy mt-4 !text-sm">Prepare your product photos and logo, then arrange an ad image. This tool uses your uploaded photos; it does not call an AI image provider or create videos.</p>
    <div className="mt-5"><ErrorText error={error}/>{notice && <p role="status" className="nx-panel mt-3 text-sm leading-7">{notice}</p>}</div>
    <form className="nx-panel mt-6 space-y-4" onSubmit={event => void upload(event)}>
      <h2 className="text-xl font-semibold">1. Bring your product image</h2>
      <p className="text-xs leading-6 text-[var(--muted)]">PNG, JPEG, or WebP · up to 8 MB and 16 megapixels. Files are stored privately in your account, outside the public website. This upload is not sent to an AI provider.</p>
      <Field label="File type"><select className="nx-field" name="role"><option value="photo">Product photo</option><option value="logo">Brand logo</option></select></Field>
      <Field label="Photo or logo"><input className="nx-field max-w-full" type="file" name="file" accept="image/png,image/jpeg,image/webp" required/></Field>
      <button className="nx-button" disabled={busy}>Upload privately</button>
    </form>
    {studio && <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{studio.files.filter(file => file.role !== 'export').slice(-12).map(file => <div key={file.id} className="nx-panel !p-3"><Image src={`/api/media/files/${file.id}`} alt={file.name} width={150} height={100} unoptimized className="h-24 w-full rounded object-contain"/><p className="mt-2 break-words text-xs">{file.name} · {file.role}</p></div>)}</div>
      <section className="nx-panel mt-6 space-y-4"><h2 className="text-xl font-semibold">2. Save a design</h2>
        <Field label="Saved design"><select className="nx-field" value={selected} onChange={event => choose(event.target.value)}><option value="">New design</option>{studio.projects.map(item => <option key={item.id} value={item.id}>{item.name} · v{item.versions.at(-1)!.version}</option>)}</select></Field>
        <Field label="Product photo"><select className="nx-field" value={draft.photoId} onChange={event => { setDraft({ ...draft, photoId: event.target.value }); setReviewed(false) }}><option value="">Choose a photo</option>{studio.files.filter(file => file.role === 'photo').map(file => <option key={file.id} value={file.id}>{file.name}</option>)}</select></Field>
        <Field label="Logo"><select className="nx-field" value={draft.logoId} onChange={event => { setDraft({ ...draft, logoId: event.target.value }); setReviewed(false) }}><option value="">No logo</option>{studio.files.filter(file => file.role === 'logo').map(file => <option key={file.id} value={file.id}>{file.name}</option>)}</select></Field>
        {([['name', 'Design name', 80], ['headline', 'Headline', 80], ['description', 'Supporting text', 100], ['price', 'Price label, if needed', 32], ['cta', 'Call to action', 30], ['color', 'Brand color · #RRGGBB', 7]] as const).map(([key, label, max]) => <Field key={key} label={label}><input className="nx-field" value={draft[key]} maxLength={max} onChange={event => { setDraft({ ...draft, [key]: event.target.value }); setReviewed(false) }}/></Field>)}
        <button className="nx-button" type="button" disabled={busy || !draft.photoId || !draft.name || !draft.headline || !draft.cta} onClick={() => void action('save')}>{selected ? 'Save a new version' : 'Save design'}</button>
      </section>
      {version && <section className="nx-panel mt-6 space-y-4"><h2 className="text-xl font-semibold">3. Review version {version.version}</h2><p className="text-sm leading-7">{dirty ? 'Save your edits before approving or exporting. Downloads always use a specific saved version.' : version.approvedAt ? 'This exact saved version is approved.' : 'Check your photo, headline, product claims, price, logo rights, and call to action.'}</p>
        <label className="flex items-start gap-3 text-sm leading-7"><input className="mt-2" type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)}/>I checked the saved product facts, wording, price, and rights.</label>
        <button className="nx-button nx-button-secondary" disabled={busy || dirty || !reviewed || Boolean(version.approvedAt)} onClick={() => void action('approve')}>Approve version {version.version}</button>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Image ratio"><select className="nx-field" value={ratio} onChange={event => setRatio(event.target.value)}><option>1:1</option><option>4:5</option><option>9:16</option></select></Field><Field label="File format"><select className="nx-field" value={format} onChange={event => setFormat(event.target.value)}><option value="png">PNG</option><option value="jpg">JPG</option></select></Field></div>
        <p className="text-xs leading-6 text-[var(--muted)]">This period: {studio.usage.used} designs used · {studio.usage.reserved} reserved · {studio.usage.remaining} remaining. Resizing and manual edits to a previously generated design use no additional image allowance.</p>
        {!studio.exportAvailable && <p className="text-sm leading-7">Image export is currently unavailable. Your saved design and files remain available.</p>}
        <button className="nx-button" disabled={busy || dirty || !version.approvedAt || !studio.exportAvailable || studio.usage.remaining === 0 && !existingDesign} onClick={() => void action('export')}>Export approved {format.toUpperCase()}</button>
      </section>}
      <section className="nx-panel mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Your exports</h2><button className="nx-button nx-button-secondary" disabled={busy} onClick={() => void load().catch(failure => setError(friendlyError(failure)))}>Refresh files</button></div>
        {!studio.jobs.length && <p className="mt-4 text-sm">No image exports yet. New designs require an active paid creative plan; new creative subscriptions are still closed.</p>}
        {studio.jobs.map(job => <article key={job.id} className="mt-4 border-t border-[var(--border)] pt-4"><p className="text-sm">Version {job.version} · {job.ratio} · {job.format.toUpperCase()} · {job.status}</p>{job.outputFileId && <a className="mt-2 inline-block text-sm underline" href={`/api/media/files/${job.outputFileId}?download=1`}>Download this approved version</a>}{job.status === 'failed' && <p className="mt-2 text-xs leading-6">The export could not complete. Saved inputs remain available; confirmed failed reservations are released. Refresh before retrying.</p>}</article>)}
      </section>
    </>}
  </div>
}
