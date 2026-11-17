#!/usr/bin/env node
/**
 * Copy the mobile source between the GitHub monorepo and a local build/preview copy.
 * Common secret and database paths are excluded and known credential patterns rejected.
 * No scanner is exhaustive: review every change before committing. Matching files are
 * overwritten but never deleted; --check detects stale files in the allowed inventory.
 *
 *   node scripts/sync-mobile.mjs --from-preview /path/to/preview
 *   node scripts/sync-mobile.mjs --to-preview /path/to/preview
 *   node scripts/sync-mobile.mjs --check /path/to/preview
 */
import { createHash } from 'node:crypto'
import { cp, lstat, mkdir, readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const canonical = join(repo, 'apps', 'mobile')
const [mode, previewArg] = process.argv.slice(2)
if (!['--from-preview', '--to-preview', '--check'].includes(mode) || !previewArg) {
  console.error('Usage: node scripts/sync-mobile.mjs <--from-preview|--to-preview|--check> /absolute/path/to/preview')
  process.exit(2)
}
const preview = resolve(previewArg)
if (preview === canonical || preview === repo || !previewArg.startsWith('/')) {
  console.error('Choose a separate, absolute preview project directory.')
  process.exit(2)
}

// Limit copying to known project roots, then apply filename and content checks.
const roots = [
  'app', 'assets', 'components', 'constants', 'drizzle', 'hooks', 'lib', 'scripts',
  'server', 'shared', 'tests', 'app.config.ts', 'babel.config.js', 'drizzle.config.ts',
  'eslint.config.js', 'global.css', 'metro.config.js', 'nativewind-env.d.ts',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tailwind.config.js',
  'theme.config.d.ts', 'theme.config.js', 'tsconfig.json', '.gitignore', '.npmrc',
  '.watchmanconfig', 'README.md', 'plan.md', 'TODO.md',
]
const excluded = /^(?:\.git|node_modules|\.expo|\.env(?:\..*)?|dist|web-build|coverage|\.data|\.cache|\.webdev|credentials\.json|service-account\.json|secrets?\.json)$/i
const unsafeExtension = /\.(?:pem|key|p8|p12|pfx|jks|mobileprovision|sqlite|sqlite3|db)(?:-wal|-shm|-journal)?$/i
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:sk_live_|rk_live_|gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /(?:^|\n)\s*(?:[^\n]*:)?(?:_authToken|_auth|_password)\s*=\s*\S+/i,
]

async function exists(path) {
  try { await lstat(path); return true } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}
async function collect(base) {
  const result = new Map()
  async function walk(path) {
    const st = await lstat(path)
    if (st.isSymbolicLink()) throw new Error(`Symlinks are not allowed: ${path}`)
    if (st.isDirectory()) {
      for (const name of (await readdir(path)).sort()) {
        if (!excluded.test(name) && !unsafeExtension.test(name)) await walk(join(path, name))
      }
    } else if (st.isFile()) {
      const name = relative(base, path)
      const content = await readFile(path)
      if (!content.includes(0) && secretPatterns.some(pattern => pattern.test(content.toString('utf8')))) {
        throw new Error(`Possible credential in ${name}; review and remove it before syncing.`)
      }
      result.set(name, createHash('sha256').update(content).digest('hex'))
    }
  }
  for (const root of roots) {
    const path = join(base, root)
    if (await exists(path)) await walk(path)
  }
  return result
}

const left = await collect(canonical)
const right = await collect(preview)
if (mode === '--check') {
  const names = [...new Set([...left.keys(), ...right.keys()])].sort()
  const diffs = names.filter(name => left.get(name) !== right.get(name))
  if (diffs.length) {
    console.error('Mobile source differs between the monorepo and preview:')
    for (const name of diffs) console.error(`  ${name}`)
    process.exit(1)
  }
  if (!names.length) throw new Error('Both mobile source trees are empty.')
  console.log(`Mobile sources match (${names.length} files).`)
} else {
  const source = mode === '--from-preview' ? preview : canonical
  const target = mode === '--from-preview' ? canonical : preview
  const files = mode === '--from-preview' ? right : left
  if (!files.size) throw new Error(`No mobile source files found in ${source}`)
  await mkdir(target, { recursive: true })
  if ((await lstat(target)).isSymbolicLink()) throw new Error(`Destination root symlink is not allowed: ${target}`)
  for (const name of files.keys()) {
    const targetFile = join(target, name)
    // Validate each path component before creating the next directory.
    let parent = target
    for (const part of name.split('/').slice(0, -1)) {
      parent = join(parent, part)
      if (!await exists(parent)) await mkdir(parent)
      if ((await lstat(parent)).isSymbolicLink()) throw new Error(`Destination symlink is not allowed: ${parent}`)
    }
    if (await exists(targetFile) && (await lstat(targetFile)).isSymbolicLink()) {
      throw new Error(`Destination symlink is not allowed: ${targetFile}`)
    }
    await cp(join(source, name), targetFile)
  }
  console.log(`Copied ${files.size} files from ${source} to ${target}; no files were deleted.`)
  console.log('Run --check to identify stale or differing files before committing or building.')
}
