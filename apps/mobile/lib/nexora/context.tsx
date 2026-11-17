import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError, NexoraClient, type Session, type TokenStore } from './api';
import { workspaceFromResponse, type Workspace } from './types';
import { confirmCreation, type Confirmation, WorkspaceQueue } from './workspace';

const key = 'nexora.mobile.session.v1';
let memory: string | null = null;
const store: TokenStore = Platform.OS === 'web' ? {
  read: async () => memory, write: async value => { memory = value; }, clear: async () => { memory = null; },
} : {
  read: () => SecureStore.getItemAsync(key), write: value => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }), clear: () => SecureStore.deleteItemAsync(key),
};
// This value is a public origin, not a secret. Expo inlines this exact expression.
export const client = new NexoraClient(process.env.EXPO_PUBLIC_NEXORA_API_URL, store);

type State = { session: Session | null; restoring: boolean; workspace: Workspace | null; loading: boolean; error: string | null; securityWarning: string | null; retrySecureCleanup: () => Promise<void>; refresh: () => Promise<void>; mutate: (path: string, method: 'POST'|'PATCH', body: unknown, confirmation?: Confirmation) => Promise<Workspace>; signIn: (email: string, password: string) => Promise<void>; signOut: (all?: boolean) => Promise<void> };
const Context = createContext<State | null>(null);
export function NexoraProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const queue = useRef(new WorkspaceQueue()).current;
  useEffect(() => {
    client.subscribe(s => {
      if (queue.changeIdentity(s?.user.id ?? null)) { setWorkspace(null); setError(null); setLoading(false); }
      setSession(s);
    });
    client.subscribeWarnings(setSecurityWarning);
    void client.restore().finally(() => setRestoring(false));
    return () => { client.subscribe(() => {}); client.subscribeWarnings(() => {}); };
  }, [queue]);
  const refresh = useCallback(async () => {
    const generation = queue.snapshot();
    if (!queue.isCurrent(generation)) return;
    setLoading(true); setError(null);
    try { await queue.run(async () => workspaceFromResponse(await client.request('/workspace')), setWorkspace); }
    catch (e) { if (queue.isCurrent(generation)) setError(e instanceof Error ? e.message : 'Could not load your workspace.'); }
    finally { if (queue.isCurrent(generation)) setLoading(false); }
  }, [queue]);
  useEffect(() => { if (session) void refresh(); }, [session?.user.id, refresh]);
  const mutate: State['mutate'] = async (path, method, body, confirmation) => queue.run(async () => {
    const result = await client.request<unknown>(path, { method, body: JSON.stringify(body) });
    let next: Workspace;
    try { next = workspaceFromResponse(result); }
    catch { throw new ApiError('The server response was incomplete. The save may have happened; refresh your workspace before retrying.', 0, 'SAVE_UNCONFIRMED'); }
    if (confirmation) confirmCreation(result, next, confirmation);
    return next;
  }, setWorkspace);
  const signIn = async (email: string, password: string) => client.login(email, password);
  const signOut = async (all = false) => client.logout(all);
  const retrySecureCleanup = async () => client.retrySecureCleanup();
  return <Context.Provider value={{ session, restoring, workspace, loading, error, securityWarning, retrySecureCleanup, refresh, mutate, signIn, signOut }}>{children}</Context.Provider>;
}
export function useNexora() { const value = useContext(Context); if (!value) throw new Error('NexoraProvider missing'); return value; }
export function message(error: unknown) { return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
