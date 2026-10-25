import { EnvironmentValidationError } from '../../../config/env.config';
/** Conserva diagnóstico técnico sin copiar mensajes, consultas o valores del proveedor. */
export function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { type: 'UnknownError' };
  const code =
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Za-z0-9_-]{1,64}$/.test(error.code)
      ? error.code
      : undefined;
  const header = `${error.name}: ${error.message}`;
  const trace = error.stack?.startsWith(header)
    ? error.stack.slice(header.length)
    : undefined;
  const frames = trace
    ?.split('\n')
    .filter((line) => /^\s+at\s/.test(line))
    .slice(0, 20)
    .join('\n');
  return {
    type: error.name,
    ...(error instanceof EnvironmentValidationError
      ? { fields: error.invalidFields }
      : {}),
    ...(code ? { code } : {}),
    ...(frames ? { stack: frames } : {}),
  };
}
