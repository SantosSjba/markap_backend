import { AsyncLocalStorage } from 'node:async_hooks';

export type AuditSource = 'HTTP' | 'WS' | 'JOB' | 'SEED' | 'SYSTEM';

export interface AuditContextData {
  userId: string | null;
  requestId: string | null;
  ip: string | null;
  userAgent: string | null;
  source: AuditSource;
}

export const SYSTEM_CONTEXT: AuditContextData = Object.freeze({
  userId: null,
  requestId: null,
  ip: null,
  userAgent: null,
  source: 'SYSTEM',
});

const storage = new AsyncLocalStorage<AuditContextData>();

/** Estático para que la extensión de Prisma lo use sin inyección. */
export class AuditContext {
  static get(): AuditContextData {
    return storage.getStore() ?? SYSTEM_CONTEXT;
  }

  static run<T>(data: AuditContextData, fn: () => T): T {
    return storage.run(data, fn);
  }
}
