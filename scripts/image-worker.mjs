import { existsSync } from 'node:fs'
for (const file of ['.env.local', '.env']) if (existsSync(file)) process.loadEnvFile(file)
const token = process.env.NEXORA_WORKER_TOKEN || ''
const origin = new URL(process.env.NEXORA_WORKER_ORIGIN || 'http://127.0.0.1:3000')
if (token.length < 32) throw new Error('Set a server-only NEXORA_WORKER_TOKEN of at least 32 characters.')
if (!['http:', 'https:'].includes(origin.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('The image worker must connect to the local application root on loopback.')
let stopping = false
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopping = true })
console.log(JSON.stringify({ event: 'image_worker_started', transport: 'loopback', jobs: 'local-image-only' }))
while (!stopping) {
  try {
    const response = await fetch(new URL('/api/internal/image-worker', origin), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(60_000) })
    if (!response.ok) console.error(JSON.stringify({ event: 'image_worker_request_failed', status: response.status }))
    else { const result = await response.json(); if (result.processed) console.log(JSON.stringify({ event: 'image_worker_result', ...result })) }
  } catch { console.error(JSON.stringify({ event: 'image_worker_connection_failed' })) }
  if (!process.argv.includes('--once') && !stopping) await new Promise(done => setTimeout(done, 2000))
  if (process.argv.includes('--once')) break
}
