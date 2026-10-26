import { Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { assertActiveCurrency } from '../../../../../shared/application/validation/currency.validator';
import type { RentalFinancialConfig } from '../../../domain/entities/rental-financial-config.entity';
import type {
  CreateOrUpdateRentalFinancialConfigData,
  RentalFinancialConfigRepository,
} from '../../../domain/repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../../domain/repositories/rental-financial-config.repository';

const LINE_CURRENCY_FIELDS = [
  'expenseCurrency',
  'taxCurrency',
  'externalAgentCurrency',
  'internalAgentCurrency',
] as const;

@Injectable()
export class UpsertRentalFinancialConfigUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    rentalId: string,
    data: Omit<CreateOrUpdateRentalFinancialConfigData, 'rentalId'>,
  ): Promise<RentalFinancialConfig> {
    const normalized = { ...data };
    if (data.currency != null) {
      normalized.currency = await assertActiveCurrency(
        this.references,
        data.currency,
      );
    }
    // Monedas de los montos fijos: vacío = moneda del contrato
    for (const field of LINE_CURRENCY_FIELDS) {
      const value = data[field];
      if (value === undefined) continue;
      normalized[field] = value
        ? await assertActiveCurrency(this.references, value)
        : null;
    }
    return this.repo.upsert({ rentalId, ...normalized });
  }
}
