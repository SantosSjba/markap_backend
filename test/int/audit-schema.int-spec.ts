import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../src/shared/infrastructure/database/prisma/prisma.service';
import { hasIntDb, withIntDb } from './setup-int-db';

const suite = hasIntDb() ? describe : describe.skip;

suite('audit_logs (esquema)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = withIntDb();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function insertRow(): Promise<string> {
    const id = randomUUID();
    await prisma.auditLog.create({
      data: { id, action: 'CREATE', source: 'SYSTEM', tableName: 'int_test' },
    });
    return id;
  }

  it('rechaza UPDATE sobre audit_logs', async () => {
    const id = await insertRow();
    await expect(
      prisma.auditLog.update({ where: { id }, data: { action: 'DELETE' } }),
    ).rejects.toThrow('audit_logs es inmutable');
  });

  it('rechaza DELETE sobre audit_logs', async () => {
    const id = await insertRow();
    await expect(prisma.auditLog.delete({ where: { id } })).rejects.toThrow(
      'audit_logs es inmutable',
    );
  });
});
