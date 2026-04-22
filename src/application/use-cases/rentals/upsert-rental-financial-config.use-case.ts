import { Injectable, Inject } from '@nestjs/common';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '@common/constants/injection-tokens';
import type { RentalFinancialConfigRepository, RentalFinancialConfig, CreateOrUpdateRentalFinancialConfigData } from '@domain/repositories/rental-financial-config.repository';

@Injectable()
export class UpsertRentalFinancialConfigUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
  ) {}

  async execute(
    rentalId: string,
    data: Omit<CreateOrUpdateRentalFinancialConfigData, 'rentalId'>,
  ): Promise<RentalFinancialConfig> {
    return this.repo.upsert({ rentalId, ...data });
  }
}
