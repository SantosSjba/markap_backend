import { Prisma } from '@prisma/client';
import {
  classifyUpdate,
  diffRecords,
  maskRecord,
  toJsonSafe,
} from './audit-diff';
import { isSensitiveField } from './audit-sensitive-fields';

describe('audit-diff', () => {
  it('maskRecord enmascara campos sensibles', () => {
    expect(maskRecord('User', { email: 'a@b.c', password: 'x' })).toEqual({
      email: 'a@b.c',
      password: '***',
    });
  });

  it('isSensitiveField usa mapa por modelo y patrón', () => {
    expect(isSensitiveField('PasswordResetCode', 'code')).toBe(true);
    expect(isSensitiveField('Role', 'code')).toBe(false);
    expect(isSensitiveField('X', 'apiKey')).toBe(true);
  });

  it('diffRecords enmascara campo sensible cambiado y omite el no cambiado', () => {
    expect(
      diffRecords(
        'User',
        { password: 'a', firstName: 'A' },
        { password: 'b', firstName: 'A' },
      ),
    ).toEqual({ password: { before: '***', after: '***' } });
    expect(diffRecords('User', { password: 'a' }, { password: 'a' })).toEqual(
      {},
    );
  });

  it('ignora updatedAt y updatedBy', () => {
    expect(
      diffRecords(
        'User',
        { updatedAt: new Date(1), updatedBy: 'a' },
        { updatedAt: new Date(2), updatedBy: 'b' },
      ),
    ).toEqual({});
  });

  it('no marca cambio entre Decimal equivalentes, Date iguales ni JSON reordenado', () => {
    expect(
      diffRecords(
        'M',
        {
          d: new Prisma.Decimal('10.50'),
          t: new Date('2026-01-01T00:00:00Z'),
          j: { a: 1, b: { c: 2, d: 3 } },
        },
        {
          d: new Prisma.Decimal('10.5'),
          t: new Date('2026-01-01T00:00:00Z'),
          j: { b: { d: 3, c: 2 }, a: 1 },
        },
      ),
    ).toEqual({});
  });

  it('detecta cambios reales y serializa valores', () => {
    expect(
      diffRecords(
        'M',
        { d: new Prisma.Decimal('1'), n: 1n },
        { d: new Prisma.Decimal('2'), n: 1n },
      ),
    ).toEqual({ d: { before: '1', after: '2' } });
    expect(toJsonSafe({ n: 5n, t: new Date(0) })).toEqual({
      n: '5',
      t: '1970-01-01T00:00:00.000Z',
    });
  });

  it('classifyUpdate', () => {
    expect(
      classifyUpdate({ deletedAt: { before: null, after: '2026-01-01' } }),
    ).toBe('SOFT_DELETE');
    expect(
      classifyUpdate({ deletedAt: { before: '2026-01-01', after: null } }),
    ).toBe('RESTORE');
    expect(
      classifyUpdate({
        deletedAt: { before: null, after: 'x' },
        name: { before: 'a', after: 'b' },
      }),
    ).toBe('SOFT_DELETE');
    expect(classifyUpdate({ name: { before: 'a', after: 'b' } })).toBe(
      'UPDATE',
    );
  });
});
