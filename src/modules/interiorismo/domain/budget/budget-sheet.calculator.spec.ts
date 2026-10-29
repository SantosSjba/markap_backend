import fs from 'node:fs';
import path from 'node:path';
import {
  computeBudgetSheet,
  type BudgetHeaderInput,
  type BudgetRowInput,
} from './budget-sheet.calculator';

/** Valores numéricos de los Excel de la clienta (Markap Spaces 2.0 y PRIZE). */
const fixture = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../../../../../test/fixtures/interior-budget-excel.json',
    ),
    'utf8',
  ),
) as {
  markapSpaces: Record<
    'implementacion' | 'jacuzzi',
    {
      utilityPct: number;
      igvPct: number;
      expected: Record<string, number>;
      items: [number, number][];
    }
  >;
  prize: {
    utilityPct: number;
    overheadPct: number;
    exchangeRate: number;
    expected: Record<string, number>;
    groups: {
      code: string;
      expectedTotal: number;
      items: [number | null, number | null, number | null][];
    }[];
  };
};

const header = (over: Partial<BudgetHeaderInput> = {}): BudgetHeaderInput => ({
  currency: 'PEN',
  exchangeRate: null,
  marginMode: 'PER_LINE',
  utilityPct: 20,
  overheadPct: 0,
  igvMode: 'PER_LINE',
  igvPct: 18,
  ...over,
});

let seq = 0;
const row = (over: Partial<BudgetRowInput>): BudgetRowInput => ({
  id: `r${++seq}`,
  parentId: null,
  sortOrder: seq,
  kind: 'ITEM',
  code: null,
  description: '',
  unit: null,
  quantity: null,
  unitPrice: null,
  directCost: null,
  actualCost: null,
  utilityPctOverride: null,
  hasIgv: false,
  supplierPaymentsTotal: 0,
  ...over,
});

const round2 = (n: number) => Math.round(n * 100) / 100;

describe('computeBudgetSheet — Excel Markap Spaces (utilidad por línea)', () => {
  it('implementación casa: costo, utilidad 20% y precio iguales al Excel', () => {
    const { implementacion: x } = fixture.markapSpaces;
    const sheet = computeBudgetSheet(
      header({ utilityPct: x.utilityPct, igvPct: x.igvPct }),
      x.items.map(([cost, igv]) =>
        row({ directCost: cost, hasIgv: igv === 1 }),
      ),
    );
    expect(sheet.totals.directCost).toBe(x.expected.cost);
    expect(sheet.totals.utility).toBe(round2(x.expected.utility));
    expect(sheet.totals.igv).toBe(0);
    expect(sheet.totals.total).toBe(x.expected.price);
  });

  it('jacuzzi: IGV 18% por línea sobre el total de cada partida', () => {
    const { jacuzzi: x } = fixture.markapSpaces;
    const sheet = computeBudgetSheet(
      header(),
      x.items.map(([cost, igv]) =>
        row({ directCost: cost, hasIgv: igv === 1 }),
      ),
    );
    expect(sheet.totals.directCost).toBe(x.expected.cost);
    expect(sheet.totals.utility).toBe(x.expected.utility);
    expect(sheet.totals.igv).toBe(round2(x.expected.igv));
    expect(sheet.totals.total).toBe(x.expected.price);
    expect(sheet.rows[0]).toMatchObject({
      cost: 4500,
      utility: 900,
      igv: 972,
      price: 6372,
    });
  });

  it('una partida puede tener su propio % de utilidad', () => {
    const sheet = computeBudgetSheet(header(), [
      row({ directCost: 100, utilityPctOverride: 10 }),
      row({ directCost: 100 }),
    ]);
    expect(sheet.rows.map((r) => r.price)).toEqual([110, 120]);
  });
});

