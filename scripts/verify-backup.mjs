import { DatabaseSync } from 'node:sqlite'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export async function verifyBackup(directory) {
  const root = resolve(directory), manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'))
  if (manifest.version !== 1 || manifest.database?.name !== 'database.sqlite' || !Array.isArray(manifest.files)) throw new Error('Unsupported backup manifest.')
  const dbBytes = await readFile(join(root, 'database.sqlite'))
  if (dbBytes.length !== manifest.database.bytes || hash(dbBytes) !== manifest.database.sha256) throw new Error('Database checksum verification failed.')
  const db = new DatabaseSync(join(root, 'database.sqlite'), { readOnly: true })
  try { if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Database integrity verification failed.') } finally { db.close() }
  const seen = new Set()
  for (const file of manifest.files) {
    if (!/^[0-9a-f-]{36}\.(png|jpg)$/i.test(file.objectName) || seen.has(file.objectName)) throw new Error('Invalid or duplicate backup object name.')
    seen.add(file.objectName)
    const path = join(root, 'media', file.objectName), info = await lstat(path)
    if (!info.isFile() || info.isSymbolicLink() || info.size > 32 * 1024 * 1024) throw new Error('Invalid backup file.')
    const bytes = await readFile(path)
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error('Private file checksum verification failed.')
  }
  return { root, manifest }
}
/** Restore to a brand-new directory; never replace an app database or any existing files. */
export async function restoreBackupCopy(directory, destination) {
  const verified = await verifyBackup(directory), target = resolve(destination)
  const publicRoot = resolve('public')
  const comparedTarget = process.platform === 'win32' ? target.toLowerCase() : target
  const comparedPublic = process.platform === 'win32' ? publicRoot.toLowerCase() : publicRoot
  if (comparedTarget === comparedPublic || comparedTarget.startsWith(comparedPublic + sep)) throw new Error('Do not restore private data into public/.')
  await mkdir(dirname(target), { recursive: true }); await mkdir(target, { mode: 0o700 })
  await copyFile(join(verified.root, 'database.sqlite'), join(target, 'nexora.sqlite'), constants.COPYFILE_EXCL)
  await mkdir(join(target, 'media'), { mode: 0o700 })
  for (const file of verified.manifest.files) await copyFile(join(verified.root, 'media', file.objectName), join(target, 'media', file.objectName), constants.COPYFILE_EXCL)
  return { destination: target, files: verified.manifest.files.length, restoredToNewDirectory: true }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const value = key => { const index = process.argv.indexOf(key); return index >= 0 ? process.argv[index + 1] : undefined }
  try {
    const root = value('--backup'); if (!root) throw new Error('Provide --backup.')
    const destination = value('--restore-to')
    console.log(JSON.stringify(destination ? await restoreBackupCopy(root, destination) : { verified: true, files: (await verifyBackup(root)).manifest.files.length }))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
