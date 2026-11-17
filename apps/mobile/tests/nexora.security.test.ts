import { describe, expect, it, vi } from 'vitest';
import { NexoraClient, type TokenStore } from '../lib/nexora/api';
import { confirmCreation, WorkspaceQueue } from '../lib/nexora/workspace';
import type { Workspace } from '../lib/nexora/types';

const session = (accessToken = 'a1', refreshToken = 'r1', id = 'alice') => ({ user: { id, email: `${id}@example.invalid` }, accessToken, refreshToken, accessExpiresAt: '2030-01-01T00:00:00Z' });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const deferred = <T = void>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };
function store(initial: string | null = null, failClear = false, failWrite = false) {
  let value = initial;
  const storage: TokenStore = { read: async () => value, write: async v => { if (failWrite) throw Error('write failed'); value = v; }, clear: async () => { if (failClear) throw Error('delete failed'); value = null; } };
  return { storage, value: () => value };
}
const emptyWorkspace = (): Workspace => ({ profile: null, assessments: [], weeklyPlans: [], assets: [], results: [], executions: [], generationAvailable: false });

describe('security regression', () => {
  it('waits for real server rotation and revokes the current access and refresh token', async () => {
    const entered = deferred(); const release = deferred(); const storage = store();
    let active = session(); let revoked = false; const received: string[] = [];
    const transport = async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url); const body = init?.body ? JSON.parse(String(init.body)) : {};
      const authorization = (init?.headers as Record<string, string>)?.Authorization;
      if (path.endsWith('/auth/login')) return json({ data: active });
      if (path.endsWith('/auth/refresh')) {
        expect(body.refreshToken).toBe(active.refreshToken);
        active = session('a2', 'r2'); entered.resolve(); await release.promise;
        return json({ data: active });
      }
      if (path.endsWith('/auth/logout')) {
        received.push(`${authorization}/${body.refreshToken}`);
        if (authorization !== `Bearer ${active.accessToken}` || body.refreshToken !== active.refreshToken) return json({ error: 'stale' }, 401);
        revoked = true; return json({ data: { revoked: true } });
      }
      return json({ error: 'expired' }, 401);
    };
    const client = new NexoraClient('https://api.example.invalid', storage.storage, transport as typeof fetch);
    await client.login('alice', 'secret');
    const request = client.request('/workspace').catch(e => e);
    await entered.promise;
    const logout = client.logout();
    await Promise.resolve();
    expect(received).toEqual([]); // no stale revoke before the rotation response
    release.resolve(); await logout;
    expect(received).toEqual(['Bearer a2/r2']); expect(revoked).toBe(true);
    expect(storage.value()).toBeNull(); expect(await request).toMatchObject({ code: 'AUTH' });
  });

  it('revokes a rotated token even when logout interrupts its secure write', async () => {
    const entered = deferred(); const release = deferred(); let raw: string | null = null; let active = session(); let revoked = false;
    const storage: TokenStore = {
      read: async () => raw,
      write: async value => { if (JSON.parse(value).accessToken === 'a2') { entered.resolve(); await release.promise; } raw = value; },
      clear: async () => { raw = null; },
    };
    const transport = async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith('/auth/login')) return json({ data: active });
      if (String(url).endsWith('/auth/refresh')) { active = session('a2', 'r2'); return json({ data: active }); }
      if (String(url).endsWith('/auth/logout')) {
        const body = JSON.parse(String(init?.body));
        if ((init?.headers as Record<string, string>).Authorization !== `Bearer ${active.accessToken}` || body.refreshToken !== active.refreshToken) return json({ error: 'stale' }, 401);
        revoked = true; return json({ data: { revoked: true } });
      }
      return json({ error: 'expired' }, 401);
    };
    const client = new NexoraClient('https://api.example.invalid', storage, transport as typeof fetch);
    await client.login('a', 'b'); const request = client.request('/workspace').catch(e => e); await entered.promise;
    const logout = client.logout(); release.resolve(); await logout;
    expect(revoked).toBe(true); expect(raw).toBeNull(); expect(await request).toMatchObject({ code: 'AUTH' });
  });

  it('reports unconfirmed revocation if a refresh times out after server-side rotation', async () => {
    vi.useFakeTimers();
    try {
      const entered = deferred(); let active = session(); let revoked = false;
      const transport = async (url: string | URL | Request, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/auth/login')) return json({ data: active });
        if (path.endsWith('/auth/refresh')) {
          active = session('a2', 'r2'); entered.resolve();
          await new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(Error('timeout'))));
        }
        if (path.endsWith('/auth/logout')) {
          const auth = (init?.headers as Record<string, string>)?.Authorization;
          if (auth !== `Bearer ${active.accessToken}`) return json({ error: 'stale' }, 401);
          revoked = true; return json({ data: { revoked: true } });
        }
        return json({ error: 'expired' }, 401);
      };
      const client = new NexoraClient('https://api.example.invalid', store().storage, transport as typeof fetch);
      await client.login('alice', 'secret'); const request = client.request('/workspace').catch(e => e);
      await entered.promise; const logout = client.logout(); const outcome = logout.catch(e => e);
      await vi.advanceTimersByTimeAsync(20000);
      expect(await outcome).toMatchObject({ code: 'LOGOUT_UNCONFIRMED' }); expect(revoked).toBe(false);
      expect(await request).toBeInstanceOf(Error);
    } finally { vi.useRealTimers(); }
  });

  it('also bounds a stalled refresh response body', async () => {
    vi.useFakeTimers();
    try {
      const entered = deferred();
      const transport = async (url: string | URL | Request) => {
        if (String(url).endsWith('/auth/login')) return json({ data: session() });
        if (String(url).endsWith('/auth/refresh')) {
          entered.resolve();
          return { ok: true, status: 200, redirected: false, json: () => new Promise(() => {}) } as Response;
        }
        if (String(url).endsWith('/auth/logout')) return json({ data: { revoked: true } });
        return json({ error: 'expired' }, 401);
      };
      const client = new NexoraClient('https://api.example.invalid', store().storage, transport as typeof fetch);
      await client.login('a', 'b'); const request = client.request('/workspace').catch(e => e); await entered.promise;
      const outcome = client.logout().catch(e => e); await vi.advanceTimersByTimeAsync(20000);
      // Even an apparently successful revoke of stale credentials cannot prove which token rotated.
      expect(await outcome).toMatchObject({ code: 'LOGOUT_UNCONFIRMED' }); expect(await request).toBeInstanceOf(Error);
    } finally { vi.useRealTimers(); }
  });

  it('warns on refresh failure when secure delete fails and prevents restoration using a marker', async () => {
    const saved = store(null, true); const warnings: (string | null)[] = [];
    const transport = async (url: string | URL | Request) => String(url).endsWith('/auth/login') ? json({ data: session() }) : json({ error: 'unauthorized' }, 401);
    const client = new NexoraClient('https://api.example.invalid', saved.storage, transport as typeof fetch);
    client.subscribeWarnings(w => warnings.push(w)); await client.login('a', 'b');
    await expect(client.request('/workspace')).rejects.toMatchObject({ code: 'STORAGE' });
    expect(warnings.at(-1)).toMatch(/secure deletion failed/i); expect(saved.value()).toContain('"signed-out"');
    const restartTransport = vi.fn(transport); const restarted = new NexoraClient('https://api.example.invalid', saved.storage, restartTransport as typeof fetch);
    const restartedWarnings: (string | null)[] = []; restarted.subscribeWarnings(w => restartedWarnings.push(w));
    await restarted.restore(); expect(restartTransport).not.toHaveBeenCalled(); expect(restartedWarnings.at(-1)).toMatch(/secure deletion failed/i);
  });

  it('warns of restart risk when delete and overwrite both fail during restoration', async () => {
    const saved = store(JSON.stringify(session()), true, true); const warnings: (string | null)[] = [];
    const transport = async () => json({ error: 'unauthorized' }, 401);
    const client = new NexoraClient('https://api.example.invalid', saved.storage, transport as typeof fetch);
    client.subscribeWarnings(w => warnings.push(w)); await client.restore();
    expect(warnings.at(-1)).toMatch(/could return after restart/i); expect(saved.value()).not.toBeNull();
    await expect(client.login('a', 'b')).rejects.toMatchObject({ code: 'STORAGE' });
  });

  it('warns when deleting stored credentials fails after a 401 retry', async () => {
    const saved = store(null, true); const warnings: (string | null)[] = [];
    const transport = async (url: string | URL | Request) => {
      if (String(url).endsWith('/auth/login')) return json({ data: session() });
      if (String(url).endsWith('/auth/refresh')) return json({ data: session('a2', 'r2') });
      return json({ error: 'unauthorized' }, 401);
    };
    const client = new NexoraClient('https://api.example.invalid', saved.storage, transport as typeof fetch);
    client.subscribeWarnings(w => warnings.push(w)); await client.login('a', 'b');
    await expect(client.request('/workspace')).rejects.toMatchObject({ code: 'STORAGE' }); expect(warnings.at(-1)).toMatch(/secure deletion failed/i);
  });

  it('does not replay an old user request under a different user returned by refresh', async () => {
    let workspaceCalls = 0; const saved = store(); const listener = vi.fn();
    const transport = async (url: string | URL | Request) => {
      if (String(url).endsWith('/auth/login')) return json({ data: session() });
      if (String(url).endsWith('/auth/refresh')) return json({ data: session('bob-access', 'bob-refresh', 'bob') });
      workspaceCalls++; return json({ error: 'expired' }, 401);
    };
    const client = new NexoraClient('https://api.example.invalid', saved.storage, transport as typeof fetch);
    client.subscribe(listener); await client.login('a', 'b');
    await expect(client.request('/goals', { method: 'POST' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(workspaceCalls).toBe(1); expect(saved.value()).toBeNull(); expect(listener).toHaveBeenLastCalledWith(null);
  });

  it('uses redirect:error for all auth POSTs and rejects a returned redirect', async () => {
    const calls: RequestInit[] = [];
    const transport = async (_: string | URL | Request, init?: RequestInit) => { calls.push(init!); return new Response(null, { status: 302, headers: { Location: 'https://other.example.invalid' } }); };
    const client = new NexoraClient('https://api.example.invalid', store().storage, transport as typeof fetch);
    await expect(client.login('a', 'b')).rejects.toMatchObject({ code: 'REDIRECT' }); expect(calls[0].redirect).toBe('error');
  });

  it('sends login, refresh, logout and logout-all without following redirects', async () => {
    const calls: { path: string; redirect?: RequestRedirect }[] = [];
    const transport = async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url); if (path.includes('/auth/')) calls.push({ path, redirect: init?.redirect });
      if (path.endsWith('/auth/login')) return json({ data: session() });
      if (path.endsWith('/auth/refresh')) return json({ data: session('a2', 'r2') });
      if (path.endsWith('/auth/logout') || path.endsWith('/auth/logout-all')) return json({ data: { revoked: true } });
      return (init?.headers as Record<string, string>).Authorization === 'Bearer a1' ? json({ error: 'expired' }, 401) : json({ data: {} });
    };
    const client = new NexoraClient('https://api.example.invalid', store().storage, transport as typeof fetch);
    await client.login('a', 'b'); await client.request('/workspace'); await client.logout();
    await client.login('a', 'b'); await client.logout(true);
    expect(calls.map(call => call.path.split('/').at(-1))).toEqual(['login', 'refresh', 'logout', 'login', 'logout-all']);
    expect(calls.every(call => call.redirect === 'error')).toBe(true);
  });

  it('reports a malformed 2xx mutation as unknown rather than not saved', async () => {
    const transport = async (url: string | URL | Request) => String(url).endsWith('/auth/login') ? json({ data: session() }) : json({ unexpected: true });
    const client = new NexoraClient('https://api.example.invalid', store().storage, transport as typeof fetch);
    await client.login('a', 'b');
    await expect(client.request('/goals', { method: 'POST', body: '{}' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE', message: expect.stringMatching(/may have happened.*refresh/i) });
  });
});

describe('workspace isolation and confirmation', () => {
  it('isolates a late old-user response and does not block the new user', async () => {
    const queue = new WorkspaceQueue(); const gate = deferred(); const applied: string[] = [];
    queue.changeIdentity('alice');
    const old = queue.run(async () => { await gate.promise; return 'alice private'; }, v => applied.push(v)).catch(e => e);
    await Promise.resolve(); queue.changeIdentity('bob');
    await queue.run(async () => 'bob workspace', v => applied.push(v)); gate.resolve();
    expect(await old).toMatchObject({ code: 'CANCELLED' }); expect(applied).toEqual(['bob workspace']);
  });
  it('does not leak a late old-user server error to the new user', async () => {
    const queue = new WorkspaceQueue(); const gate = deferred(); queue.changeIdentity('alice');
    const old = queue.run(async () => { await gate.promise; throw Error('alice private error'); }, () => {}).catch(e => e);
    await Promise.resolve(); queue.changeIdentity('bob'); gate.resolve();
    expect(await old).toMatchObject({ code: 'CANCELLED' });
  });
  it('serializes GET and mutations so a stale response cannot overwrite a newer one', async () => {
    const queue = new WorkspaceQueue(); const gate = deferred(); const order: string[] = [];
    queue.changeIdentity('alice');
    const first = queue.run(async () => { order.push('get-start'); await gate.promise; return 'old'; }, v => order.push(v));
    const second = queue.run(async () => { order.push('save-start'); return 'new'; }, v => order.push(v));
    await Promise.resolve(); expect(order).toEqual(['get-start']); gate.resolve(); await Promise.all([first, second]);
    expect(order).toEqual(['get-start', 'old', 'save-start', 'new']);
  });
  it('requires a matching receipt and entity even when another concurrent item looks identical', () => {
    const workspace = emptyWorkspace();
    workspace.weeklyPlans.push({ id: 'other', title: 'same', status: 'planned', dueDate: '2030-01-01', weekStart: '', evaluationMetric: '', notes: '' });
    const confirmation = { requestId: 'ours', collection: 'weeklyPlans' as const, matches: (item: { title: string }) => item.title === 'same' };
    for (const raw of [{ workspace }, { receipt: { requestId: 'other-request', entityIds: ['other'] } }, { receipt: { requestId: 'ours', entityIds: ['missing'] } }]) {
      expect(() => confirmCreation(raw, workspace, confirmation)).toThrow(/may have saved/i);
    }
    expect(() => confirmCreation({ receipt: { requestId: 'ours', entityIds: ['other'] } }, workspace, confirmation)).not.toThrow();
  });
});
