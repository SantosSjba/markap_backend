import type { PrismaService } from '../../../../shared/infrastructure/database/prisma/prisma.service';
import { PeriodTransactionAdapter } from './period-transaction.adapter';

it('bloquea el periodo dentro de la transacción antes de ejecutar el cierre', async () => {
  const events: string[] = [];
  const prisma = {
    atomic: jest.fn(async (work: () => Promise<unknown>) => {
      events.push('begin');
      const result = await work();
      events.push('commit');
      return result;
    }),
    $queryRaw: jest.fn((_parts: TemplateStringsArray, id: string) => {
      events.push(`lock:${id}`);
      return Promise.resolve();
    }),
  };
  const adapter = new PeriodTransactionAdapter(
    prisma as unknown as PrismaService,
  );
  await expect(
    adapter.withLockedPeriod('period-1', () => {
      events.push('close');
      return Promise.resolve(7);
    }),
  ).resolves.toBe(7);
  expect(events).toEqual(['begin', 'lock:period-1', 'close', 'commit']);
});

it('propaga el fallo de cierre a la transacción sin confirmar un resultado parcial', async () => {
  const prisma = {
    atomic: jest.fn(async (work: () => Promise<unknown>) => work()),
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  const adapter = new PeriodTransactionAdapter(
    prisma as unknown as PrismaService,
  );
  const failure = new Error('regularization failed');
  await expect(
    adapter.withLockedPeriod('period-1', () => Promise.reject(failure)),
  ).rejects.toBe(failure);
});
