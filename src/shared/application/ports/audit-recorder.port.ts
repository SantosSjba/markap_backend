export type AuditEvent =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'ACCESS_DENIED';
export interface AuditInput {
  action: AuditEvent;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  outsideTransaction?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}
export interface AuditRecorder {
  record(input: AuditInput): Promise<void>;
}
export const AUDIT_RECORDER = Symbol('AUDIT_RECORDER');
