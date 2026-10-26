import type {
  Rental,
  RentalDetail,
  RentalListItem,
  RentalStats,
} from '../entities/rental.entity';
import type { RentalCommissionPatch } from '../utils/rental-commission.util';

export type {
  Rental,
  RentalDetail,
  RentalListItem,
  RentalStats,
} from '../entities/rental.entity';

export interface CreateRentalData {
  applicationId: string;
  propertyId: string;
  tenantId: string;
  tenantIds: string[];
  startDate: Date;
  endDate: Date;
  currency: string;
  monthlyAmount: number;
  securityDeposit?: number | null;
  paymentDueDay: number;
  notes?: string | null;
  enableExpirationAlerts?: boolean;
  enableCollectionAlerts?: boolean;
  commission?: RentalCommissionPatch;
}

export interface ListRentalsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface ListRentalsResult {
  data: RentalListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateRentalData {
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  monthlyAmount?: number;
  securityDeposit?: number | null;
  paymentDueDay?: number;
  notes?: string | null;
  status?: string;
  enableExpirationAlerts?: boolean;
  enableCollectionAlerts?: boolean;
  tenantIds?: string[];
  commission?: RentalCommissionPatch;
}

export interface RentalRepository {
  create(data: CreateRentalData): Promise<Rental>;
  findMany(filters: ListRentalsFilters): Promise<ListRentalsResult>;
  getStats(applicationSlug: string): Promise<RentalStats>;
  findById(id: string): Promise<RentalDetail | null>;
  update(id: string, data: UpdateRentalData): Promise<Rental>;
  countActiveByPropertyId(propertyId: string): Promise<number>;
  countActiveInvolvingClient(
    clientId: string,
    applicationId: string,
  ): Promise<number>;
  cancel(id: string): Promise<void>;
}

export const RENTAL_REPOSITORY = Symbol('RentalRepository');
