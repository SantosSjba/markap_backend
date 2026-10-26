import { Prisma } from '@prisma/client';
import { isSensitiveField, MASK } from './audit-sensitive-fields';

const IGNORED_FIELDS = new Set(['updatedAt', 'updatedBy']);

export type FieldChanges = Record<string, { before: unknown; after: unknown }>;

/** Convierte Decimal, Date y bigint a string; recursivo sobre arrays y objetos. */
export function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toJsonSafe(v);
    }
    return out;
  }
  return value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = canonical((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

function serialize(value: unknown): string {
  const v = canonical(toJsonSafe(value));
  return v === undefined ? 'undefined' : JSON.stringify(v);
}

export function maskRecord(
  model: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = isSensitiveField(model, k) ? MASK : v;
  }
  return out;
}

export function diffRecords(
  model: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): FieldChanges {
  const changes: FieldChanges = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (serialize(before[key]) === serialize(after[key])) continue;
    const sensitive = isSensitiveField(model, key);
    changes[key] = {
      before: sensitive ? MASK : toJsonSafe(before[key]),
      after: sensitive ? MASK : toJsonSafe(after[key]),
    };
  }
  return changes;
}

export function classifyUpdate(
  changes: FieldChanges,
): 'UPDATE' | 'SOFT_DELETE' | 'RESTORE' {
  const change = changes.deletedAt;
  if (!change) return 'UPDATE';
  if (change.after !== null && change.after !== undefined) return 'SOFT_DELETE';
  if (change.before !== null && change.before !== undefined) return 'RESTORE';
  return 'UPDATE';
}
