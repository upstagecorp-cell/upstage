import { describe, expect, it, vi } from 'vitest';
import { ApiError, NexoraClient, validateOrigin, type TokenStore } from '../lib/nexora/api';

const session = (accessToken='old', refreshToken='refresh') => ({ user:{id:'user-id',email:'user@example.invalid'}, accessToken, refreshToken, accessExpiresAt:'2030-01-01T00:00:00Z' });
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json'}});
function makeStore() { let data: string | null = null; const store:TokenStore = {read:async()=>data, write:async value=>{data=value;},clear:async()=>{data=null;}}; return {store, read:()=>data}; }

describe('NEXORA mobile API contract', () => {
  it('accepts only an HTTPS origin without credentials, paths or query', () => {
    expect(validateOrigin('https://api.example.invalid')).toBe('https://api.example.invalid');
    for(const value of ['', 'http://localhost:3000', 'https://localhost', 'https://127.0.0.1', 'https://10.1.2.3', 'https://[::1]', 'https://u:p@example.invalid', 'https://example.invalid/api', 'https://example.invalid/?a=1', 'not-a-url']) expect(validateOrigin(value)).toBeNull();
  });
  it('fails clearly when no origin is configured', async () => {
    const {store} = makeStore();const client=new NexoraClient('',store);
    await expect(client.login('a','b')).rejects.toMatchObject({code:'NOT_CONFIGURED'});
  });
  it('posts login without cookies and persists a valid session', async () => {
    const {store,read}=makeStore(); const transport=vi.fn(async ()=>json({data:session()}));const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);const listener=vi.fn();client.subscribe(listener);
    await client.login('user@example.invalid','password');
    expect(transport).toHaveBeenCalledWith('https://api.example.invalid/api/mobile/v1/auth/login',expect.objectContaining({method:'POST',credentials:'omit',body:JSON.stringify({email:'user@example.invalid',password:'password'})}));
    expect(JSON.parse(read()!).refreshToken).toBe('refresh');expect(listener).toHaveBeenLastCalledWith(session());
  });
  it('does not retain a malformed session', async () => {
    const {store,read}=makeStore();const client=new NexoraClient('https://api.example.invalid',store,(async()=>json({data:{user:{id:'x',email:'x'}}})) as typeof fetch);
    await expect(client.login('x','y')).rejects.toMatchObject({code:'INVALID_RESPONSE'});expect(read()).toBeNull();
  });
  it('single-flights concurrent 401 refreshes and retries each request with the rotated token', async () => {
    const {store}=makeStore();let refreshes=0;let oldCalls=0;
    const transport=vi.fn(async (url: string | URL | Request, init?:RequestInit) => {const u=String(url); if(u.endsWith('/auth/login'))return json({data:session()});if(u.endsWith('/auth/refresh')){refreshes++;await new Promise(r=>setTimeout(r,15));return json({data:session('new','rotated')});} const token=(init?.headers as Record<string,string>)?.Authorization; if(token==='Bearer old'){oldCalls++;return json({error:'expired'},401);}return json({data:{ok:true}});});
    const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);await client.login('x','y');const results=await Promise.all([client.request('/workspace'),client.request('/workspace'),client.request('/workspace')]);
    expect(results).toEqual([{ok:true},{ok:true},{ok:true}]);expect(oldCalls).toBe(3);expect(refreshes).toBe(1);
  });
  it('clears the session if refresh fails', async () => {
    const {store,read}=makeStore();const listener=vi.fn();const transport=vi.fn(async (url:string|URL|Request)=>String(url).endsWith('/auth/login')?json({data:session()}):json({error:'expired'},401));const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);client.subscribe(listener);await client.login('x','y');
    await expect(client.request('/workspace')).rejects.toBeInstanceOf(ApiError);expect(read()).toBeNull();expect(listener).toHaveBeenLastCalledWith(null);
  });
  it('reports missing feature endpoints instead of a success', async () => {
    const {store}=makeStore();const transport=vi.fn(async (url:string|URL|Request)=>String(url).endsWith('/auth/login')?json({data:session()}):json({error:'not found'},404));const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);await client.login('x','y');await expect(client.request('/goals',{method:'POST'})).rejects.toMatchObject({code:'UNAVAILABLE'});
  });
  it('does not resurrect a session when logout races with refresh', async () => {
    const {store,read}=makeStore();let release!:()=>void;let entered!:()=>void;const started=new Promise<void>(r=>{entered=r;});const gate=new Promise<void>(r=>{release=r;});
    const transport=vi.fn(async (url:string|URL|Request)=>{const u=String(url);if(u.endsWith('/auth/login'))return json({data:session()});if(u.endsWith('/auth/refresh')){entered();await gate;return json({data:session('new','rotated')});}if(u.endsWith('/auth/logout'))return json({data:{revoked:true}});return json({error:'expired'},401);});
    const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);await client.login('x','y');const pending=client.request('/workspace').catch(e=>e);await started;const logout=client.logout();release();await logout;expect(await pending).toBeInstanceOf(ApiError);expect(read()).toBeNull();await expect(client.request('/workspace')).rejects.toMatchObject({code:'AUTH'});
  });
  it('tells the user when remote logout was not confirmed, while clearing local state', async () => {
    const {store,read}=makeStore();const transport=vi.fn(async (url:string|URL|Request)=>String(url).endsWith('/auth/login')?json({data:session()}):json({error:'not found'},404));const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);await client.login('x','y');await expect(client.logout(true)).rejects.toMatchObject({code:'LOGOUT_UNCONFIRMED'});expect(read()).toBeNull();
  });
  it('does not claim remote revocation when the server returns an unconfirmed 2xx envelope', async () => {
    for (const data of [null, {revoked:false}, {ok:true}, {}]) {
      const {store,read}=makeStore();
      const transport=vi.fn(async (url:string|URL|Request)=>String(url).endsWith('/auth/login')?json({data:session()}):json({data}));
      const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);
      await client.login('x','y');
      await expect(client.logout()).rejects.toMatchObject({code:'LOGOUT_UNCONFIRMED'});
      expect(read()).toBeNull();
    }
  });
  it('reports a secure deletion failure even if remote revocation succeeds', async () => {
    const store:TokenStore={read:async()=>null,write:async()=>{},clear:async()=>{throw new Error('locked');}};
    const transport=vi.fn(async (url:string|URL|Request)=>String(url).endsWith('/auth/login')?json({data:session()}):json({data:{revoked:true}}));const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);await client.login('x','y');await expect(client.logout()).rejects.toMatchObject({code:'STORAGE'});await expect(client.request('/workspace')).rejects.toMatchObject({code:'AUTH'});
  });
  it('rejects a late workspace response after logout', async () => {
    const {store}=makeStore();let release!:()=>void;let entered!:()=>void;const started=new Promise<void>(r=>{entered=r;});const gate=new Promise<void>(r=>{release=r;});
    const transport=vi.fn(async (url:string|URL|Request)=>{const u=String(url);if(u.endsWith('/auth/login'))return json({data:session()});if(u.endsWith('/auth/logout'))return json({data:{revoked:true}});entered();await gate;return json({data:{private:'old session'}});});
    const client=new NexoraClient('https://api.example.invalid',store,transport as typeof fetch);await client.login('x','y');const pending=client.request('/workspace').catch(e=>e);await started;await client.logout();release();expect(await pending).toMatchObject({code:'AUTH'});
  });
});
