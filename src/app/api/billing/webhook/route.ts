import { handleBillingWebhook } from '@/lib/server/billing'
import { HttpError } from '@/lib/server/errors'
import { json, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const reader = request.body?.getReader(), chunks: Uint8Array[] = []
  let size = 0
  if (!reader) throw new HttpError(400, 'INVALID_WEBHOOK', 'Missing webhook body.')
  while (true) {
    const next = await reader.read(); if (next.done) break
    size += next.value.byteLength
    if (size > 256 * 1024) { await reader.cancel(); throw new HttpError(413, 'REQUEST_TOO_LARGE', 'Webhook too large.') }
    chunks.push(next.value)
  }
  await handleBillingWebhook(Buffer.concat(chunks).toString('utf8'), request.headers.get('stripe-signature') || '')
  return json({ received: true })
}) }
