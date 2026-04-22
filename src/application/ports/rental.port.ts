import type {
  ListRentalsFilters,
  ListRentalsResult,
  RentalStats,
  Rental,
  RentalDetail,
} from '@domain/repositories/rental.repository';
import type {
  CreateOrUpdateRentalFinancialConfigData,
  RentalFinancialConfig,
  RentalFinancialBreakdown,
} from '@domain/repositories/rental-financial-config.repository';
import type { CreateRentalInput } from '../use-cases/rentals/create-rental.use-case';
import type { UpdateRentalInput } from '../use-cases/rentals/update-rental.use-case';

export const RENTAL_PORT = Symbol('RentalPort');

export interface RentalPort {
  listRentals(filters: ListRentalsFilters): Promise<ListRentalsResult>;
  getRentalStats(applicationSlug: string): Promise<RentalStats>;
  createRental(input: CreateRentalInput): Promise<Rental>;
  getRentalById(id: string): Promise<RentalDetail>;
  updateRental(input: UpdateRentalInput): Promise<Rental>;
  getRentalFinancialConfig(rentalId: string): Promise<RentalFinancialConfig | null>;
  upsertRentalFinancialConfig(
    rentalId: string,
    data: Omit<CreateOrUpdateRentalFinancialConfigData, 'rentalId'>,
  ): Promise<RentalFinancialConfig>;
  getRentalFinancialBreakdown(
    rentalId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<RentalFinancialBreakdown>;
  cancelRental(id: string): Promise<{ message: string }>;
}
