import { processImageJob, requireWorker } from '@/lib/server/image-studio'
import { json, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => { requireWorker(request); return json(await processImageJob()) }) }
