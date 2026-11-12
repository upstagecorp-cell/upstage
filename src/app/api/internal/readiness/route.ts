import { requireWorker, workerAvailable } from '@/lib/server/image-studio'
import { storageReady } from '@/lib/server/media-files'
import { database } from '@/lib/server/database'
import { json, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function GET(request: Request) { return route(async () => {
  requireWorker(request)
  let db = false
  try { db = (database().prepare('SELECT 1 AS ready').get() as { ready: number }).ready === 1 } catch {}
  const storage = await storageReady(), worker = workerAvailable(), ready = db && storage && worker
  return json({ status: ready ? 'ready' : 'degraded', checks: { database: db, privateFiles: storage, imageWorker: worker } }, ready ? 200 : 503)
}) }
