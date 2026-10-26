import { Prisma } from '@prisma/client';
import type { PrismaService } from '../database/prisma/prisma.service';
import { AuditContext } from './audit-context';
import {
  classifyUpdate,
  diffRecords,
  FieldChanges,
  maskRecord,
  toJsonSafe,
} from './audit-diff';
import { isSensitiveField, MASK } from './audit-sensitive-fields';

/** Modelos que el gancho no audita (recursión, bitácoras propias o datos efímeros). */
export const AUDIT_EXCLUDED_MODELS: ReadonlySet<string> = new Set([
  'AuditLog',
  'ContabilidadAuditLog',
  'Notification',
  'PasswordResetCode',
]);

/** Sobre este número de filas, un `*Many` registra una sola fila resumen. */
export const AUDIT_BULK_SUMMARY_THRESHOLD = 1000;

type Row = Record<string, unknown>;
type Args = Record<string, unknown>;
type Delegate = Record<string, (args: Args) => Promise<unknown>>;
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE';

interface ModelMeta {
  tableName: string;
  scalars: ReadonlySet<string>;
  /** Campo de relación → modelo destino, para enmascarar escrituras anidadas. */
  relations: ReadonlyMap<string, string>;
  hasId: boolean;
}

/** Metadatos por modelo, leídos de Prisma.dmmf una sola vez. */
const MODEL_META: ReadonlyMap<string, ModelMeta> = new Map(
  Prisma.dmmf.datamodel.models.map((m) => [
    m.name,
    {
      tableName: m.dbName ?? m.name,
      scalars: new Set(
        m.fields.filter((f) => f.kind !== 'object').map((f) => f.name),
      ),
      relations: new Map(
        m.fields
          .filter((f) => f.kind === 'object')
          .map((f) => [f.name, f.type]),
      ),
      hasId: m.fields.some((f) => f.name === 'id' && f.kind === 'scalar'),
    },
  ]),
);

interface HookParams {
  model: string;
  operation: string;
  args: Args;
  query: (args: Args) => Promise<unknown>;
}

interface OpContext {
  service: PrismaService;
  model: string;
  meta: ModelMeta;
  args: Args;
  query: (args: Args) => Promise<unknown>;
  delegate: Delegate;
}

const accessorOf = (model: string) =>
  model.charAt(0).toLowerCase() + model.slice(1);

function delegateOf(service: PrismaService, model: string): Delegate {
  return (service as unknown as Record<string, Delegate>)[accessorOf(model)];
}

function isPlainObject(value: unknown): value is Row {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !Prisma.Decimal.isDecimal(value)
  );
}

function scalarsOf(meta: ModelMeta, row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) if (meta.scalars.has(k)) out[k] = v;
  return out;
}

/** Enmascara recursivamente, siguiendo las relaciones para saber el modelo de cada nivel. */
function maskDeep(model: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => maskDeep(model, v));
  if (!isPlainObject(value)) return toJsonSafe(value);
  const relations = MODEL_META.get(model)?.relations;
  const out: Row = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = isSensitiveField(model, k)
      ? MASK
      : maskDeep(relations?.get(k) ?? model, v);
  }
  return out;
}

/** Escrituras anidadas (`items: { create: [...] }`) del data, ya enmascaradas. */
function nestedWritesOf(model: string, meta: ModelMeta, data: unknown): Row {
  const out: Row = {};
  if (!isPlainObject(data)) return out;
  for (const [k, v] of Object.entries(data)) {
    const target = meta.relations.get(k);
    if (target && v !== undefined) out[k] = maskDeep(target, v);
  }
  return out;
}

function snapshotOf(model: string, meta: ModelMeta, row: Row, data?: unknown) {
  return {
    ...(toJsonSafe(maskRecord(model, scalarsOf(meta, row))) as Row),
    ...nestedWritesOf(model, meta, data),
  };
}

function changesOf(
  model: string,
  meta: ModelMeta,
  before: Row,
  after: Row,
  data: unknown,
): FieldChanges {
  const changes = diffRecords(
    model,
    scalarsOf(meta, before),
    scalarsOf(meta, after),
  );
  for (const [k, v] of Object.entries(nestedWritesOf(model, meta, data)))
    changes[k] = { before: null, after: v };
  return changes;
}

