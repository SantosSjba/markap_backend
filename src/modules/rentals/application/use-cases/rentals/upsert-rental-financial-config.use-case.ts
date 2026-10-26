import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { assertActiveCurrency } from '../../../../../shared/application/validation/currency.validator';
import type { RentalFinancialConfig } from '../../../domain/entities/rental-financial-config.entity';
import type {
  CreateOrUpdateRentalFinancialConfigData,
  RentalFinancialConfigRepository,
} from '../../../domain/repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../../domain/repositories/rental-financial-config.repository';
import type { RentalRepository } from '../../../domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../../domain/repositories/rental.repository';
import { invalidPercentLines } from '../../../domain/utils/rental-financial-breakdown.util';

const LINE_CURRENCY_FIELDS = [
  'expenseCurrency',
  'taxCurrency',
  'externalAgentCurrency',
  'internalAgentCurrency',
] as const;

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

@Injectable()
export class UpsertRentalFinancialConfigUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentals: RentalRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    rentalId: string,
    data: Omit<CreateOrUpdateRentalFinancialConfigData, 'rentalId'>,
  ): Promise<RentalFinancialConfig> {
    const rental = await this.rentals.findById(rentalId);
    if (!rental) throw new EntityNotFoundException('Rental', rentalId);
    // La distribución siempre va en la moneda del contrato (base de los porcentajes)
    const normalized = { ...data, currency: rental.currency };

    const current = await this.repo.findByRentalId(rentalId);
    const invalid = invalidPercentLines({
      ...current,
      ...stripUndefined(data),
    });
    if (invalid.length) {
      throw new BadRequestException(
        `El porcentaje debe estar entre 0 y 100: ${invalid.join(', ')}.`,
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
