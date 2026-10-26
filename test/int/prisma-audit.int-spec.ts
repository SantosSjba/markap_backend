import { randomUUID } from 'node:crypto';
import {
  AuditContext,
  AuditContextData,
} from '../../src/shared/infrastructure/audit/audit-context';
import { PrismaService } from '../../src/shared/infrastructure/database/prisma/prisma.service';
import { hasIntDb, withIntDb } from './setup-int-db';

const suite = hasIntDb() ? describe : describe.skip;

type Snapshot = Record<string, unknown>;

suite('extensión de auditoría de Prisma', () => {
  let prisma: PrismaService;
  const createdRoleIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdClientIds: string[] = [];

  beforeAll(async () => {
    prisma = withIntDb();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.role.deleteMany({ where: { id: { in: createdRoleIds } } });
    await prisma.$disconnect();
  });

  function ctx(requestId: string): AuditContextData {
    return {
      userId: 'u-1',
      requestId,
      ip: '127.0.0.1',
      userAgent: 'jest',
      source: 'HTTP',
    };
  }

  /**
   * Ejecuta fn con un contexto HTTP y devuelve el requestId para filtrar logs.
   * El await va dentro de run(): las promesas de Prisma se ejecutan al esperarlas.
   */
  async function asUser<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; requestId: string }> {
    const requestId = randomUUID();
    const result = await AuditContext.run(
      ctx(requestId),
      async () => await fn(),
    );
    return { result, requestId };
  }

  function logsOf(requestId: string) {
    return prisma.auditLog.findMany({
      where: { requestId },
      orderBy: { occurredAt: 'asc' },
    });
  }

  async function newRole(suffix = '') {
    const code = `int-audit-${randomUUID()}${suffix}`;
    const role = await prisma.role.create({ data: { code, name: code } });
    createdRoleIds.push(role.id);
    return role;
  }

  it('create llena createdBy/updatedBy y registra CREATE con snapshot', async () => {
    const code = `int-audit-${randomUUID()}`;
    const { result: role, requestId } = await asUser(() =>
      prisma.role.create({ data: { code, name: code } }),
    );
    createdRoleIds.push(role.id);

    expect(role.createdBy).toBe('u-1');
    expect(role.updatedBy).toBe('u-1');
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: 'CREATE',
      tableName: 'roles',
      recordId: role.id,
      userId: 'u-1',
      source: 'HTTP',
      ip: '127.0.0.1',
      userAgent: 'jest',
    });
    expect((logs[0].snapshot as Snapshot).code).toBe(code);
    expect((logs[0].snapshot as Snapshot).createdBy).toBe('u-1');
  });

  it('create con select sin id devuelve solo lo pedido y el snapshot trae la fila completa', async () => {
    const code = `int-audit-${randomUUID()}`;
    const { result, requestId } = await asUser(() =>
      prisma.atomic(() =>
        prisma.role.create({
          data: { code, name: code },
          select: { code: true },
        }),
      ),
    );
    expect(result).toEqual({ code });
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    createdRoleIds.push(logs[0].recordId!);
    const snapshot = logs[0].snapshot as Snapshot;
    expect(snapshot).toMatchObject({ id: logs[0].recordId, code, name: code });
  });

  it('create respeta un createdBy ya informado', async () => {
    const code = `int-audit-${randomUUID()}`;
    const { result: role } = await asUser(() =>
      prisma.role.create({ data: { code, name: code, createdBy: 'other' } }),
    );
    createdRoleIds.push(role.id);
    expect(role.createdBy).toBe('other');
    expect(role.updatedBy).toBe('u-1');
  });

  it('update registra solo los campos cambiados en changes', async () => {
    const role = await newRole();
    const { result, requestId } = await asUser(() =>
      prisma.role.update({
        where: { id: role.id },
        data: { description: 'nueva' },
      }),
    );
    expect(result.updatedBy).toBe('u-1');
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: 'UPDATE',
      tableName: 'roles',
      recordId: role.id,
    });
    expect(logs[0].changes).toEqual({
      description: { before: null, after: 'nueva' },
    });
  });

  it('update sin cambios reales no registra nada', async () => {
    const role = await newRole();
    const { requestId } = await asUser(() =>
      prisma.role.update({
        where: { id: role.id },
        data: { name: role.name, updatedAt: new Date() },
      }),
    );
    expect(await logsOf(requestId)).toHaveLength(0);
  });

  it('update de deletedAt null→fecha registra SOFT_DELETE, y fecha→null registra RESTORE', async () => {
    const role = await newRole();
    const { requestId: softId } = await asUser(() =>
      prisma.role.update({
        where: { id: role.id },
        data: { deletedAt: new Date() },
      }),
    );
    const { requestId: restoreId } = await asUser(() =>
      prisma.role.update({ where: { id: role.id }, data: { deletedAt: null } }),
    );
    expect((await logsOf(softId)).map((l) => l.action)).toEqual([
      'SOFT_DELETE',
    ]);
    expect((await logsOf(restoreId)).map((l) => l.action)).toEqual(['RESTORE']);
  });

  it('delete registra DELETE con snapshot del antes', async () => {
    const role = await newRole();
    const { requestId } = await asUser(() =>
      prisma.role.delete({ where: { id: role.id } }),
    );
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'DELETE', recordId: role.id });
    expect((logs[0].snapshot as Snapshot).code).toBe(role.code);
  });

  it('updateMany y deleteMany registran una fila por registro afectado', async () => {
    const tag = randomUUID();
    const a = await newRole(`-${tag}-a`);
    const b = await newRole(`-${tag}-b`);
    const whereTag = { code: { contains: tag } };

    const { result: updated, requestId: updId } = await asUser(() =>
      prisma.role.updateMany({
        where: whereTag,
        data: { description: 'masivo' },
      }),
    );
    expect(updated).toEqual({ count: 2 });
    const updLogs = await logsOf(updId);
    expect(updLogs.map((l) => l.action)).toEqual(['UPDATE', 'UPDATE']);
    expect(updLogs.map((l) => l.recordId).sort()).toEqual([a.id, b.id].sort());
    expect(updLogs[0].changes).toEqual({
      description: { before: null, after: 'masivo' },
    });
    const rows = await prisma.role.findMany({ where: whereTag });
    expect(rows.every((r) => r.updatedBy === 'u-1')).toBe(true);

    const { result: deleted, requestId: delId } = await asUser(() =>
      prisma.role.deleteMany({ where: whereTag }),
    );
    expect(deleted).toEqual({ count: 2 });
    const delLogs = await logsOf(delId);
    expect(delLogs.map((l) => l.action)).toEqual(['DELETE', 'DELETE']);
    expect(delLogs.map((l) => l.recordId).sort()).toEqual([a.id, b.id].sort());
  });

  it('createMany devuelve { count } y registra una fila CREATE por registro', async () => {
    const tag = randomUUID();
    const { result, requestId } = await asUser(() =>
      prisma.role.createMany({
        data: [1, 2].map((i) => ({
          code: `int-audit-${tag}-${i}`,
          name: `int-audit-${tag}-${i}`,
        })),
      }),
    );
    expect(result).toEqual({ count: 2 });
    const rows = await prisma.role.findMany({
      where: { code: { contains: tag } },
    });
    createdRoleIds.push(...rows.map((r) => r.id));
    expect(rows.every((r) => r.createdBy === 'u-1')).toBe(true);
    const logs = await logsOf(requestId);
    expect(logs.map((l) => l.action)).toEqual(['CREATE', 'CREATE']);
  });

  it('updateMany sobre más de 1000 filas registra una sola fila resumen con metadata.count', async () => {
    const tag = randomUUID();
    await prisma.role.createMany({
      data: Array.from({ length: 1001 }, (_, i) => ({
        code: `int-audit-${tag}-${i}`,
        name: `int-audit-${tag}-${i}`,
      })),
    });
    const whereTag = { code: { contains: tag } };
    try {
      const { result, requestId } = await asUser(() =>
        prisma.role.updateMany({
          where: whereTag,
          data: { description: 'bulk' },
        }),
      );
      expect(result).toEqual({ count: 1001 });
      const logs = await logsOf(requestId);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        action: 'UPDATE',
        tableName: 'roles',
        recordId: null,
      });
      expect(logs[0].metadata).toEqual({ count: 1001, where: whereTag });
    } finally {
      await prisma.role.deleteMany({ where: whereTag });
    }
  });

  it('upsert registra CREATE si no existía y UPDATE si existía', async () => {
    const code = `int-audit-${randomUUID()}`;
    const upsert = (description: string) =>
      prisma.role.upsert({
        where: { code },
        create: { code, name: code, description },
        update: { description },
      });
    const { result: created, requestId: c } = await asUser(() => upsert('uno'));
    createdRoleIds.push(created.id);
    expect(created.createdBy).toBe('u-1');
    const { requestId: u } = await asUser(() => upsert('dos'));
    const createLogs = await logsOf(c);
    expect(createLogs.map((l) => l.action)).toEqual(['CREATE']);
    expect(createLogs[0].recordId).toBe(created.id);
    const updateLogs = await logsOf(u);
    expect(updateLogs.map((l) => l.action)).toEqual(['UPDATE']);
    expect(updateLogs[0].changes).toEqual({
      description: { before: 'uno', after: 'dos' },
    });
  });

  it('copia applicationId del registro a audit_logs.application_id', async () => {
    const app = await prisma.application.findFirstOrThrow();
    const docType = await prisma.documentType.findFirstOrThrow();
    const { result: client, requestId } = await asUser(() =>
      prisma.client.create({
        data: {
          applicationId: app.id,
          clientType: 'OWNER',
          documentTypeId: docType.id,
          documentNumber: randomUUID().slice(0, 12),
          fullName: 'Cliente Auditoría',
          primaryPhone: '999999999',
        },
      }),
    );
    createdClientIds.push(client.id);
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: 'CREATE',
      tableName: 'clients',
      applicationId: app.id,
    });
  });

  it('un error dentro de atomic() tras la escritura revierte el cambio y el log', async () => {
    const code = `int-audit-${randomUUID()}`;
    const requestId = randomUUID();
    await expect(
      AuditContext.run(ctx(requestId), () =>
        prisma.atomic(async () => {
          await prisma.role.create({ data: { code, name: code } });
          throw new Error('falla después de escribir');
        }),
      ),
    ).rejects.toThrow('falla después de escribir');
    expect(await prisma.role.findUnique({ where: { code } })).toBeNull();
    expect(await logsOf(requestId)).toHaveLength(0);
  });

  it('un error dentro de $transaction(callback) revierte el cambio y el log', async () => {
    const code = `int-audit-${randomUUID()}`;
    const requestId = randomUUID();
    await expect(
      AuditContext.run(ctx(requestId), async () =>
        prisma.$transaction(async (tx) => {
          await tx.role.create({ data: { code, name: code } });
          throw new Error('falla en callback');
        }),
      ),
    ).rejects.toThrow('falla en callback');
    expect(await prisma.role.findUnique({ where: { code } })).toBeNull();
    expect(await logsOf(requestId)).toHaveLength(0);
  });

  it('$transaction en forma array audita cada operación', async () => {
    const a = await newRole();
    const b = await newRole();
    const { result, requestId } = await asUser(() =>
      prisma.$transaction([
        prisma.role.update({ where: { id: a.id }, data: { description: 'a' } }),
        prisma.role.update({ where: { id: b.id }, data: { description: 'b' } }),
      ]),
    );
    expect(result.map((r) => r.description)).toEqual(['a', 'b']);
    const logs = await logsOf(requestId);
    expect(logs.map((l) => l.recordId).sort()).toEqual([a.id, b.id].sort());
  });

  it('actualizar User.password guarda changes.password = { before: "***", after: "***" }', async () => {
    const email = `int-audit-${randomUUID()}@test.local`;
    const user = await prisma.user.create({
      data: { email, password: 'hash-1', firstName: 'A', lastName: 'B' },
    });
    createdUserIds.push(user.id);
    const { requestId } = await asUser(() =>
      prisma.user.update({
        where: { id: user.id },
        data: { password: 'hash-2' },
      }),
    );
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    expect(logs[0].changes).toEqual({
      password: { before: '***', after: '***' },
    });
    expect(JSON.stringify(logs)).not.toContain('hash-');
  });

  it('escribir en Notification no genera log', async () => {
    const email = `int-audit-${randomUUID()}@test.local`;
    const user = await prisma.user.create({
      data: { email, password: 'x', firstName: 'A', lastName: 'B' },
    });
    createdUserIds.push(user.id);
    const { result: n, requestId } = await asUser(() =>
      prisma.notification.create({
        data: { userId: user.id, type: 'TEST', title: 'hola' },
      }),
    );
    await prisma.notification.delete({ where: { id: n.id } });
    expect(await logsOf(requestId)).toHaveLength(0);
    expect(await prisma.auditLog.count({ where: { recordId: n.id } })).toBe(0);
  });

  it('fuera de contexto registra source SYSTEM y userId null', async () => {
    const role = await newRole();
    const logs = await prisma.auditLog.findMany({
      where: { recordId: role.id, action: 'CREATE' },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      source: 'SYSTEM',
      userId: null,
      requestId: null,
    });
    expect(role.createdBy).toBeNull();
  });

  it('create con escrituras anidadas registra una fila para el modelo raíz', async () => {
    const app = await prisma.application.findFirstOrThrow();
    const code = `int-audit-${randomUUID()}`;
    const { result: role, requestId } = await asUser(() =>
      prisma.role.create({
        data: {
          code,
          name: code,
          roleApplications: { create: [{ applicationId: app.id }] },
        },
      }),
    );
    createdRoleIds.push(role.id);
    const logs = await logsOf(requestId);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'CREATE', tableName: 'roles' });
    const snapshot = logs[0].snapshot as Snapshot;
    expect(snapshot.code).toBe(code);
    expect(snapshot.roleApplications).toEqual({
      create: [{ applicationId: app.id }],
    });
  });
});
