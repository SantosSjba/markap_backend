import {
  resolveRentalCommissionState,
  sumCollectedCommissionsByCurrency,
  type RentalCommissionState,
} from './rental-commission.util';

const day = (ymd: string) => new Date(`${ymd}T12:00:00.000Z`);

const pending: RentalCommissionState = {
  commissionStatus: 'PENDING',
  commissionDueDate: day('2026-11-15'),
  commissionPaidDate: null,
};

describe('resolveRentalCommissionState', () => {
  it('marca como pagada con la fecha real y conserva la fecha estimada', () => {
    expect(
      resolveRentalCommissionState(pending, {
        commissionStatus: 'PAID',
        commissionPaidDate: day('2026-12-02'),
      }),
    ).toEqual({
      commissionStatus: 'PAID',
      commissionDueDate: day('2026-11-15'),
      commissionPaidDate: day('2026-12-02'),
    });
  });

  it('exige la fecha de cobro al marcar como pagada', () => {
    expect(() =>
      resolveRentalCommissionState(pending, { commissionStatus: 'PAID' }),
    ).toThrow(RangeError);
  });

  it('volver a pendiente borra la fecha de cobro', () => {
    const paid: RentalCommissionState = {
      ...pending,
      commissionStatus: 'PAID',
      commissionPaidDate: day('2026-12-02'),
    };
    expect(
      resolveRentalCommissionState(paid, { commissionStatus: 'PENDING' }),
    ).toEqual({ ...pending });
  });

  it('una comisión pendiente ignora la fecha de cobro enviada', () => {
    expect(
      resolveRentalCommissionState(pending, {
        commissionDueDate: null,
        commissionPaidDate: day('2026-12-02'),
      }),
    ).toEqual({ ...pending, commissionDueDate: null });
  });

  it('corrige la fecha de cobro de una comisión ya pagada', () => {
    const paid: RentalCommissionState = {
      ...pending,
      commissionStatus: 'PAID',
      commissionPaidDate: day('2026-12-02'),
    };
    expect(
      resolveRentalCommissionState(paid, {
        commissionPaidDate: day('2026-12-05'),
      }).commissionPaidDate,
    ).toEqual(day('2026-12-05'));
  });
});

describe('sumCollectedCommissionsByCurrency', () => {
  it('separa soles y dólares sin sumarlos', () => {
    const totals = sumCollectedCommissionsByCurrency([
      {
        monthlyAmount: 2000,
        currency: 'PEN',
        config: { baseAmount: 2000, taxType: 'PERCENT', taxValue: 10 },
      },
      { monthlyAmount: 800, currency: 'USD', config: { baseAmount: 800 } },
      { monthlyAmount: 1000, currency: 'PEN', config: null },
    ]);
    expect(totals).toEqual([
      expect.objectContaining({
        currency: 'PEN',
        collectedCommissions: 2,
        monthlyRent: 3000,
        income: 3000,
        tax: 200,
        utility: 2800,
      }),
      expect.objectContaining({
        currency: 'USD',
        collectedCommissions: 1,
        income: 800,
        utility: 800,
      }),
    ]);
  });

  it('un monto fijo en otra moneda queda en su propia moneda', () => {
    const totals = sumCollectedCommissionsByCurrency([
      {
        monthlyAmount: 3000,
        currency: 'PEN',
        config: {
          baseAmount: 3000,
          externalAgentType: 'FIXED',
          externalAgentValue: 100,
          externalAgentCurrency: 'USD',
        },
      },
    ]);
    expect(totals.map((t) => [t.currency, t.utility])).toEqual([
      ['PEN', 3000],
      ['USD', -100],
    ]);
    expect(totals[1].collectedCommissions).toBe(0);
  });
});
