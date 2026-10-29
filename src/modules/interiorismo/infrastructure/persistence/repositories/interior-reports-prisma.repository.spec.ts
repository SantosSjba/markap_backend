import { InteriorReportsPrismaRepository } from './interior-reports-prisma.repository';
import type { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';

const date = (value: string) => new Date(`${value}T12:00:00Z`);
const payment = (
  id: string,
  currency: string,
  amount: number,
  status = 'PAID',
) => ({
  id,
  currency,
  amount,
  status,
  exchangeRate: null,
  paymentType: 'OTHER',
  concept: id,
  paidAt: date('2026-10-27'),
});
function project(id: string, currency: string) {
  return {
    id,
    code: id,
    name: id,
    status: 'IN_PROGRESS',
    currency,
    estimatedBudget: 9999,
    exchangeRate: null,
    createdAt: date('2026-10-01'),
    estimatedEndDate: date('2026-10-05'),
    payments: [payment(`${id}-paid`, currency, 30)],
    budgets: [
      {
        currency,
        exchangeRate: null,
        marginMode: 'PER_LINE',
        utilityPct: 20,
        overheadPct: 0,
        igvMode: 'NONE',
        igvPct: 18,
        rows: [
          {
            id: `${id}-row`,
            parentId: null,
            sortOrder: 0,
            kind: 'ITEM',
            code: null,
            description: '',
            unit: null,
            quantity: 1,
            unitPrice: 100,
            directCost: null,
            actualCost: 50,
            utilityPctOverride: null,
            hasIgv: false,
            supplierId: 'supplier',
            supplierName: null,
            materialSupplier: { companyName: 'Proveedor' },
            supplierPayments: [{ amount: 10 }],
          },
        ],
      },
    ],
  };
}

describe('Reportes Interiorismo', () => {
  function setup() {
    const pen = project('pen', 'PEN');
    const usd = project('usd', 'USD');
    usd.payments.push(payment('eur-unconverted', 'EUR', 20));
    const prisma = {
      application: { findUnique: jest.fn().mockResolvedValue({ id: 'app' }) },
      interiorProject: {
        findMany: jest.fn(
          (args: {
            where: object;
            include: { payments: { where: object } };
          }) => {
            void args;
            return Promise.resolve([pen, usd]);
          },
        ),
      },
      interiorMaterialPurchase: {
        findMany: jest.fn().mockResolvedValue([
          {
            supplierId: 'supplier',
            supplier: { companyName: 'Proveedor' },
            currency: 'PEN',
            totalAmount: 75,
          },
        ]),
      },
      client: { count: jest.fn().mockResolvedValue(2) },
      interiorExecutionTask: { count: jest.fn().mockResolvedValue(0) },
      interiorExecutionIncident: { count: jest.fn().mockResolvedValue(0) },
    };
    return {
      prisma,
      pen,
      usd,
      repo: new InteriorReportsPrismaRepository(
        prisma as unknown as PrismaService,
      ),
    };
  }
  it('separa PEN/USD/EUR y usa la hoja activa sin duplicar compras de catálogo', async () => {
    const { repo } = setup();
    const result = (await repo.getDashboard(
      'interiorismo',
      '2026-10-01',
      '2026-10-31',
    ))!;
    expect(result.totals.budget).toEqual([
      { currency: 'PEN', amount: 120 },
      { currency: 'USD', amount: 120 },
    ]);
    expect(result.totals.actualCost).toEqual([
      { currency: 'PEN', amount: 50 },
      { currency: 'USD', amount: 50 },
    ]);
    expect(result.totals.collected).toEqual([
      { currency: 'EUR', amount: 20 },
      { currency: 'PEN', amount: 30 },
      { currency: 'USD', amount: 30 },
    ]);
    expect(result.profitability[1]).toMatchObject({
      pending: 90,
      utility: 70,
      unconverted: [{ currency: 'EUR', amount: 20 }],
    });
    expect(result.suppliers).toHaveLength(2);
    expect(result.suppliers[0]).toMatchObject({
      currency: 'PEN',
      actualCost: 50,
      balance: 40,
      catalogPurchases: 75,
    });
  });
  it('filtra movimientos sin quitar del saldo actual los cobros anteriores', async () => {
    const { repo, pen } = setup();
    pen.payments[0].paidAt = date('2026-09-30');
    const result = (await repo.getDashboard(
      'interiorismo',
      '2026-10-15',
      '2026-10-31',
    ))!;
    expect(result.projects).toHaveLength(0);
    expect(result.profitability[0].pending).toBe(90);
    expect(result.collections.some((p) => p.projectId === 'pen')).toBe(false);
    expect(result.monthly[0].projects).toBe(0);
  });
  it('incluye meses vacíos y conserva los filtros de aplicación y borrado lógico', async () => {
    const { repo, prisma } = setup();
    const result = (await repo.getDashboard(
      'interiorismo',
      '2026-09-01',
      '2026-11-30',
    ))!;
    expect(result.monthly.map((m) => m.key)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(result.monthly[0].collections).toEqual([]);
    const query = prisma.interiorProject.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ applicationId: 'app', deletedAt: null });
    expect(query.include.payments.where).toEqual({ status: 'PAID' });
  });
  it('agrupa timestamps por el día de Lima al cruzar medianoche UTC', async () => {
    const { repo, pen } = setup();
    pen.payments[0].paidAt = new Date('2026-10-01T02:00:00Z');
    const result = (await repo.getDashboard(
      'interiorismo',
      '2026-10-01',
      '2026-10-31',
    ))!;
    expect(result.collections.some((p) => p.projectId === 'pen')).toBe(false);
  });
});