function recordIdOf(meta: ModelMeta, row: Row, where?: unknown): string {
  if (meta.hasId) return String(row.id);
  return JSON.stringify(toJsonSafe(where ?? scalarsOf(meta, row)));
}

function applicationIdOf(meta: ModelMeta, ...rows: (Row | null)[]) {
  if (!meta.scalars.has('applicationId')) return null;
  for (const row of rows) {
    const value = row?.applicationId;
    if (typeof value === 'string') return value;
  }
  return null;
}

function entry(
  model: string,
  meta: ModelMeta,
  action: AuditAction,
  fields: {
    recordId?: string | null;
    applicationId?: string | null;
    changes?: unknown;
    snapshot?: unknown;
    metadata?: unknown;
  },
): Prisma.AuditLogCreateManyInput {
  const ctx = AuditContext.get();
  return {
    userId: ctx.userId,
    requestId: ctx.requestId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    source: ctx.source,
    action,
    tableName: meta.tableName,
    recordId: fields.recordId ?? null,
    applicationId: fields.applicationId ?? null,
    changes: fields.changes as Prisma.InputJsonValue | undefined,
    snapshot: fields.snapshot as Prisma.InputJsonValue | undefined,
    metadata: fields.metadata as Prisma.InputJsonValue | undefined,
  };
}

async function writeLogs(
  service: PrismaService,
  entries: Prisma.AuditLogCreateManyInput[],
) {
  if (entries.length) await service.auditLog.createMany({ data: entries });
}

/** createdBy/updatedBy solo si el modelo los tiene y no vienen informados. */
function withTrace(meta: ModelMeta, data: unknown, onCreate: boolean): unknown {
  if (Array.isArray(data)) return data.map((d) => withTrace(meta, d, onCreate));
  if (!isPlainObject(data)) return data;
  const { userId } = AuditContext.get();
  const out: Row = { ...data };
  if (onCreate && meta.scalars.has('createdBy') && out.createdBy === undefined)
    out.createdBy = userId;
  if (meta.scalars.has('updatedBy') && out.updatedBy === undefined)
    out.updatedBy = userId;
  return out;
}

/**
 * Con `select`/`omit` el resultado no trae la fila completa: se fuerza el `id`
 * en el select (y se quita al devolver) y la fila se relee por id.
 */
function prepareRead(meta: ModelMeta, args: Args) {
  const partial = args.select !== undefined || args.omit !== undefined;
  const select = args.select as Row | undefined;
  const addedId = !!select && meta.hasId && !select.id;
  const queryArgs = addedId
    ? { ...args, select: { ...select, id: true } }
    : args;
  return { partial, addedId, queryArgs };
}

function stripId<T>(result: T, addedId: boolean): T {
  if (!addedId) return result;
  const strip = (r: unknown) => {
    if (isPlainObject(r)) delete r.id;
  };
  if (Array.isArray(result)) result.forEach(strip);
  else strip(result);
  return result;
}

async function fullRow(
  op: OpContext,
  result: Row,
  partial: boolean,
): Promise<Row> {
  if (!partial || !op.meta.hasId) return result;
  const row = await op.delegate.findUnique({ where: { id: result.id } });
  return (row as Row | null) ?? result;
}

async function fullRows(
  op: OpContext,
  ids: unknown[],
): Promise<Map<string, Row>> {
  const rows = (await op.delegate.findMany({
    where: { id: { in: ids } },
  })) as Row[];
  return new Map(rows.map((r) => [String(r.id as string), r]));
}

async function onCreate(op: OpContext) {
  const { model, meta, args } = op;
  const data = withTrace(meta, args.data, true);
  const { partial, addedId, queryArgs } = prepareRead(meta, { ...args, data });
  const result = (await op.query(queryArgs)) as Row;
  const row = await fullRow(op, result, partial);
  await writeLogs(op.service, [
    entry(model, meta, 'CREATE', {
      recordId: recordIdOf(meta, row),
      applicationId: applicationIdOf(meta, row),
      snapshot: snapshotOf(model, meta, row, args.data),
    }),
  ]);
  return stripId(result, addedId);
}

