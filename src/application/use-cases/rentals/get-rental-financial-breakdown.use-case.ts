import { Injectable, Inject } from '@nestjs/common';
import type {
  RentalFinancialConfigRepository,
  RentalFinancialBreakdown,
} from '../../repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../repositories/rental-financial-config.repository';

@Injectable()
export class GetRentalFinancialBreakdownUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
  ) {}

  async execute(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown> {
    return this.repo.getBreakdown(rentalId, monthlyAmount, currency);
  }
}
