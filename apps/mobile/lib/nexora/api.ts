export type User = { id: string; email: string; locale?: string };
export type Session = { user: User; accessToken: string; refreshToken: string; accessExpiresAt: string };
export type TokenStore = { read(): Promise<string | null>; write(value: string): Promise<void>; clear(): Promise<void> };

export class ApiError extends Error {
  constructor(message: string, public status = 0, public code = 'NETWORK') { super(message); this.name = 'ApiError'; }
}

/** Only a public HTTPS origin is accepted, never paths, credentials, or query parameters. */
export function validateOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return null;
    const octets = host.split('.').map(Number);
    if (octets.length === 4 && octets.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
      const [a,b] = octets;
      if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return null;
    }
    if (host === '[::]' || host === '[::1]' || host.startsWith('[fc') || host.startsWith('[fd') || /^\[fe[89ab]/.test(host) || host.startsWith('[::ffff:')) return null;
    return url.origin;
  } catch { return null; }
}

function parseSession(raw: unknown): Session {
  const value = raw as Partial<Session> | null;
  if (!value || !value.user || typeof value.user.id !== 'string' || !value.user.id || typeof value.user.email !== 'string' || !value.user.email || typeof value.accessToken !== 'string' || !value.accessToken || typeof value.refreshToken !== 'string' || !value.refreshToken || typeof value.accessExpiresAt !== 'string' || !Number.isFinite(Date.parse(value.accessExpiresAt))) {
    throw new ApiError('The server returned an invalid session. Please sign in again.', 0, 'INVALID_RESPONSE');
  }
  return value as Session;
}

const signedOutMarker = '{"state":"signed-out","deletionFailed":true}';
const deletionWarning = 'Signed out in this app, but secure deletion failed. A signed-out marker replaced the stored session; retry secure cleanup. Remote revocation may be unconfirmed; contact the service operator if needed.';
const unsafeWarning = 'Signed out in this app, but this device could not remove or overwrite its stored session. The session could return after restart. Retry secure cleanup and ask your service operator to revoke the mobile session.';

