import { Injectable, Inject } from '@nestjs/common';
import type {
  RentalFinancialConfigRepository,
  RentalFinancialConfig,
} from '@domain/repositories/rental-financial-config.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '@domain/repositories/rental-financial-config.repository';

@Injectable()
export class GetRentalFinancialConfigUseCase {
  constructor(
    @Inject(RENTAL_FINANCIAL_CONFIG_REPOSITORY)
    private readonly repo: RentalFinancialConfigRepository,
  ) {}

  async execute(rentalId: string): Promise<RentalFinancialConfig | null> {
    return this.repo.findByRentalId(rentalId);
  }
}
