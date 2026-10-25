import { Inject, Injectable } from '@nestjs/common';
import type { RentalFinancialConfig } from '../../../domain/entities/rental-financial-config.entity';
import type {
  CreateOrUpdateRentalFinancialConfigData,
  RentalFinancialConfigRepository,
} from '../../../domain/repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../../domain/repositories/rental-financial-config.repository';

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