describe('computeBudgetSheet — Excel PRIZE (metrado × P.U., GG + utilidad global)', () => {
  const p = fixture.prize;
  const buildRows = () => {
    const rows: BudgetRowInput[] = [];
    p.groups.forEach((g, gi) => {
      const group = row({ kind: 'GROUP', code: g.code, sortOrder: gi });
      rows.push(group);
      g.items.forEach(([quantity, unitPrice, directCost], ii) =>
        rows.push(
          row({
            parentId: group.id,
            sortOrder: ii,
            quantity,
            unitPrice,
            directCost,
          }),
        ),
      );
    });
    return rows;
  };
  const sheet = computeBudgetSheet(
    header({
      marginMode: 'GLOBAL',
      utilityPct: p.utilityPct,
      overheadPct: p.overheadPct,
      igvMode: 'NONE',
      exchangeRate: p.exchangeRate,
    }),
    buildRows(),
  );

  it('cada partida suma lo mismo que su total en el Excel', () => {
    const groups = sheet.rows.filter((r) => r.kind === 'GROUP');
    expect(groups.map((g) => [g.code, g.cost])).toEqual(
      p.groups.map((g) => [g.code, round2(g.expectedTotal)]),
    );
  });

  it('costo directo, GG + utilidad 21%, subtotal y equivalente en dólares', () => {
    expect(sheet.totals.directCost).toBe(p.expected.directCost);
    expect(round2(sheet.totals.overhead + sheet.totals.utility)).toBe(
      round2(p.expected.overheadAndUtility),
    );
    expect(sheet.totals.subtotal).toBe(round2(p.expected.subtotal));
    expect(sheet.totals.igv).toBe(0);
    expect(sheet.totals.total).toBe(round2(p.expected.subtotal));
    expect(sheet.totals.equivalent).toEqual({
      currency: 'USD',
      amount: round2(p.expected.subtotalUsd),
    });
  });

  it('en modo global la línea muestra su costo sin utilidad', () => {
    const item = sheet.rows.find((r) => r.kind === 'ITEM' && r.cost > 0)!;
    expect(item.utility).toBe(0);
    expect(item.price).toBe(item.cost);
  });
});

describe('computeBudgetSheet — árbol, códigos y filas especiales', () => {
  it('ordena por posición, numera 1 / 1.1 / 1.1.1 y respeta códigos manuales', () => {
    const nivel = row({
      kind: 'GROUP',
      sortOrder: 0,
      description: 'Primer nivel',
    });
    const sala = row({ kind: 'GROUP', parentId: nivel.id, sortOrder: 0 });
    const b = row({ parentId: sala.id, sortOrder: 1, directCost: 50 });
    const a = row({ parentId: sala.id, sortOrder: 0, directCost: 100 });
    const nota = row({ kind: 'NOTE', parentId: sala.id, sortOrder: 2 });
    const manual = row({ kind: 'GROUP', sortOrder: 1, code: 'A' });
    const sheet = computeBudgetSheet(header(), [
      b,
      nota,
      manual,
      a,
      sala,
      nivel,
    ]);

    expect(sheet.rows.map((r) => [r.id, r.code, r.depth])).toEqual([
      [nivel.id, '1', 0],
      [sala.id, '1.1', 1],
      [a.id, '1.1.1', 2],
      [b.id, '1.1.2', 2],
      [nota.id, '', 2],
      [manual.id, 'A', 0],
    ]);
    expect(sheet.rows[0]).toMatchObject({
      cost: 150,
      price: 180,
      childrenCount: 1,
    });
    expect(sheet.rows[4]).toMatchObject({ cost: 0, price: 0 });
  });

  it('IGV global, gastos generales en modo por línea y equivalente a soles', () => {
    const sheet = computeBudgetSheet(
      header({
        currency: 'USD',
        exchangeRate: 3.5,
        overheadPct: 1,
        igvMode: 'GLOBAL',
      }),
      [row({ quantity: 2, unitPrice: 50, hasIgv: false })],
    );
    // costo 100 → utilidad 20, GG 1 → subtotal 121 → IGV 21.78 → total 142.78
    expect(sheet.totals).toMatchObject({
      directCost: 100,
      utility: 20,
      overhead: 1,
      subtotal: 121,
      igv: 21.78,
      total: 142.78,
      equivalent: { currency: 'PEN', amount: 499.73 },
    });
  });

  it('costo real, abonos y saldo con el proveedor por partida', () => {
    const sheet = computeBudgetSheet(header(), [
      row({ directCost: 5900, actualCost: 5200, supplierPaymentsTotal: 3000 }),
      row({ directCost: 100 }),
    ]);
    expect(sheet.rows[0]).toMatchObject({
      deviation: 700,
      supplierBalance: 2200,
    });
    expect(sheet.rows[1]).toMatchObject({
      deviation: null,
      supplierBalance: null,
    });
    expect(sheet.totals.actualCost).toBe(5200);
  });
});
