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
});
