import { Injectable, Inject } from '@nestjs/common';
import type {
  RentalFinancialConfigRepository,
  RentalFinancialConfigData,
} from '../../repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../repositories/rental-financial-config.repository';

@Injectable()
export class GetRentalFinancialConfigUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
  ) {}

  async execute(rentalId: string): Promise<RentalFinancialConfigData | null> {
    return this.repo.findByRentalId(rentalId);
  }
}
