type SessionEnvironment = { appOrigin?: string; managedProject?: string }

/** Only an operator-configured origin or a managed HTTPS preview enables cross-site cookies. */
export function sessionCookiePolicy(requestUrl: string, environment: SessionEnvironment): string {
  let protocol: string
  try { protocol = new URL(environment.appOrigin || requestUrl).protocol } catch { protocol = 'http:' }
  const publicHttps = protocol === 'https:' || Boolean(environment.managedProject)
  return publicHttps ? 'SameSite=None; Secure' : 'SameSite=Strict'
}
