import { computeRentalFinancialBreakdown } from './rental-financial-breakdown.util';

describe('computeRentalFinancialBreakdown', () => {
  it('calcula comisiones porcentuales sobre base neta (ingreso − gastos − impuestos)', () => {
    const result = computeRentalFinancialBreakdown(3000, {
      baseAmount: 3000,
      expenseType: 'FIXED',
      expenseValue: 115.71,
      taxType: 'FIXED',
      taxValue: 0,
      externalAgentType: 'FIXED',
      externalAgentValue: 0,
      internalAgentType: 'PERCENT',
      internalAgentValue: 40,
    });

    expect(result.base).toBe(3000);
    expect(result.expense).toBe(115.71);
    expect(result.tax).toBe(0);
    expect(result.externalAgentCommission).toBe(0);
    expect(result.internalAgentCommission).toBe(1153.72);
    expect(result.utility).toBe(1730.57);
  });

  it('devuelve utilidad igual al ingreso cuando no hay configuración', () => {
    const result = computeRentalFinancialBreakdown(2500, null);
    expect(result.base).toBe(2500);
    expect(result.utility).toBe(2500);
  });

  it('agrupa por moneda los montos fijos en otra moneda sin convertirlos', () => {
    const result = computeRentalFinancialBreakdown(
      2000,
      {
        expenseType: 'PERCENT',
        expenseValue: 10,
        taxType: 'FIXED',
        taxValue: 0,
        externalAgentType: 'FIXED',
        externalAgentValue: 100,
        externalAgentCurrency: 'USD',
        internalAgentType: 'PERCENT',
        internalAgentValue: 10,
      },
      'PEN',
    );

    expect(result.currencies.expense).toBe('PEN');
    expect(result.currencies.externalAgentCommission).toBe('USD');
    // Comisión % sobre base − gastos en soles (la de dólares no se descuenta)
    expect(result.internalAgentCommission).toBe(180);
    expect(result.utility).toBe(1620);
    expect(result.totalsByCurrency).toEqual([
      {
        currency: 'PEN',
        income: 2000,
        expense: 200,
        tax: 0,
        externalAgentCommission: 0,
        internalAgentCommission: 180,
        utility: 1620,
      },
      {
        currency: 'USD',
        income: 0,
        expense: 0,
        tax: 0,
        externalAgentCommission: 100,
        internalAgentCommission: 0,
        utility: -100,
      },
    ]);
  });

  it('los porcentajes siempre van en la moneda del contrato', () => {
    const result = computeRentalFinancialBreakdown(
      1000,
      { taxType: 'PERCENT', taxValue: 18, taxCurrency: 'EUR' },
      'USD',
    );
    expect(result.currencies.tax).toBe('USD');
    expect(result.totalsByCurrency).toHaveLength(1);
  });
});
