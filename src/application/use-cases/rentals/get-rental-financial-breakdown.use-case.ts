import { Injectable, Inject } from '@nestjs/common';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '@common/constants/injection-tokens';
import type { RentalFinancialConfigRepository, RentalFinancialBreakdown } from '@domain/repositories/rental-financial-config.repository';

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
