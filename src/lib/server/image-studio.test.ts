import sharp from 'sharp'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticate, sessionCookie } from './auth'
import { closeDatabases, database, getRecord, saveRecord } from './database'
import { listMediaFiles, mediaRoot, readMediaFile, uploadImage } from './media-files'
import { withUploadSlot } from './media-http'
import { approveImageVersion, enqueueImageExport, imageJobs, imageUsage, processImageJob, saveImageProject } from './image-studio'
import { POST as uploadRoute } from '@/app/api/media/files/route'
import { GET as downloadRoute } from '@/app/api/media/files/[id]/route'
import { GET as readinessRoute } from '@/app/api/internal/readiness/route'
import { POST as workerRoute } from '@/app/api/internal/image-worker/route'
import { createLocalBackup } from '../../../scripts/backup-local.mjs'
import { restoreBackupCopy, verifyBackup } from '../../../scripts/verify-backup.mjs'

const origin = 'http://localhost:3000', token = 'fixture-local-image-worker-token-000000000000'
let root: string, png: Buffer
beforeEach(async () => {
  closeDatabases(); root = await mkdtemp(join(tmpdir(), 'nexora-image-test-'))
  vi.stubEnv('NEXORA_DB_PATH', join(root, 'app.sqlite')); vi.stubEnv('NEXORA_MEDIA_PATH', join(root, 'media')); vi.stubEnv('NEXORA_WORKER_TOKEN', token); vi.stubEnv('APP_ORIGIN', origin)
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Local image operations must not call an external provider') }))
  png = await sharp({ create: { width: 240, height: 180, channels: 4, background: '#bcd9cf' } }).png().toBuffer()
})
afterEach(() => { closeDatabases(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
async function account(email = 'photo@example.com', paid = false) {
  const user = await authenticate({ email, password: 'fixture-password-12345' }, true)
  if (paid) {
    const periodStart = new Date(Date.now() - 60000).toISOString(), periodEnd = new Date(Date.now() + 30 * 86400000).toISOString()
    saveRecord(user.id, 'billing', 'current', { id: 'sub_fixture', plan: 'focus', status: 'active', paid: true, periodStart, periodEnd, cancelAtPeriodEnd: false, creative: { plan: 'focus', status: 'active', paid: true, monthlyScenes: 0, monthlyUsd: 79, periodStart, periodEnd, cancelAtPeriodEnd: false, canChange: false, canCancel: true, pending: null, oneTimeScenes: 0 } })
  }
  return { user, cookie: sessionCookie(new Request(origin), user.id).split(';')[0] }
}
async function design(owner: string) {
  const photo = await uploadImage(owner, png, 'Product.png', 'photo')
  const input = { name: 'Fixture ad', photoId: photo.id, headline: 'Your next favorite product', description: 'Product facts supplied for this example.', price: '$29', cta: 'See the details', color: '#0a2540' }
  const project = saveImageProject(owner, input)
  approveImageVersion(owner, project.id, { version: 1, confirmProductFacts: true })
  return { project, photo, input }
}
function formRequest(cookie: string, from = origin, file = png) {
  const body = new FormData(); body.set('role', 'photo'); body.set('file', new File([new Uint8Array(file)], 'product.png', { type: 'application/octet-stream' }))
  return new Request(`${origin}/api/media/files`, { method: 'POST', headers: { Cookie: cookie, Origin: from }, body })
}

describe('private product files and exact-version image exports', () => {
  it('bounds concurrent upload decoding and releases capacity after completion', async () => {
    let release!: () => void
    const blocked = new Promise<void>(done => { release = done })
    const first = withUploadSlot(() => blocked), second = withUploadSlot(() => blocked)
    await expect(withUploadSlot(async () => 'excess')).rejects.toMatchObject({ code: 'IMAGE_PROCESSING_BUSY' })
    release(); await Promise.all([first, second])
    await expect(withUploadSlot(async () => 'available')).resolves.toBe('available')
  })
  it('decodes actual image bytes, strips EXIF, and keeps files out of public storage', async () => {
    const { user } = await account()
    const withExif = await sharp(png).withMetadata({ exif: { IFD0: { Artist: 'Fixture metadata' } } }).jpeg().toBuffer()
    const file = await uploadImage(user.id, withExif, '../product.jpg', 'photo')
    const saved = await readMediaFile(user.id, file.id), metadata = await sharp(saved.bytes).metadata()
    expect(metadata.format).toBe('png'); expect(metadata.exif).toBeUndefined(); expect(file.name).not.toContain('/')
    expect(mediaRoot()).not.toContain('public'); expect(file.bytes).toBe(saved.bytes.length)
  })
  it('rejects renamed SVG, corrupted files, oversized uploads, and public storage paths', async () => {
    const { user } = await account()
    await expect(uploadImage(user.id, Buffer.from('<svg><script/></svg>'), 'fake.png', 'photo')).rejects.toMatchObject({ code: 'IMAGE_TYPE_REQUIRED' })
    await expect(uploadImage(user.id, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'broken.png', 'photo')).rejects.toMatchObject({ code: 'INVALID_IMAGE' })
    await expect(uploadImage(user.id, Buffer.alloc(8 * 1024 * 1024 + 1), 'big.png', 'photo')).rejects.toMatchObject({ code: 'UPLOAD_TOO_LARGE' })
    vi.stubEnv('NEXORA_MEDIA_PATH', join(process.cwd(), 'public', 'uploads'))
    expect(() => mediaRoot()).toThrow('privately')
  })
  it('protects upload mutations, download ownership and opaque file paths', async () => {
    const owner = await account(), other = await account('other@example.com')
    expect((await uploadRoute(formRequest(owner.cookie, 'https://outside.example'))).status).toBe(403)
    expect((await uploadRoute(formRequest(''))).status).toBe(401)
    const response = await uploadRoute(formRequest(owner.cookie)); expect(response.status).toBe(201)
    const { file } = await response.json()
    const own = await downloadRoute(new Request(`${origin}/api/media/files/${file.id}?download=1`, { headers: { Cookie: owner.cookie } }), { params: Promise.resolve({ id: file.id }) })
    expect(own.status).toBe(200); expect(own.headers.get('cache-control')).toContain('no-store'); expect(own.headers.get('content-disposition')).toContain('attachment')
    const foreign = await downloadRoute(new Request(`${origin}/api/media/files/${file.id}`, { headers: { Cookie: other.cookie } }), { params: Promise.resolve({ id: file.id }) })
    expect(foreign.status).toBe(404)
    await expect(readMediaFile(owner.user.id, '../../secret')).rejects.toMatchObject({ code: 'FILE_NOT_FOUND' })
  })
  it('retains prior approval while a new revision requires its own review', async () => {
    const { user } = await account('paid@example.com', true), { project, input } = await design(user.id)
    const revised = saveImageProject(user.id, { ...input, headline: 'A revised headline', expectedVersion: 1 }, project.id)
    expect(revised.versions[0].approvedAt).toBeTruthy(); expect(revised.versions[1].approvedAt).toBeNull()
    expect(() => enqueueImageExport(user.id, project.id, { version: 2, ratio: '1:1', format: 'png', requestId: randomUUID() })).toThrow('Approve')
    expect(() => saveImageProject(user.id, { ...input, expectedVersion: 1 }, project.id)).toThrow('changed')
    const other = await account('other@example.com')
    expect(() => approveImageVersion(other.user.id, project.id, { version: 1, confirmProductFacts: true })).toThrow('not found')
  })
  it('creates real PNG/JPG in all promised ratios and bills one design once', async () => {
    const { user } = await account('paid@example.com', true), { project } = await design(user.id)
    for (const [ratio, height, format] of [['1:1', 1080, 'png'], ['4:5', 1350, 'jpg'], ['9:16', 1920, 'png']] as const) {
      const request = { version: 1, ratio, format, requestId: randomUUID() }
      const job = enqueueImageExport(user.id, project.id, request)
      expect(enqueueImageExport(user.id, project.id, request).id).toBe(job.id)
      expect(await processImageJob()).toMatchObject({ status: 'succeeded' })
      const ready = imageJobs(user.id).find(item => item.id === job.id)!
      const output = await readMediaFile(user.id, ready.outputFileId!)
      const metadata = await sharp(output.bytes).metadata()
      expect(metadata.width).toBe(1080); expect(metadata.height).toBe(height); expect(metadata.format).toBe(format === 'jpg' ? 'jpeg' : 'png')
    }
    expect(imageUsage(user.id)).toMatchObject({ limit: 40, used: 1, reserved: 0, remaining: 39 })
    expect(fetch).not.toHaveBeenCalled()
  })
  it('does not grant free or legacy text accounts the paid image allowance', async () => {
    const { user } = await account(), { project } = await design(user.id)
    expect(() => enqueueImageExport(user.id, project.id, { version: 1, ratio: '1:1', format: 'png', requestId: randomUUID() })).toThrow('active paid creative')
    expect(imageJobs(user.id)).toHaveLength(0)
  })
  it('enforces the unchanged 40-image cap before any work or filesystem output', async () => {
    const { user } = await account('paid@example.com', true), { project } = await design(user.id)
    const billing = getRecord<{ periodStart: string; periodEnd: string }>(user.id, 'billing', 'current')!
    for (let i = 0; i < 40; i++) saveRecord(user.id, 'image_allowance', `fixture-${i}`, { status: 'reserved', periodStart: billing.periodStart, periodEnd: billing.periodEnd })
    expect(() => enqueueImageExport(user.id, project.id, { version: 1, ratio: '1:1', format: 'png', requestId: randomUUID() })).toThrow('fully used or reserved')
    expect(imageJobs(user.id)).toHaveLength(0)
  })
  it('retains queued work and original files across closing and reopening the database', async () => {
    const { user } = await account('paid@example.com', true), { project, photo } = await design(user.id)
    const job = enqueueImageExport(user.id, project.id, { version: 1, ratio: '1:1', format: 'png', requestId: randomUUID() })
    closeDatabases()
    expect((await readMediaFile(user.id, photo.id)).file.sha256).toBe(photo.sha256)
    expect(imageJobs(user.id)[0].id).toBe(job.id); expect(await processImageJob()).toMatchObject({ status: 'succeeded' })
  })
  it('releases confirmed local failures and marks interrupted jobs without paid retries', async () => {
    const { user } = await account('paid@example.com', true), { project, photo } = await design(user.id)
    const job = enqueueImageExport(user.id, project.id, { version: 1, ratio: '1:1', format: 'png', requestId: randomUUID() })
    await writeFile(join(mediaRoot(), photo.objectName), 'corrupted QA fixture')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await processImageJob()).toMatchObject({ status: 'failed' }); expect(imageUsage(user.id).reserved).toBe(0)
    const retry = enqueueImageExport(user.id, project.id, { version: 1, ratio: '1:1', format: 'png', requestId: randomUUID() })
    database().prepare("UPDATE media_jobs SET status='running',lease_until=0 WHERE id=?").run(retry.id)
    await processImageJob(); expect(imageJobs(user.id).find(item => item.id === retry.id)).toMatchObject({ status: 'failed', errorCode: 'WORKER_INTERRUPTED' })
    expect(imageUsage(user.id)).toMatchObject({ used: 0, reserved: 0 }); expect(job.id).not.toBe(retry.id); expect(fetch).not.toHaveBeenCalled()
  })
  it('keeps worker access secret and exposes readiness only to the operator', async () => {
    await account()
    expect((await workerRoute(new Request(origin + '/api/internal/image-worker', { method: 'POST' }))).status).toBe(401)
    expect((await readinessRoute(new Request(origin + '/api/internal/readiness'))).status).toBe(401)
    const { user } = await account('second@example.com'); await uploadImage(user.id, png, 'photo.png', 'photo')
    const headers = { Authorization: `Bearer ${token}` }
    await workerRoute(new Request(origin + '/api/internal/image-worker', { method: 'POST', headers }))
    const readiness = await readinessRoute(new Request(origin + '/api/internal/readiness', { headers }))
    expect(readiness.status).toBe(200); expect(JSON.stringify(await readiness.json())).not.toContain(token)
  })
})

describe('online backup and isolated restore', () => {
  it('backs up committed WAL data and every referenced private file without overwriting originals', async () => {
    const { user } = await account('paid@example.com', true), { photo } = await design(user.id)
    const original = await readFile(join(mediaRoot(), photo.objectName)), destination = join(root, 'backup')
    await createLocalBackup({ dbPath: join(root, 'app.sqlite'), mediaPath: mediaRoot(), destination })
    expect((await verifyBackup(destination)).manifest.files).toHaveLength(1)
    await restoreBackupCopy(destination, join(root, 'restored'))
    const restored = new DatabaseSync(join(root, 'restored', 'nexora.sqlite'), { readOnly: true })
    expect(restored.prepare('SELECT id FROM users WHERE id=?').get(user.id)).toMatchObject({ id: user.id }); restored.close()
    expect(await readFile(join(root, 'restored', 'media', photo.objectName))).toEqual(original)
    expect(await readFile(join(mediaRoot(), photo.objectName))).toEqual(original)
    await expect(createLocalBackup({ dbPath: join(root, 'app.sqlite'), mediaPath: mediaRoot(), destination })).rejects.toThrow()
    await expect(restoreBackupCopy(destination, join(root, 'restored'))).rejects.toThrow()
    await expect(restoreBackupCopy(destination, join(process.cwd(), process.platform === 'win32' ? 'PUBLIC' : 'public', 'must-not-create'))).rejects.toThrow('public/')
  })
  it('detects modified backup content before any restore', async () => {
    const { user } = await account(), photo = await uploadImage(user.id, png, 'photo.png', 'photo'), destination = join(root, 'backup')
    await createLocalBackup({ dbPath: join(root, 'app.sqlite'), mediaPath: mediaRoot(), destination })
    await writeFile(join(destination, 'media', photo.objectName), 'modified backup fixture')
    await expect(verifyBackup(destination)).rejects.toThrow('checksum')
    await expect(restoreBackupCopy(destination, join(root, 'restore-must-not-start'))).rejects.toThrow('checksum')
    expect(listMediaFiles(user.id)).toHaveLength(1)
  })
})
