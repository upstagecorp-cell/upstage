import { ApiError } from './api';
import type { Workspace } from './types';

/** Serialize workspace reads and writes per identity; a new identity never waits for the old one. */
export class WorkspaceQueue {
  private identity: string | null = null;
  private generation = 0;
  private tail: Promise<void> = Promise.resolve();
  changeIdentity(id: string | null): boolean {
    if (id === this.identity) return false;
    this.identity = id;
    this.generation++;
    this.tail = Promise.resolve();
    return true;
  }
  snapshot() { return this.generation; }
  isCurrent(generation: number) { return this.identity !== null && generation === this.generation; }
  run<T>(operation: () => Promise<T>, apply: (value: T) => void): Promise<T> {
    const generation = this.generation;
    const check = () => { if (!this.isCurrent(generation)) throw new ApiError('Your session changed. Refresh your workspace.', 0, 'CANCELLED'); };
    const result = this.tail.then(async () => {
      check();
      let value: T;
      try { value = await operation(); } catch (error) { check(); throw error; }
      check();
      apply(value);
      return value;
    });
    this.tail = result.then(() => {}, () => {});
    return result;
  }
}

export type CreationCollection = 'assets' | 'weeklyPlans' | 'results' | 'assessments';
export type Confirmation = { requestId: string; collection: CreationCollection; matches?: (item: any) => boolean };

/** A workspace diff cannot prove which concurrent request created an item. */
export function confirmCreation(raw: unknown, workspace: Workspace, confirmation: Confirmation) {
  const receipt = (raw as { receipt?: { requestId?: unknown; entityIds?: unknown } } | null)?.receipt;
  const ids = receipt?.entityIds;
  const entities = workspace[confirmation.collection] as { id: string }[];
  if (!receipt || receipt.requestId !== confirmation.requestId || !Array.isArray(ids) || !ids.length || !ids.every(id => typeof id === 'string' && !!id) || !ids.every(id => entities.some(item => item.id === id)) || !entities.some(item => ids.includes(item.id) && (!confirmation.matches || confirmation.matches(item)))) {
    throw new ApiError('The server did not identify this request and its created item. It may have saved; refresh your workspace before retrying.', 0, 'SAVE_UNCONFIRMED');
  }
}

/** Correlation only, not authorization or a substitute for server-side idempotency. */
export function requestId() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `mobile_${Date.now()}_${Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('')}`;
}
