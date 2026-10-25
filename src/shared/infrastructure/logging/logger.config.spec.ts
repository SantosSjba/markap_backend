import pino from 'pino';
import { validateEnvironment } from '../../../config/env.config';
import { serializeError } from './error.serializer';
import { createLoggerOptions } from './logger.config';

it('emite JSON estructurado y oculta credenciales, cuerpos y mensajes externos', () => {
  const lines: string[] = [];
  const logger = pino(
    createLoggerOptions({
      NODE_ENV: 'production',
      LOG_LEVEL: 'debug',
      APP_VERSION: 'test-build',
    }),
    {
      write: (line: string) => {
        lines.push(line);
      },
    },
  );
  logger.info(
    {
      context: 'Test',
      event: 'test.event',
      password: 'SECRET_PASSWORD',
      credentials: { secretKey: 'SECRET_STORAGE' },
      body: { email: 'SECRET_BODY' },
      req: {
        headers: { authorization: 'SECRET_AUTH' },
        body: { password: 'SECRET_NESTED' },
      },
    },
    'Evento de prueba',
  );
  const error = Object.assign(
    new Error('SECRET_ERROR\n    at SECRET_FORGED_FRAME'),
    { code: 'P2002' },
  );
  logger.error({ err: error }, 'Operación fallida');
  const records = lines.map(
    (line) => JSON.parse(line) as Record<string, unknown>,
  );
  expect(records[0]).toMatchObject({
    service: 'markap-api',
    environment: 'production',
    version: 'test-build',
    level: 'info',
    event: 'test.event',
    context: 'Test',
  });
  expect(records[1]).toMatchObject({
    level: 'error',
    event: 'application.log',
    err: { type: 'Error', code: 'P2002' },
  });
  expect(records[0].time).toEqual(expect.any(String));
  for (const value of [
    'SECRET_PASSWORD',
    'SECRET_STORAGE',
    'SECRET_BODY',
    'SECRET_AUTH',
    'SECRET_NESTED',
    'SECRET_ERROR',
    'SECRET_FORGED_FRAME',
  ])
    expect(lines.join('')).not.toContain(value);
});
it('usa JSON en producción y permite pretty solo fuera de producción', () => {
  expect(
    createLoggerOptions({ NODE_ENV: 'production', LOG_PRETTY: 'true' })
      .transport,
  ).toBeUndefined();
  expect(
    createLoggerOptions({ NODE_ENV: 'development', LOG_PRETTY: 'true' })
      .transport,
  ).toMatchObject({ target: 'pino-pretty' });
  expect(createLoggerOptions({ NODE_ENV: 'test' }).level).toBe('silent');
});
it('no serializa propiedades arbitrarias ni errores no tipados', () => {
  expect(serializeError({ password: 'SECRET' })).toEqual({
    type: 'UnknownError',
  });
  expect(
    serializeError(Object.assign(new Error('SECRET'), { password: 'SECRET' })),
  ).not.toHaveProperty('password');
});

it('identifica campos de configuración inválidos sin registrar sus valores', () => {
  try {
    validateEnvironment({ JWT_SECRET: 'SECRET_VALUE' });
  } catch (error) {
    expect(serializeError(error)).toMatchObject({
      type: 'EnvironmentValidationError',
      code: 'INVALID_CONFIGURATION',
      fields: expect.arrayContaining(['JWT_SECRET', 'DATABASE_URL']) as unknown,
    });
    expect(JSON.stringify(serializeError(error))).not.toContain('SECRET_VALUE');
  }
});
