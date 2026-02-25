import { Injectable, Inject } from '@nestjs/common';
import type {
  RentalFinancialConfigRepository,
  RentalFinancialConfigData,
  CreateOrUpdateRentalFinancialConfigData,
} from '../../repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../repositories/rental-financial-config.repository';

@Injectable()
export class UpsertRentalFinancialConfigUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
  ) {}

  async execute(
    rentalId: string,
    data: Omit<CreateOrUpdateRentalFinancialConfigData, 'rentalId'>,
  ): Promise<RentalFinancialConfigData> {
    return this.repo.upsert({ rentalId, ...data });
  }
}
