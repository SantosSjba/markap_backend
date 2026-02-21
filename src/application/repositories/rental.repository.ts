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

export interface RentalRepository {
  create(data: CreateRentalData): Promise<RentalData>;
}

export const RENTAL_REPOSITORY = Symbol('RentalRepository');
