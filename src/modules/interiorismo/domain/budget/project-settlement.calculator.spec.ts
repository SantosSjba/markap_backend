import { computeProjectSettlement } from './project-settlement.calculator';

const totals = {
  total: 10000,
  igv: 0,
  actualCost: 6000,
  supplierPayments: 4000,
};
const pay = (
  amount: number,
  over: Partial<{
    currency: string | null;
    exchangeRate: number | null;
    paymentType: string;
    status: string;
  }> = {},
) => ({
  amount,
  currency: 'PEN',
  exchangeRate: null,
  paymentType: 'ABONO',
  status: 'PAID',
  ...over,
});

describe('computeProjectSettlement', () => {
  it('misma moneda: cobrado, a cuenta, por cobrar y utilidad', () => {
    const s = computeProjectSettlement(
      totals,
      { currency: 'PEN', exchangeRate: null },
      [
        pay(3000),
        pay(2000, { paymentType: 'PAGO_FINAL' }),
        pay(999, { status: 'PENDING' }),
        pay(500, { status: 'CANCELLED' }),
      ],
    );
    expect(s).toMatchObject({
      currency: 'PEN',
      budgetTotal: 10000,
      depositsOnAccount: 3000,
      totalClientPaid: 5000,
      pendingToCollect: 5000,
      scheduledPayments: 999,
      totalActualCost: 6000,
      totalSupplierPayments: 4000,
      supplierBalance: 2000,
      milestoneUtility: 4000,
      marginPct: 40,
      unconverted: [],
    });
  });

  it('la utilidad no cuenta el IGV y usa el costo presupuestado de lo que aún no tiene costo real', () => {
    const s = computeProjectSettlement(
      {
        total: 11800,
        igv: 1800,
        actualCost: 3000,
        pendingCost: 5000,
        supplierPayments: 0,
      },
      { currency: 'PEN', exchangeRate: null },
      [],
    );
    expect(s.netRevenue).toBe(10000);
    expect(s.pendingCost).toBe(5000);
    expect(s.milestoneUtility).toBe(2000);
    expect(s.marginPct).toBe(20);
    expect(s.pendingToCollect).toBe(11800);
  });

  it('convierte cobros en otra moneda con su TC o el del presupuesto', () => {
    const s = computeProjectSettlement(
      { ...totals, total: 3500 },
      { currency: 'PEN', exchangeRate: 3.5 },
      [
        pay(100, { currency: 'USD', exchangeRate: 3.6 }),
        pay(100, { currency: 'USD' }),
      ],
    );
    expect(s.totalClientPaid).toBe(710);
    expect(s.paidByCurrency).toEqual([{ currency: 'USD', amount: 200 }]);
  });

  it('presupuesto en dólares: los soles se dividen entre el TC', () => {
    const s = computeProjectSettlement(
      { ...totals, total: 1000 },
      { currency: 'USD', exchangeRate: 3.5 },
      [pay(700)],
    );
    expect(s.totalClientPaid).toBe(200);
    expect(s.pendingToCollect).toBe(800);
  });

  it('un costo sin proveedor no se presenta como deuda y el costo real sigue reduciendo la utilidad', () => {
    const s = computeProjectSettlement(
      {
        total: 1000,
        igv: 0,
        actualCost: 300,
        supplierPayments: 0,
        supplierBalance: 100,
      },
      { currency: 'PEN', exchangeRate: null },
      [],
    );
    expect(s.supplierBalance).toBe(100);
    expect(s.totalActualCost).toBe(300);
    expect(s.milestoneUtility).toBe(700);
  });

  it('sin tipo de cambio el cobro queda sin convertir y no descuenta el saldo', () => {
    const s = computeProjectSettlement(
      totals,
      { currency: 'USD', exchangeRate: null },
      [pay(500), pay(100, { currency: 'EUR' }), pay(50, { currency: 'USD' })],
    );
    expect(s.totalClientPaid).toBe(50);
    expect(s.pendingToCollect).toBe(9950);
    expect(s.unconverted).toEqual([
      { currency: 'PEN', amount: 500 },
      { currency: 'EUR', amount: 100 },
    ]);
  });

  it('cobro sin moneda cuenta como la del presupuesto; sin presupuesto el margen es null', () => {
    const s = computeProjectSettlement(
      { total: 0, igv: 0, actualCost: 0, supplierPayments: 0 },
      { currency: 'USD', exchangeRate: null },
      [pay(10, { currency: null })],
    );
    expect(s.totalClientPaid).toBe(10);
    expect(s.marginPct).toBeNull();
  });
});
