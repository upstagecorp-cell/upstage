import { createHash, randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import { database, getRecord, saveRecord, transaction } from './database'
import { limit } from './auth'
import { HttpError, objectInput } from './errors'
const scrypt = promisify(scryptCallback)
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export function emailConfigured() { return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.NEXORA_EMAIL_FROM?.trim() && process.env.APP_ORIGIN?.trim()) }
export async function requestAccountEmail(email: string, purpose: 'reset' | 'verify'): Promise<void> {
  if (!emailConfigured()) throw new HttpError(503, 'EMAIL_UNAVAILABLE', 'Account email is not available yet. Please contact support.')
  const normalized = email.trim().toLowerCase()
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new HttpError(400, 'INVALID_EMAIL', 'Enter a valid email address.')
  limit('account-email:global', 30, 60_000)
  limit(`account-email:${purpose}:${normalized}`, 3, 15 * 60_000)
  const user = database().prepare('SELECT id FROM users WHERE email=?').get(normalized) as { id: string } | undefined
  if (!user || (purpose === 'verify' && getRecord(user.id, 'email_verified', 'current'))) return
  const token = randomBytes(32).toString('hex'), created = Date.now(), expires = created + (purpose === 'reset' ? 30 * 60_000 : 24 * 60 * 60_000)
  transaction(() => {
    database().prepare('DELETE FROM account_tokens WHERE (owner_id=? AND purpose=?) OR expires_at<?').run(user.id, purpose, created)
    database().prepare('INSERT INTO account_tokens(token_hash,owner_id,purpose,expires_at,created_at) VALUES(?,?,?,?,?)').run(hash(token), user.id, purpose, expires, created)
  })
  const link = `${new URL(process.env.APP_ORIGIN!).origin}/account/${purpose}#token=${token}`
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NEXORA_EMAIL_FROM, to: [normalized], subject: purpose === 'reset' ? 'Reset your NEXORA password' : 'Verify your NEXORA email',
        text: `${purpose === 'reset' ? 'Choose a new password' : 'Verify your email'} using this link:\n\n${link}\n\nThis link expires in ${purpose === 'reset' ? '30 minutes' : '24 hours'} and can be used once. If you did not request it, ignore this email.` }),
      signal: AbortSignal.timeout(15_000), redirect: 'error' })
    await response.body?.cancel()
    if (!response.ok) throw new Error('Delivery failed')
  } catch {
    database().prepare('DELETE FROM account_tokens WHERE token_hash=?').run(hash(token))
    throw new HttpError(503, 'EMAIL_UNAVAILABLE', 'Account email could not be sent. Please try again later or contact support.')
  }
}
export async function completeAccountToken(raw: unknown): Promise<'reset' | 'verify'> {
  const input = objectInput(raw)
  if (typeof input.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) throw new HttpError(400, 'INVALID_TOKEN', 'This link is invalid or expired. Request a new email.')
  const tokenHash = hash(input.token)
  const row = database().prepare('SELECT owner_id,purpose,expires_at FROM account_tokens WHERE token_hash=?').get(tokenHash) as { owner_id: string; purpose: 'reset' | 'verify'; expires_at: number } | undefined
  if (!row || row.expires_at <= Date.now() || input.purpose !== row.purpose) throw new HttpError(400, 'INVALID_TOKEN', 'This link is invalid or expired. Request a new email.')
  let passwordHash = ''
  if (row.purpose === 'reset') {
    if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) throw new HttpError(400, 'INVALID_PASSWORD', 'Use a password between 12 and 128 characters.')
    const salt = randomBytes(16).toString('hex'), derived = await scrypt(input.password, salt, 64) as Buffer
    passwordHash = `${salt}:${derived.toString('hex')}`
  }
  transaction(() => {
    const consumed = database().prepare('DELETE FROM account_tokens WHERE token_hash=? AND expires_at>?').run(tokenHash, Date.now())
    if (consumed.changes !== 1) throw new HttpError(400, 'INVALID_TOKEN', 'This link is invalid or expired. Request a new email.')
    if (row.purpose === 'verify') saveRecord(row.owner_id, 'email_verified', 'current', { verifiedAt: new Date().toISOString() })
    else {
      database().prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash, row.owner_id)
      database().prepare('DELETE FROM sessions WHERE user_id=?').run(row.owner_id)
      database().prepare('DELETE FROM account_tokens WHERE owner_id=? AND purpose=?').run(row.owner_id, 'reset')
    }
  })
  return row.purpose
}
