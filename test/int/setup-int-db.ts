import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../src/shared/infrastructure/database/prisma/prisma.service';

/** Indica si hay base de pruebas configurada; los suites se omiten si no. */
export const hasIntDb = (): boolean => !!process.env.TEST_DATABASE_URL;

/**
 * Devuelve un PrismaService conectado a TEST_DATABASE_URL.
 * El llamador debe invocar `$disconnect()` al terminar.
 */
export function withIntDb(): PrismaService {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL no está definida');
  }
  process.env.DATABASE_URL = url;
  const loggerStub = {
    setContext: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    info: () => undefined,
  } as unknown as PinoLogger;
  return new PrismaService(loggerStub);
}
