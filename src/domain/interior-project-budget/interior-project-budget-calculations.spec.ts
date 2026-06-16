import {
  computeEmergencyUtility,
  computeLineItemPricing,
  computeLineItemPurchase,
  computeProjectSettlement,
} from './interior-project-budget-calculations';

describe('interior-project-budget-calculations (Excel Hortensias)', () => {
  const utilityPct = 20;
  const igvPct = 18;

  it('calcula utilidad 20% y precio sin IGV (fila sacos de piedras)', () => {
    const result = computeLineItemPricing({
      budgetedCost: 240,
      hasIgv: false,
      utilityPct,
      igvPct,
    });
    expect(result.utilityAmount).toBe(48);
    expect(result.totalBeforeIgv).toBe(288);
    expect(result.igvAmount).toBe(0);
    expect(result.price).toBe(288);
  });

  it('calcula fila luminarias instaladas (costo 480)', () => {
    const result = computeLineItemPricing({
      budgetedCost: 480,
      hasIgv: false,
      utilityPct,
      igvPct,
    });
    expect(result.utilityAmount).toBe(96);
    expect(result.price).toBe(576);
  });

  it('calcula utilidad extra emergencia = costo − costo real', () => {
    expect(computeEmergencyUtility(240, 210)).toBe(30);
    expect(computeEmergencyUtility(480, 480)).toBe(0);
  });

  it('calcula saldo al proveedor', () => {
    const result = computeLineItemPurchase({
      actualPurchaseCost: 350,
      supplierPayments: [{ amount: 100 }, { amount: 50 }],
    });
    expect(result.totalSupplierPayments).toBe(150);
    expect(result.supplierBalance).toBe(200);
  });

  it('calcula liquidación del proyecto Hortensias (totales Excel)', () => {
    const settlement = computeProjectSettlement({
      lineItemPrices: [9873.6],
      lineItemActualCosts: [4440.8],
      clientPayments: [{ amount: 3000, paymentType: 'ABONO', status: 'PAID' }],
    });
    expect(settlement.budgetTotal).toBe(9873.6);
    expect(settlement.totalActualCost).toBe(4440.8);
    expect(settlement.depositsOnAccount).toBe(3000);
    expect(settlement.pendingToCollect).toBe(6873.6);
    expect(settlement.milestoneUtility).toBe(5432.8);
  });
});
