import sharp from 'sharp'
import { createHash, randomUUID } from 'node:crypto'
import { access, constants, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
// Resolve private user-data paths at runtime; these directories are not build assets.
const { dirname, isAbsolute, join, relative, resolve, sep } = process.getBuiltinModule('node:path') as typeof import('node:path')
import { database, getRecord, listRecords, saveRecord, transaction } from './database'
import { HttpError } from './errors'

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export interface MediaFile {
  id: string; role: 'photo' | 'logo' | 'export'; name: string; objectName: string
  type: 'image/png' | 'image/jpeg'; bytes: number; width: number; height: number
  sha256: string; createdAt: string; jobId?: string
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function mediaRoot() {
  const configured = process.env.NEXORA_MEDIA_PATH?.trim()
  const db = process.env.NEXORA_DB_PATH
  const path = configured || join(db && db !== ':memory:' ? dirname(resolve(db)) : resolve('.data'), 'media')
  if (configured && !isAbsolute(configured)) throw new HttpError(503, 'MEDIA_STORAGE_CONFIGURATION', 'File storage is not configured correctly.')
  const root = resolve(path), publicRoot = resolve('public'), insidePublic = relative(publicRoot, root)
  if (!insidePublic || !insidePublic.startsWith('..' + sep) && insidePublic !== '..' && !isAbsolute(insidePublic)) throw new HttpError(503, 'MEDIA_STORAGE_CONFIGURATION', 'Files must be stored privately.')
  return root
}
export async function storageReady() {
  try { await access(mediaRoot(), constants.R_OK | constants.W_OK); return true } catch { return false }
}
export function listMediaFiles(owner: string) { return listRecords<MediaFile>(owner, 'media_file') }
export function mediaFile(owner: string, id: string) {
  if (!uuid.test(id)) throw new HttpError(404, 'FILE_NOT_FOUND', 'This file was not found in your account.')
  const file = getRecord<MediaFile>(owner, 'media_file', id)
  if (!file || file.objectName !== `${id}.${file.type === 'image/jpeg' ? 'jpg' : 'png'}`) throw new HttpError(404, 'FILE_NOT_FOUND', 'This file was not found in your account.')
  return file
}
export async function readMediaFile(owner: string, id: string) {
  const file = mediaFile(owner, id)
  try {
    const bytes = await readFile(join(mediaRoot(), file.objectName))
    if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error()
    return { file, bytes }
  } catch { throw new HttpError(503, 'FILE_UNAVAILABLE', 'The saved file could not be read. Please contact support.') }
}
export async function saveMediaFile(owner: string, bytes: Buffer, details: Omit<MediaFile, 'id' | 'objectName' | 'bytes' | 'sha256' | 'createdAt'>) {
  const id = randomUUID(), objectName = `${id}.${details.type === 'image/jpeg' ? 'jpg' : 'png'}`
  const file: MediaFile = { ...details, id, objectName, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), createdAt: new Date().toISOString() }
  const root = mediaRoot(); await mkdir(root, { recursive: true, mode: 0o700 })
  // Objects are immutable; neither a request filename nor a URL becomes a disk path.
  await writeFile(join(root, objectName), bytes, { flag: 'wx', mode: 0o600 })
  try { transaction(() => saveRecord(owner, 'media_file', id, file)) }
  catch (error) { await unlink(join(root, objectName)).catch(() => {}); throw error }
  return file
}
export async function uploadImage(owner: string, input: Buffer, name: string, role: 'photo' | 'logo') {
  if (!input.length || input.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'UPLOAD_TOO_LARGE', 'Upload a photo or logo up to 8 MB.')
  const png = input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpeg = input[0] === 255 && input[1] === 216 && input[2] === 255
  const webp = input.subarray(0, 4).toString() === 'RIFF' && input.subarray(8, 12).toString() === 'WEBP'
  if (!png && !jpeg && !webp) throw new HttpError(415, 'IMAGE_TYPE_REQUIRED', 'Use a PNG, JPEG, or WebP image. SVG and animated images are not accepted.')
  let result: { data: Buffer; info: { width: number; height: number } }
  try {
    const image = sharp(input, { limitInputPixels: 16_000_000, failOn: 'warning' })
    const meta = await image.metadata()
    if ((meta.pages ?? 1) !== 1 || !meta.width || !meta.height || meta.width > 6000 || meta.height > 6000) throw new Error()
    result = await image.rotate().png().toBuffer({ resolveWithObject: true })
    if (result.data.length > 20 * 1024 * 1024) throw new Error()
  } catch { throw new HttpError(400, 'INVALID_IMAGE', 'This image could not be decoded safely. Use a still image up to 16 megapixels and 6000 pixels per side.') }
  const label = name.replace(/[\x00-\x1f\x7f/\\]/g, '').slice(0, 100) || 'Product image'
  return saveMediaFile(owner, result.data, { role, name: label, type: 'image/png', width: result.info.width, height: result.info.height })
}
export function countStoredBytes() {
  const rows = database().prepare("SELECT payload FROM records WHERE kind='media_file'").all() as { payload: string }[]
  return rows.reduce((sum, row) => sum + (JSON.parse(row.payload) as MediaFile).bytes, 0)
}