export class NexoraClient {
  readonly origin: string | null;
  private session: Session | null = null;
  private refreshPromise: { epoch: number; promise: Promise<Session> } | null = null;
  private logoutPromise: Promise<void> | null = null;
  private epoch = 0;
  private storageQueue: Promise<void> = Promise.resolve();
  private listener: (session: Session | null) => void = () => {};
  private warningListener: (warning: string | null) => void = () => {};
  private warning: string | null = null;
  private storageUnsafe = false;
  constructor(origin: string | undefined, private store: TokenStore, private transport: typeof fetch = fetch) { this.origin = validateOrigin(origin); }
  subscribe(fn: (session: Session | null) => void) { this.listener = fn; }
  subscribeWarnings(fn: (warning: string | null) => void) { this.warningListener = fn; fn(this.warning); }
  private warn(value: string | null) { this.warning = value; this.warningListener(value); }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.storageQueue.then(operation, operation);
    this.storageQueue = next.then(() => {}, () => {});
    return next;
  }
  private async setSession(value: Session, expectedEpoch: number) {
    await this.enqueue(async () => {
      if (expectedEpoch !== this.epoch) throw new ApiError('Your session ended. Please sign in again.', 401, 'AUTH');
      await this.store.write(JSON.stringify(value));
      // A concurrent clear is already queued behind this write; it owns cleanup and reporting.
      if (expectedEpoch !== this.epoch) throw new ApiError('Your session ended. Please sign in again.', 401, 'AUTH');
      this.session = value;
      this.listener(value);
    });
  }
  private async clearStored(): Promise<boolean> {
    return this.enqueue(async () => {
      try { await this.store.clear(); this.storageUnsafe = false; this.warn(null); return true; }
      catch {
        // Fail closed on restart if possible, even when deleteItemAsync specifically fails.
        try { await this.store.write(signedOutMarker); this.storageUnsafe = false; this.warn(deletionWarning); }
        catch { this.storageUnsafe = true; this.warn(unsafeWarning); }
        return false;
      }
    });
  }
  private async clearSession(): Promise<boolean> {
    this.epoch++;
    this.session = null;
    this.listener(null);
    return this.clearStored();
  }
  async retrySecureCleanup() {
    if (this.session || this.logoutPromise) throw new ApiError('Sign out and wait for logout to finish before retrying cleanup.', 0, 'STORAGE');
    if (!await this.clearStored()) throw new ApiError(this.warning ?? unsafeWarning, 0, 'STORAGE');
  }
  async restore() {
    const epoch = this.epoch;
    try {
      const raw = await this.store.read();
      if (epoch !== this.epoch || !raw) return;
      if (raw === signedOutMarker) { this.warn(deletionWarning); return; }
      this.session = parseSession(JSON.parse(raw));
      // Refresh on startup so an expired or revoked credential is never treated as active.
      await this.refresh();
    } catch {
      // refresh() already clears and reports its own failure; malformed storage needs cleanup here.
      if (epoch === this.epoch) await this.clearSession();
    }
  }
  private async send<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.origin) throw new ApiError('NEXORA is not connected. Set EXPO_PUBLIC_NEXORA_API_URL to a public HTTPS origin.', 0, 'NOT_CONFIGURED');
    const authPost = path.startsWith('/auth/') && options.method === 'POST';
    const controller = new AbortController();
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new Error('timeout')); }, 20000);
    });
    let response: Response;
    let body: any = null;
    try {
      response = await Promise.race([this.transport(`${this.origin}/api/mobile/v1${path}`, { ...options, ...(authPost ? { redirect: 'error' as const } : {}), credentials: 'omit', signal: controller.signal, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } }), deadline]);
      if (authPost && (response.redirected || (response.status >= 300 && response.status < 400))) throw new ApiError('Authentication redirects are not allowed.', response.status, 'REDIRECT');
      try { body = await Promise.race([response.json(), deadline]); } catch (error) { if (timedOut) throw error; /* body may be empty */ }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const mutation = options.method && options.method !== 'GET' && !authPost;
      throw new ApiError(authPost ? 'Authentication request failed or was redirected. Check your connection and try again.' : mutation ? 'The request could not be confirmed. It may have saved; refresh your workspace before retrying.' : 'Unable to reach NEXORA. Check your connection and try again.', 0, 'NETWORK');
    } finally { clearTimeout(timer!); }
    if (!response.ok) {
      if (response.status === 404 || response.status === 405 || response.status === 501) throw new ApiError('This mobile feature is not available on the connected server yet.', response.status, 'UNAVAILABLE');
      throw new ApiError(typeof body?.error?.message === 'string' ? body.error.message : typeof body?.error === 'string' ? body.error : 'The request could not be completed. Please try again.', response.status, typeof body?.error?.code === 'string' ? body.error.code : typeof body?.code === 'string' ? body.code : 'SERVER');
    }
    if (!body || typeof body !== 'object' || !('data' in body)) throw new ApiError(options.method && options.method !== 'GET' && !authPost ? 'The server response was unexpected. The save may have happened; refresh your workspace before retrying.' : 'The server returned an unexpected response.', response.status, 'INVALID_RESPONSE');
    return body.data as T;
  }
  async login(email: string, password: string) {
    if (this.logoutPromise) { try { await this.logoutPromise; } catch { /* the warning remains visible */ } }
    // A forced sign-out may be clearing storage even when no explicit logout is running.
    await this.storageQueue;
    if (this.storageUnsafe) throw new ApiError(this.warning ?? unsafeWarning, 0, 'STORAGE');
    // Invalidate old-account requests before a new account can become active.
    if (this.session) {
      const cleared = await this.clearSession();
      if (!cleared) throw new ApiError(this.warning ?? deletionWarning, 0, 'STORAGE');
    }
    const epoch = ++this.epoch;
    const value = parseSession(await this.send('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }));
    if (epoch !== this.epoch) throw new ApiError('Sign-in was cancelled.', 0, 'CANCELLED');
    try { await this.setSession(value, epoch); } catch (error) {
      if (epoch === this.epoch) await this.clearSession();
      if (error instanceof ApiError) throw error;
      throw new ApiError(this.warning ?? 'Your session could not be stored securely. Please try again.', 0, 'STORAGE');
    }
  }
  private refresh(): Promise<Session> {
    if (this.refreshPromise?.epoch === this.epoch) return this.refreshPromise.promise;
    const epoch = this.epoch;
    const token = this.session?.refreshToken;
    const userId = this.session?.user.id;
    const promise = (async () => {
      try {
        if (!token) throw new ApiError('Please sign in again.', 401, 'AUTH');
        const value = parseSession(await this.send('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: token }) }));
        if (value.user.id !== userId) throw new ApiError('The server returned a session for a different user. Please sign in again.', 0, 'INVALID_RESPONSE');
        // Logout waits for this rotation and revokes the returned credentials, without restoring them locally.
        if (epoch === this.epoch) {
          try { await this.setSession(value, epoch); }
          catch (error) { if (epoch === this.epoch) throw error; }
        }
        return value;
      } catch (error) {
        if (epoch === this.epoch) {
          const cleared = await this.clearSession();
          if (!cleared) throw new ApiError(this.warning ?? unsafeWarning, 0, 'STORAGE');
        }
        throw error;
      } finally { if (this.refreshPromise?.epoch === epoch) this.refreshPromise = null; }
    })();
    this.refreshPromise = { epoch, promise };
    return promise;
  }
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const initial = this.session;
    const epoch = this.epoch;
    if (!initial) throw new ApiError('Sign in to continue.', 401, 'AUTH');
    const sendWith = (token: string) => this.send<T>(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
    const checkCurrent = () => { if (epoch !== this.epoch) throw new ApiError('Your session ended. Please sign in again.', 401, 'AUTH'); };
    try { const result = await sendWith(initial.accessToken); checkCurrent(); return result; }
    catch (error) {
      checkCurrent();
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      if (!this.session) throw new ApiError('Your session ended. Please sign in again.', 401, 'AUTH');
      const renewed = this.session.accessToken !== initial.accessToken ? this.session : await this.refresh();
      checkCurrent();
      try { const result = await sendWith(renewed.accessToken); checkCurrent(); return result; }
      catch (retryError) {
        checkCurrent();
        if (epoch === this.epoch && retryError instanceof ApiError && retryError.status === 401) {
          const cleared = await this.clearSession();
          if (!cleared) throw new ApiError(this.warning ?? unsafeWarning, 0, 'STORAGE');
        }
        throw retryError;
      }
    }
  }
  logout(all = false): Promise<void> {
    if (this.logoutPromise) return this.logoutPromise;
    const current = this.session;
    const pending = this.refreshPromise?.epoch === this.epoch ? this.refreshPromise.promise : null;
    // Invalidate synchronously, but wait for any server-side rotation before selecting credentials.
    const localClear = this.clearSession();
    const operation = (async () => {
      let latest = current;
      let rotationUncertain = false;
      if (pending) { try { latest = await pending; } catch { rotationUncertain = true; } }
      let revoked = !latest && !rotationUncertain;
      if (latest) {
        try {
          const result = await this.send<{ revoked?: unknown } | null>(all ? '/auth/logout-all' : '/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${latest.accessToken}` }, body: JSON.stringify({ refreshToken: latest.refreshToken }) });
          revoked = !rotationUncertain && result?.revoked === true;
        }
        catch { /* the server may have received the request; revocation is unconfirmed */ }
      }
      const cleared = await localClear;
      if (!cleared) throw new ApiError(`${this.warning ?? unsafeWarning} ${revoked ? 'The server confirmed revocation.' : 'The server could not confirm revocation.'}`, 0, 'STORAGE');
      if (!revoked) throw new ApiError('Signed out in this app, but the server could not confirm mobile session revocation. Contact the service operator; a timeout or failed refresh may have rotated the session.', 0, 'LOGOUT_UNCONFIRMED');
    })();
    this.logoutPromise = operation.finally(() => { this.logoutPromise = null; });
    return this.logoutPromise;
  }
}
