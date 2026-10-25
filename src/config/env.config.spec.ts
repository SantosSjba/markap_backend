import { validateEnvironment } from './env.config';
const valid = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/test',
  JWT_SECRET: 'test-secret-at-least-16-characters',
  FRONTEND_URL: 'http://localhost:5173',
  MINIO_ENDPOINT: 'http://localhost:9000',
  MINIO_ACCESS_KEY: 'test-access',
  MINIO_SECRET_KEY: 'test-secret',
};
it('aplica valores por defecto y convierte números y booleanos del entorno', () => {
  const result = validateEnvironment({
    ...valid,
    PORT: '4001',
    MINIO_USE_SSL: 'false',
  });
  expect(result.PORT).toBe(4001);
  expect(result.MINIO_USE_SSL).toBe(false);
  expect(result.JWT_EXPIRES_IN).toBe(3600);
});
it('rechaza puertos inválidos y no expone secretos en los mensajes', () => {
  expect(() =>
    validateEnvironment({
      ...valid,
      PORT: 'invalid',
      JWT_SECRET: 'private-value',
    }),
  ).toThrow('PORT');
  try {
    validateEnvironment({ ...valid, JWT_SECRET: 'private-value' });
  } catch (error) {
    expect((error as Error).message).not.toContain('private-value');
  }
});

it('rechaza niveles desconocidos y salida pretty en producción', () => {
  expect(() => validateEnvironment({ ...valid, LOG_LEVEL: 'invalid' })).toThrow(
    'LOG_LEVEL',
  );
  expect(() =>
    validateEnvironment({
      ...valid,
      NODE_ENV: 'production',
      LOG_PRETTY: 'true',
    }),
  ).toThrow('LOG_PRETTY');
  expect(
    validateEnvironment({ ...valid, LOG_PRETTY: 'false' }).LOG_PRETTY,
  ).toBe(false);
});

it('valida límites y temporizadores sin permitir ventanas inválidas o desbordadas', () => {
  for (const invalid of [
    { AUTH_LOGIN_LIMIT: '0' },
    { AUTH_LOGIN_TTL_MS: '-1' },
    { AUTH_RESET_PASSWORD_TTL_MS: '2147483648' },
    { RENTAL_ALERTS_INTERVAL_MS: '2147483648' },
    { RENTAL_ALERTS_ENABLED: 'maybe' },
  ])
    expect(() => validateEnvironment({ ...valid, ...invalid })).toThrow();
  expect(
    validateEnvironment({ ...valid, RENTAL_ALERTS_ENABLED: 'false' })
      .RENTAL_ALERTS_ENABLED,
  ).toBe(false);
});
it('solo permite proxies explícitos o la desactivación de confianza', () => {
  for (const proxy of [
    'false',
    'loopback',
    '127.0.0.1',
    '172.18.0.0/16',
    '::1',
    'fd00::/64',
    '127.0.0.1,172.18.0.0/16',
  ])
    expect(() =>
      validateEnvironment({ ...valid, TRUST_PROXY: proxy }),
    ).not.toThrow();
  for (const proxy of [
    'true',
    '*',
    '0.0.0.0/0',
    '172.18.0.0/99',
    '::/0',
    '123',
    '',
  ])
    expect(() => validateEnvironment({ ...valid, TRUST_PROXY: proxy })).toThrow(
      'TRUST_PROXY',
    );
});