async function onCreateManyAndReturn(op: OpContext) {
  const { model, meta, args } = op;
  const data = withTrace(meta, args.data, true);
  const { partial, addedId, queryArgs } = prepareRead(meta, { ...args, data });
  const result = (await op.query(queryArgs)) as Row[];
  const byId =
    partial && meta.hasId
      ? await fullRows(
          op,
          result.map((r) => r.id),
        )
      : null;
  const rows = result.map((r) => byId?.get(String(r.id as string)) ?? r);
  await writeLogs(
    op.service,
    rows.map((row) =>
      entry(model, meta, 'CREATE', {
        recordId: recordIdOf(meta, row),
        applicationId: applicationIdOf(meta, row),
        snapshot: snapshotOf(model, meta, row),
      }),
    ),
  );
  return stripId(result, addedId);
}

/** Se ejecuta como createManyAndReturn (que audita cada fila) y devuelve `{ count }`. */
async function onCreateMany(op: OpContext) {
  const rows = (await op.delegate.createManyAndReturn(op.args)) as Row[];
  return { count: rows.length };
}

function updateEntry(
  op: OpContext,
  before: Row,
  after: Row,
  data: unknown,
  where?: unknown,
): Prisma.AuditLogCreateManyInput | null {
  const { model, meta } = op;
  const changes = changesOf(model, meta, before, after, data);
  if (!Object.keys(changes).length) return null;
  return entry(model, meta, classifyUpdate(changes), {
    recordId: recordIdOf(meta, after, where),
    applicationId: applicationIdOf(meta, after, before),
    changes,
  });
}

async function onUpdate(op: OpContext) {
  const { meta, args } = op;
  const before = (await op.delegate.findUnique({
    where: args.where,
  })) as Row | null;
  if (!before) return op.query(args);
  const data = withTrace(meta, args.data, false);
  const { partial, addedId, queryArgs } = prepareRead(meta, { ...args, data });
  const result = (await op.query(queryArgs)) as Row;
  const after = await fullRow(op, result, partial);
  const log = updateEntry(op, before, after, args.data, args.where);
  if (log) await writeLogs(op.service, [log]);
  return stripId(result, addedId);
}

async function onUpsert(op: OpContext) {
  const { model, meta, args } = op;
  const before = (await op.delegate.findUnique({
    where: args.where,
  })) as Row | null;
  const { partial, addedId, queryArgs } = prepareRead(meta, {
    ...args,
    create: withTrace(meta, args.create, true),
    update: withTrace(meta, args.update, false),
  });
  const result = (await op.query(queryArgs)) as Row;
  const after = await fullRow(op, result, partial);
  const log = before
    ? updateEntry(op, before, after, args.update, args.where)
    : entry(model, meta, 'CREATE', {
        recordId: recordIdOf(meta, after, args.where),
        applicationId: applicationIdOf(meta, after),
        snapshot: snapshotOf(model, meta, after, args.create),
      });
  if (log) await writeLogs(op.service, [log]);
  return stripId(result, addedId);
}

async function onDelete(op: OpContext) {
  const { model, meta, args } = op;
  const before = (await op.delegate.findUnique({
    where: args.where,
  })) as Row | null;
  const result = await op.query(args);
  if (before)
    await writeLogs(op.service, [
      entry(model, meta, 'DELETE', {
        recordId: recordIdOf(meta, before, args.where),
        applicationId: applicationIdOf(meta, before),
        snapshot: snapshotOf(model, meta, before),
      }),
    ]);
  return result;
}

/**
 * Lee las filas afectadas por un `*Many` (como mucho umbral + 1). Con `limit`
 * la escritura se restringe a los ids leídos, para auditar exactamente esas filas.
 */
async function affectedRows(op: OpContext) {
  const { args, meta } = op;
  const limit = typeof args.limit === 'number' ? args.limit : undefined;
  const take =
    limit !== undefined
      ? Math.min(limit, AUDIT_BULK_SUMMARY_THRESHOLD + 1)
      : AUDIT_BULK_SUMMARY_THRESHOLD + 1;
  const rows = (await op.delegate.findMany({
    where: args.where,
    take,
  })) as Row[];
  let writeArgs = args;
  if (
    limit !== undefined &&
    limit <= AUDIT_BULK_SUMMARY_THRESHOLD &&
    meta.hasId
  ) {
    const { limit: _limit, ...rest } = args;
    void _limit;
    writeArgs = {
      ...rest,
      where: { AND: [args.where ?? {}, { id: { in: rows.map((r) => r.id) } }] },
    };
  }
  return {
    rows,
    writeArgs,
    bulk: rows.length > AUDIT_BULK_SUMMARY_THRESHOLD,
  };
}

