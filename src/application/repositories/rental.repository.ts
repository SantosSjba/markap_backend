export interface CreateRentalData {
  applicationId: string;
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  monthlyAmount: number;
  securityDeposit?: number | null;
  paymentDueDay: number;
  notes?: string | null;
}

export interface RentalData {
  id: string;
  applicationId: string;
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  monthlyAmount: number;
  securityDeposit: number | null;
  paymentDueDay: number;
  notes: string | null;
  status: string;
}

export interface RentalListItem {
  id: string;
  code: string;
  propertyId: string;
  propertyAddress: string;
  propertyCode: string;
  tenantId: string;
  tenantName: string;
  ownerId: string;
  ownerName: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  monthlyAmount: number;
  securityDeposit: number | null;
  status: string;
  hasContract: boolean;
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

export interface RentalStats {
  total: number;
  vigentes: number;
  porVencer: number;
  vencidos: number;
}

export interface RentalDetailData extends RentalData {
  code: string;
  property: { id: string; code: string; addressLine: string; ownerId: string; owner: { id: string; fullName: string } };
  tenant: { id: string; fullName: string };
  hasContract: boolean;
  hasDeliveryAct: boolean;
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
}

export interface RentalRepository {
  create(data: CreateRentalData): Promise<RentalData>;
  findMany(filters: ListRentalsFilters): Promise<ListRentalsResult>;
  getStats(applicationSlug: string): Promise<RentalStats>;
  findById(id: string): Promise<RentalDetailData | null>;
  update(id: string, data: UpdateRentalData): Promise<RentalData>;
  /** Cuenta alquileres vigentes (ACTIVE, endDate >= hoy, no eliminados) para una propiedad */
  countActiveByPropertyId(propertyId: string): Promise<number>;
}

export const RENTAL_REPOSITORY = Symbol('RentalRepository');
