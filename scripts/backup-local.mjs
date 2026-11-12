import { backup, DatabaseSync } from 'node:sqlite'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const objectName = /^[0-9a-f-]{36}\.(png|jpg)$/i
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function privateDestination(path) {
  const destination = resolve(path), fromPublic = relative(resolve('public'), destination)
  if (!fromPublic || !fromPublic.startsWith('..' + sep) && fromPublic !== '..' && !isAbsolute(fromPublic)) throw new Error('Backups cannot be written beneath public/.')
  return destination
}
/** Online SQLite snapshot includes committed WAL data; the source is opened read-only. */
export async function createLocalBackup({ dbPath, mediaPath, destination }) {
  if (!dbPath || !destination || dbPath === ':memory:') throw new Error('Provide an existing database path and a new private destination.')
  const target = privateDestination(destination), sourceFile = resolve(dbPath)
  const sourceInfo = await lstat(sourceFile)
  if (!sourceInfo.isFile() || sourceInfo.isSymbolicLink()) throw new Error('The source must be a regular database file.')
  await mkdir(dirname(target), { recursive: true })
  await mkdir(target, { mode: 0o700 }) // refuses to overwrite any existing directory
  const source = new DatabaseSync(sourceFile, { readOnly: true })
  try { await backup(source, join(target, 'database.sqlite')) } finally { source.close() }
  const snapshot = new DatabaseSync(join(target, 'database.sqlite'), { readOnly: true })
  let files = []
  try {
    const integrity = snapshot.prepare('PRAGMA integrity_check').get()
    if (integrity.integrity_check !== 'ok') throw new Error('Snapshot integrity check failed.')
    const table = snapshot.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='records'").get()
    if (table) files = snapshot.prepare("SELECT payload FROM records WHERE kind='media_file'").all().map(row => JSON.parse(row.payload))
  } finally { snapshot.close() }
  const root = resolve(mediaPath || join(dirname(sourceFile), 'media'))
  await mkdir(join(target, 'media'), { mode: 0o700 })
  const copied = []
  for (const file of files) {
    if (!objectName.test(file.objectName) || file.objectName !== `${file.id}.${file.type === 'image/jpeg' ? 'jpg' : 'png'}`) throw new Error('Invalid private object name in snapshot.')
    const sourcePath = join(root, file.objectName), info = await lstat(sourcePath)
    if (!info.isFile() || info.isSymbolicLink() || info.size > 32 * 1024 * 1024) throw new Error('Invalid private file in snapshot.')
    const bytes = await readFile(sourcePath)
    if (hash(bytes) !== file.sha256 || bytes.length !== file.bytes) throw new Error('Private file checksum does not match its database record.')
    await copyFile(sourcePath, join(target, 'media', file.objectName), constants.COPYFILE_EXCL)
    copied.push({ objectName: file.objectName, bytes: bytes.length, sha256: file.sha256 })
  }
  const dbBytes = await readFile(join(target, 'database.sqlite'))
  const manifest = { version: 1, createdAt: new Date().toISOString(), database: { name: 'database.sqlite', sha256: hash(dbBytes), bytes: dbBytes.length }, files: copied }
  await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 })
  return { destination: target, files: copied.length, databaseIntegrity: 'ok' }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const value = key => { const index = process.argv.indexOf(key); return index >= 0 ? process.argv[index + 1] : undefined }
  try { console.log(JSON.stringify(await createLocalBackup({ dbPath: value('--database'), mediaPath: value('--media'), destination: value('--destination') }))) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
