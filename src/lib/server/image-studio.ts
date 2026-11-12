import sharp from 'sharp'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { CREATIVE_PLANS } from '@/lib/marketing/creative-plans'
import { billingSummary } from './billing'
import { database, getRecord, listRecords, saveRecord, transaction } from './database'
import { HttpError, objectInput, textInput } from './errors'
import { listMediaFiles, mediaFile, readMediaFile, saveMediaFile } from './media-files'

type Ratio = '1:1' | '4:5' | '9:16'
type Output = 'png' | 'jpg'
interface ImageSpec { photoId: string; logoId: string | null; headline: string; description: string; price: string; cta: string; color: string }
export interface ImageVersion extends ImageSpec { version: number; createdAt: string; approvedAt: string | null }
export interface ImageProject { id: string; name: string; createdAt: string; profileId: string | null; versions: ImageVersion[] }
interface JobRow { id: string; owner_id: string; project_id: string; version: number; ratio: Ratio; format: Output; snapshot: string; request_key: string; status: 'queued' | 'running' | 'succeeded' | 'failed'; output_file: string | null; error_code: string | null; created_at: string; updated_at: string; lease_until: number | null }
interface Reservation { status: 'reserved' | 'succeeded' | 'failed'; periodStart: string; periodEnd: string }
const sizes: Record<Ratio, [number, number]> = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] }
const schemas = new WeakSet<object>()
function schema() {
  const db = database()
  if (!schemas.has(db)) {
    db.exec(`CREATE TABLE IF NOT EXISTS media_jobs (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), project_id TEXT NOT NULL,
      version INTEGER NOT NULL, ratio TEXT NOT NULL, format TEXT NOT NULL, snapshot TEXT NOT NULL,
      request_key TEXT NOT NULL, status TEXT NOT NULL, output_file TEXT, error_code TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, lease_until INTEGER,
      UNIQUE(owner_id,request_key));
      CREATE INDEX IF NOT EXISTS media_jobs_queue ON media_jobs(status,created_at);
      CREATE TABLE IF NOT EXISTS media_worker_state (id TEXT PRIMARY KEY,last_seen TEXT NOT NULL);
      INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(3,strftime('%Y-%m-%dT%H:%M:%fZ','now'));`)
    schemas.add(db)
  }
  return db
}
export function imageProject(owner: string, id: string) {
  const project = getRecord<ImageProject>(owner, 'image_project', id)
  if (!project) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'This design was not found in your account.')
  return project
}
function spec(owner: string, raw: Record<string, unknown>): ImageSpec {
  const photoId = textInput(raw.photoId, 'product photo', 100), logoId = raw.logoId ? textInput(raw.logoId, 'logo', 100) : null
  if (mediaFile(owner, photoId).role !== 'photo' || logoId && mediaFile(owner, logoId).role !== 'logo') throw new HttpError(400, 'INVALID_MATERIAL', 'Choose a product photo and an optional logo from your files.')
  const color = textInput(raw.color, 'brand color', 7)
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new HttpError(400, 'INVALID_COLOR', 'Use a six-digit hex color.')
  return { photoId, logoId, color, headline: textInput(raw.headline, 'headline', 80), description: textInput(raw.description ?? '', 'description', 100, false), price: textInput(raw.price ?? '', 'price label', 32, false), cta: textInput(raw.cta, 'call to action', 30) }
}
export function saveImageProject(owner: string, raw: unknown, id?: string) {
  const input = objectInput(raw), material = spec(owner, input), name = textInput(input.name, 'design name', 80)
  return transaction(() => {
    const old = id ? imageProject(owner, id) : null
    if (old && input.expectedVersion !== old.versions.at(-1)!.version) throw new HttpError(409, 'VERSION_CONFLICT', 'This design changed. Refresh before editing it.')
    if (old && old.versions.length >= 100) throw new HttpError(422, 'VERSION_LIMIT', 'This design has reached its version limit. Save a new design.')
    const createdAt = new Date().toISOString(), profile = getRecord<{ id: string }>(owner, 'profile', 'current')
    const version: ImageVersion = { ...material, version: (old?.versions.at(-1)?.version ?? 0) + 1, createdAt, approvedAt: null }
    const project: ImageProject = { id: old?.id ?? randomUUID(), name, createdAt: old?.createdAt ?? createdAt, profileId: old?.profileId ?? profile?.id ?? null, versions: [...(old?.versions ?? []), version] }
    saveRecord(owner, 'image_project', project.id, project)
    return project
  })
}
export function approveImageVersion(owner: string, id: string, raw: unknown) {
  const input = objectInput(raw)
  return transaction(() => {
    const project = imageProject(owner, id), version = project.versions.find(item => item.version === input.version)
    if (!version) throw new HttpError(400, 'INVALID_VERSION', 'Choose an existing design version.')
    if (input.confirmProductFacts !== true) throw new HttpError(400, 'REVIEW_REQUIRED', 'Confirm the product, wording, price, and rights before approving.')
    version.approvedAt ??= new Date().toISOString()
    saveRecord(owner, 'image_project', id, project)
    return project
  })
}
export function imageUsage(owner: string) {
  const billing = billingSummary(owner), creative = billing.creative
  const limit = billing.plan !== 'free' && creative ? CREATIVE_PLANS.find(plan => plan.id === creative.plan)!.images : 0
  const rows = listRecords<Reservation>(owner, 'image_allowance').filter(item => creative && item.periodStart === creative.periodStart)
  const used = rows.filter(row => row.status === 'succeeded').length, reserved = rows.filter(row => row.status === 'reserved').length
  return { limit, used, reserved, remaining: Math.max(0, limit - used - reserved), periodEnd: creative?.periodEnd ?? null }
}
function reserve(owner: string, projectId: string) {
  const existing = getRecord<Reservation>(owner, 'image_allowance', projectId)
  if (existing && existing.status !== 'failed') return
  const billing = billingSummary(owner), creative = billing.creative
  if (billing.plan === 'free' || !creative) throw new HttpError(402, 'CREATIVE_SUBSCRIPTION_REQUIRED', 'New image designs require an active paid creative plan. Your uploaded files stay available.')
  if (imageUsage(owner).remaining < 1) throw new HttpError(402, 'IMAGE_ALLOWANCE_EXHAUSTED', 'This period’s image design allowance is fully used or reserved. Existing designs remain available.')
  saveRecord(owner, 'image_allowance', projectId, { status: 'reserved', periodStart: creative.periodStart, periodEnd: creative.periodEnd } satisfies Reservation)
}
function publicJob(row: JobRow) {
  return { id: row.id, projectId: row.project_id, version: row.version, ratio: row.ratio, format: row.format, status: row.status, outputFileId: row.output_file, errorCode: row.error_code, createdAt: row.created_at }
}
export function imageJobs(owner: string) { return (schema().prepare('SELECT * FROM media_jobs WHERE owner_id=? ORDER BY created_at DESC LIMIT 100').all(owner) as unknown as JobRow[]).map(publicJob) }
export function workerAvailable() {
  const row = schema().prepare("SELECT last_seen FROM media_worker_state WHERE id='image-worker'").get() as { last_seen: string } | undefined
  return Boolean(process.env.NEXORA_WORKER_TOKEN && row && Date.now() - Date.parse(row.last_seen) < 60_000)
}
export function studioWorkspace(owner: string) { return { files: listMediaFiles(owner), projects: listRecords<ImageProject>(owner, 'image_project'), jobs: imageJobs(owner), usage: imageUsage(owner), exportAvailable: workerAvailable() } }
export function enqueueImageExport(owner: string, id: string, raw: unknown) {
  const input = objectInput(raw), project = imageProject(owner, id), version = project.versions.find(item => item.version === input.version)
  if (!version?.approvedAt) throw new HttpError(422, 'APPROVAL_REQUIRED', 'Approve the exact design version before exporting it.')
  if (typeof input.ratio !== 'string' || !Object.hasOwn(sizes, input.ratio) || !['png', 'jpg'].includes(String(input.format))) throw new HttpError(400, 'INVALID_EXPORT', 'Choose 1:1, 4:5, or 9:16 and PNG or JPG.')
  if (typeof input.requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.requestId)) throw new HttpError(400, 'INVALID_REQUEST_KEY', 'Refresh the page before exporting.')
  const ratio = input.ratio as Ratio, format = input.format as Output, db = schema()
  return transaction(() => {
    const old = db.prepare('SELECT * FROM media_jobs WHERE owner_id=? AND request_key=?').get(owner, input.requestId as string) as JobRow | undefined
    if (old) {
      if (old.project_id !== id || old.version !== version.version || old.ratio !== ratio || old.format !== format) throw new HttpError(409, 'REQUEST_KEY_REUSED', 'This request belongs to a different export.')
      return publicJob(old)
    }
    reserve(owner, id)
    const job = randomUUID(), now = new Date().toISOString()
    db.prepare("INSERT INTO media_jobs(id,owner_id,project_id,version,ratio,format,snapshot,request_key,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'queued',?,?)").run(job, owner, id, version.version, ratio, format, JSON.stringify(version), input.requestId as string, now, now)
    return publicJob(db.prepare('SELECT * FROM media_jobs WHERE id=?').get(job) as unknown as JobRow)
  })
}
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)
function lines(value: string, count: number) {
  const words = value.replace(/\s+/g, ' ').trim().split(' '), result: string[] = []; let line = ''
  for (let word of words) {
    while (word.length > count) { if (line) { result.push(line); line = '' }; result.push(word.slice(0, count)); word = word.slice(count) }
    if ((line + ' ' + word).trim().length > count) { result.push(line); line = word } else line = (line + ' ' + word).trim()
  }
  if (line) result.push(line)
  return result
}
async function compose(owner: string, version: ImageVersion, ratio: Ratio, format: Output) {
  const [width, height] = sizes[ratio], photoHeight = Math.floor(height * .56), photo = await readMediaFile(owner, version.photoId)
  const image = await sharp(photo.bytes, { limitInputPixels: 16_000_000 }).resize(width, photoHeight, { fit: 'cover' }).png().toBuffer()
  const heading = lines(version.headline, 28), description = lines(version.description, 45)
  let y = photoHeight + 48
  const text = (value: string, size: number, fill = '#0a2540') => `<text x="56" y="${y}" font-family="sans-serif" font-size="${size}" fill="${fill}">${escape(value)}</text>`
  const headingSize = Math.min(44, Math.floor((width - 112) / Math.max(...heading.map(line => line.length))))
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="0" y="${photoHeight}" width="${width}" height="${height - photoHeight}" fill="white"/>`
  for (const line of heading) { svg += text(line, headingSize); y += 46 }
  y += 8
  for (const line of description) { svg += text(line, 20, '#425466'); y += 28 }
  if (version.price) { y += 10; svg += text(version.price, Math.min(30, Math.floor((width - 112) / version.price.length))); y += 38 }
  const ctaY = height - 92, color = version.color
  svg += `<rect x="56" y="${ctaY}" width="${width - 112}" height="58" rx="8" fill="${color}"/>`
  const brightness = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16)).reduce((sum, value, index) => sum + value * [.299, .587, .114][index], 0)
  svg += `<text x="${width / 2}" y="${ctaY + 38}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(30, Math.floor((width - 160) / version.cta.length))}" fill="${brightness > 150 ? '#0a2540' : '#ffffff'}">${escape(version.cta)}</text></svg>`
  const layers = [{ input: image, left: 0, top: 0 }, { input: Buffer.from(svg), left: 0, top: 0 }]
  if (version.logoId) { const logo = await readMediaFile(owner, version.logoId); const bytes = await sharp(logo.bytes).resize(180, 80, { fit: 'inside' }).png().toBuffer(); layers.push({ input: bytes, left: width - 212, top: 32 }) }
  let rendered = sharp({ create: { width, height, channels: 4, background: '#f6f9fc' } }).composite(layers).timeout({ seconds: 30 })
  rendered = format === 'jpg' ? rendered.flatten({ background: 'white' }).jpeg({ quality: 92 }) : rendered.png()
  return { bytes: await rendered.toBuffer(), width, height }
}
function releaseFailedReservation(row: JobRow) {
  const reservation = getRecord<Reservation>(row.owner_id, 'image_allowance', row.project_id)
  const pending = schema().prepare("SELECT 1 FROM media_jobs WHERE owner_id=? AND project_id=? AND status IN ('queued','running') LIMIT 1").get(row.owner_id, row.project_id)
  if (reservation?.status === 'reserved' && !pending) saveRecord(row.owner_id, 'image_allowance', row.project_id, { ...reservation, status: 'failed' })
}
export async function processImageJob() {
  const db = schema(), now = new Date().toISOString()
  const row = transaction(() => {
    db.prepare("INSERT INTO media_worker_state(id,last_seen) VALUES('image-worker',?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen").run(now)
    const stale = db.prepare("SELECT * FROM media_jobs WHERE status='running' AND lease_until<?").all(Date.now()) as unknown as JobRow[]
    for (const job of stale) {
      const saved = listMediaFiles(job.owner_id).find(file => file.jobId === job.id)
      db.prepare('UPDATE media_jobs SET status=?,output_file=?,error_code=?,lease_until=NULL,updated_at=? WHERE id=?').run(saved ? 'succeeded' : 'failed', saved?.id ?? null, saved ? null : 'WORKER_INTERRUPTED', now, job.id)
      if (saved) { const reservation = getRecord<Reservation>(job.owner_id, 'image_allowance', job.project_id)!; saveRecord(job.owner_id, 'image_allowance', job.project_id, { ...reservation, status: 'succeeded' }) }
      else releaseFailedReservation(job)
    }
    const job = db.prepare("SELECT * FROM media_jobs WHERE status='queued' ORDER BY created_at,rowid LIMIT 1").get() as JobRow | undefined
    if (job) db.prepare("UPDATE media_jobs SET status='running',lease_until=?,updated_at=? WHERE id=?").run(Date.now() + 180_000, now, job.id)
    return job
  })
  if (!row) return { processed: false }
  try {
    const version = JSON.parse(row.snapshot) as ImageVersion, image = await compose(row.owner_id, version, row.ratio, row.format)
    const file = await saveMediaFile(row.owner_id, image.bytes, { name: `Ad image v${row.version} ${row.ratio}`, role: 'export', type: row.format === 'jpg' ? 'image/jpeg' : 'image/png', width: image.width, height: image.height, jobId: row.id })
    transaction(() => {
      db.prepare("UPDATE media_jobs SET status='succeeded',output_file=?,lease_until=NULL,updated_at=? WHERE id=?").run(file.id, new Date().toISOString(), row.id)
      const reservation = getRecord<Reservation>(row.owner_id, 'image_allowance', row.project_id)!
      saveRecord(row.owner_id, 'image_allowance', row.project_id, { ...reservation, status: 'succeeded' })
    })
    return { processed: true, jobId: row.id, status: 'succeeded' }
  } catch {
    transaction(() => {
      db.prepare("UPDATE media_jobs SET status='failed',error_code='LOCAL_RENDER_FAILED',lease_until=NULL,updated_at=? WHERE id=?").run(new Date().toISOString(), row.id)
      releaseFailedReservation(row)
    })
    console.error(JSON.stringify({ event: 'image_export_failed', jobId: row.id, code: 'LOCAL_RENDER_FAILED' }))
    return { processed: true, jobId: row.id, status: 'failed' }
  }
}
export function requireWorker(request: Request) {
  const expected = process.env.NEXORA_WORKER_TOKEN || '', actual = request.headers.get('authorization') || ''
  if (expected.length < 32) throw new HttpError(503, 'WORKER_NOT_CONFIGURED', 'The image worker is not configured.')
  const a = Buffer.from(actual), b = Buffer.from(`Bearer ${expected}`)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, 'WORKER_AUTH_REQUIRED', 'Worker authentication is required.')
}
