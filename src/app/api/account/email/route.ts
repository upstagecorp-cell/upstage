import { requireUser } from '@/lib/server/auth'
import { requestAccountEmail } from '@/lib/server/account-email'
import { HttpError, objectInput } from '@/lib/server/errors'
import { json, readJson, route } from '@/lib/server/http'
export const runtime = 'nodejs'
export function POST(request: Request) { return route(async () => {
  const input = objectInput(await readJson(request))
  if (input.purpose === 'verify') await requestAccountEmail(requireUser(request).email, 'verify')
  else if (input.purpose === 'reset' && typeof input.email === 'string') await requestAccountEmail(input.email, 'reset')
  else throw new HttpError(400, 'INVALID_EMAIL_REQUEST', 'Choose a valid email request.')
  return json({ message: 'If this account needs an email, a link has been sent. Check your inbox and spam folder.' })
}) }
