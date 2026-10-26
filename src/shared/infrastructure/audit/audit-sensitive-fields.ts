/** Campos sensibles explícitos por modelo Prisma (nunca se guardan en claro en audit_logs). */
export const SENSITIVE_FIELDS_BY_MODEL: Record<string, string[]> = {
  PasswordResetCode: ['code'],
  ContabilidadSolCredentials: ['solPasswordEnc', 'solPasswordHint'],
  ContabilidadCpeProviderConfig: [
    'apiTokenEnc',
    'apiTokenHint',
    'certificateHint',
  ],
};

export const SENSITIVE_NAME_PATTERN =
  /password|secret|token|apikey|certificate/i;

export const MASK = '***';

export function isSensitiveField(model: string, field: string): boolean {
  return (
    SENSITIVE_NAME_PATTERN.test(field) ||
    (SENSITIVE_FIELDS_BY_MODEL[model]?.includes(field) ?? false)
  );
}
