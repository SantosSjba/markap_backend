export type FinancialValueType = 'PERCENT' | 'FIXED';

/** Configuración financiera de un alquiler (gastos, impuestos, comisiones). */
export class RentalFinancialConfig {
  constructor(
    public readonly id: string,
    public readonly rentalId: string,
    public readonly currency: string,
    public readonly baseAmount: number | null,
    public readonly expenseType: FinancialValueType,
    public readonly expenseValue: number,
    public readonly taxType: FinancialValueType,
    public readonly taxValue: number,
    public readonly externalAgentId: string | null,
    public readonly externalAgentType: FinancialValueType,
    public readonly externalAgentValue: number,
    public readonly externalAgentName: string | null,
    public readonly internalAgentId: string | null,
    public readonly internalAgentType: FinancialValueType,
    public readonly internalAgentValue: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Desglose calculado a partir del contrato y la configuración financiera. */
export class RentalFinancialBreakdown {
  constructor(
    public readonly monthlyAmount: number,
    public readonly baseAmount: number,
    public readonly currency: string,
    public readonly expense: number,
    public readonly tax: number,
    public readonly externalAgentCommission: number,
    public readonly internalAgentCommission: number,
    public readonly utility: number,
    public readonly config: RentalFinancialConfig | null,
  ) {}
}
