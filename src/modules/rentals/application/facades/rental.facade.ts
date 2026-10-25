import { Injectable } from '@nestjs/common';
import type {
  RentalFinancialBreakdown,
  RentalFinancialConfig,
} from '../../domain/entities/rental-financial-config.entity';
import type {
  Rental,
  RentalDetail,
  RentalStats,
} from '../../domain/entities/rental.entity';
import type { CreateOrUpdateRentalFinancialConfigData } from '../../domain/repositories/rental-financial-config.repository';
import type {
  ListRentalsFilters,
  ListRentalsResult,
} from '../../domain/repositories/rental.repository';
import type { RentalPort } from '../ports/rental.port';
import { CancelRentalUseCase } from '../use-cases/rentals/cancel-rental.use-case';
import type { CreateRentalInput } from '../use-cases/rentals/create-rental.use-case';
import { CreateRentalUseCase } from '../use-cases/rentals/create-rental.use-case';
import { GetRentalByIdUseCase } from '../use-cases/rentals/get-rental-by-id.use-case';
import { GetRentalFinancialBreakdownUseCase } from '../use-cases/rentals/get-rental-financial-breakdown.use-case';
import { GetRentalFinancialConfigUseCase } from '../use-cases/rentals/get-rental-financial-config.use-case';
import { GetRentalStatsUseCase } from '../use-cases/rentals/get-rental-stats.use-case';
import { ListRentalsUseCase } from '../use-cases/rentals/list-rentals.use-case';
import {
  UpdateRentalInput,
  UpdateRentalUseCase,
} from '../use-cases/rentals/update-rental.use-case';
import { UpsertRentalFinancialConfigUseCase } from '../use-cases/rentals/upsert-rental-financial-config.use-case';

@Injectable()
export class RentalFacade implements RentalPort {
  constructor(
    private readonly createUc: CreateRentalUseCase,
    private readonly listUc: ListRentalsUseCase,
    private readonly statsUc: GetRentalStatsUseCase,
    private readonly getByIdUc: GetRentalByIdUseCase,
    private readonly updateUc: UpdateRentalUseCase,
    private readonly getFinUc: GetRentalFinancialConfigUseCase,
    private readonly upsertFinUc: UpsertRentalFinancialConfigUseCase,
    private readonly breakdownUc: GetRentalFinancialBreakdownUseCase,
    private readonly cancelUc: CancelRentalUseCase,
  ) {}

  listRentals(filters: ListRentalsFilters): Promise<ListRentalsResult> {
    return this.listUc.execute(filters);
  }

  getRentalStats(applicationSlug: string): Promise<RentalStats> {
    return this.statsUc.execute(applicationSlug);
  }

  createRental(input: CreateRentalInput): Promise<Rental> {
    return this.createUc.execute(input);
  }

  getRentalById(id: string): Promise<RentalDetail> {
    return this.getByIdUc.execute(id);
  }

  updateRental(input: UpdateRentalInput): Promise<Rental> {
    return this.updateUc.execute(input);
  }

  getRentalFinancialConfig(
    rentalId: string,
  ): Promise<RentalFinancialConfig | null> {
    return this.getFinUc.execute(rentalId);
  }

  upsertRentalFinancialConfig(
    rentalId: string,
    data: Omit<CreateOrUpdateRentalFinancialConfigData, 'rentalId'>,
  ): Promise<RentalFinancialConfig> {
    return this.upsertFinUc.execute(rentalId, data);
  }

  getRentalFinancialBreakdown(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown> {
    return this.breakdownUc.execute(rentalId, monthlyAmount, currency);
  }

  cancelRental(id: string): Promise<{ message: string }> {
    return this.cancelUc.execute(id);
  }
}