function countOf(result: unknown): number {
  if (Array.isArray(result)) return result.length;
  return (result as { count: number }).count;
}

function summaryEntry(op: OpContext, action: AuditAction, count: number) {
  return entry(op.model, op.meta, action, {
    metadata: { count, where: maskDeep(op.model, op.args.where ?? {}) },
  });
}

async function onUpdateMany(op: OpContext) {
  const { meta } = op;
  const { rows, writeArgs, bulk } = await affectedRows(op);
  const result = await op.query({
    ...writeArgs,
    data: withTrace(meta, op.args.data, false),
  });
  if (bulk) {
    await writeLogs(op.service, [summaryEntry(op, 'UPDATE', countOf(result))]);
    return result;
  }
  if (!rows.length) return result;
  if (!meta.hasId) {
    // Sin id no se puede releer cada fila: una fila resumen.
    await writeLogs(op.service, [summaryEntry(op, 'UPDATE', countOf(result))]);
    return result;
  }
  const afterById = await fullRows(
    op,
    rows.map((r) => r.id),
  );
  const logs = rows
    .map((before) => {
      const after = afterById.get(String(before.id));
      return after ? updateEntry(op, before, after, undefined) : null;
    })
    .filter((l): l is Prisma.AuditLogCreateManyInput => l !== null);
  await writeLogs(op.service, logs);
  return result;
}

async function onDeleteMany(op: OpContext) {
  const { model, meta } = op;
  const { rows, writeArgs, bulk } = await affectedRows(op);
  const result = await op.query(writeArgs);
  if (bulk) {
    await writeLogs(op.service, [summaryEntry(op, 'DELETE', countOf(result))]);
    return result;
  }
  await writeLogs(
    op.service,
    rows.map((before) =>
      entry(model, meta, 'DELETE', {
        recordId: recordIdOf(meta, before),
        applicationId: applicationIdOf(meta, before),
        snapshot: snapshotOf(model, meta, before),
      }),
    ),
  );
  return result;
}

const HANDLERS: Record<string, (op: OpContext) => Promise<unknown>> = {
  create: onCreate,
  createMany: onCreateMany,
  createManyAndReturn: onCreateManyAndReturn,
  update: onUpdate,
  updateMany: onUpdateMany,
  updateManyAndReturn: onUpdateMany,
  upsert: onUpsert,
  delete: onDelete,
  deleteMany: onDeleteMany,
};

/**
 * Extensión `$extends` que audita toda escritura de modelo: completa
 * createdBy/updatedBy y escribe en `audit_logs` dentro de la misma transacción.
 * Fuera de una transacción, reabre la operación dentro de `service.atomic()`;
 * al reentrar, todas las lecturas y el log van por `service`, que el Proxy
 * dirige a la transacción ambiente.
 *
 * Límites conocidos: las escrituras anidadas se registran solo en la fila del
 * modelo raíz (con los datos anidados en snapshot/changes); el SQL crudo no
 * se audita.
 */
export function createAuditExtension(service: PrismaService) {
  const hook = ({ model, operation, args, query }: HookParams) => {
    const meta = MODEL_META.get(model);
    const handler = HANDLERS[operation];
    if (!meta || !handler || AUDIT_EXCLUDED_MODELS.has(model))
      return query(args);
    if (!service.inTransaction())
      return service.atomic(() => delegateOf(service, model)[operation](args));
    return handler({
      service,
      model,
      meta,
      args: args ?? {},
      query,
      delegate: delegateOf(service, model),
    });
  };
  return Prisma.defineExtension({
    name: 'audit',
    query: {
      $allModels: {
        create: hook,
        createMany: hook,
        createManyAndReturn: hook,
        update: hook,
        updateMany: hook,
        updateManyAndReturn: hook,
        upsert: hook,
        delete: hook,
        deleteMany: hook,
      },
    },
  });
}
