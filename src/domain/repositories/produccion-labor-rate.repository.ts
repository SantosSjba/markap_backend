export const PRODUCCION_LABOR_RATE_REPOSITORY = Symbol('ProduccionLaborRateRepository');

export interface ProduccionLaborRateDto {
  id: string;
  name: string;
  stage: string;
  hourlyRate: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateProduccionLaborRatePayload {
  name: string;
  stage: string;
  hourlyRate: number;
  isActive?: boolean;
}

export interface UpdateProduccionLaborRatePayload {
  name?: string;
  stage?: string;
  hourlyRate?: number;
  isActive?: boolean;
}

export interface ListProduccionLaborRatesFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface ListProduccionLaborRatesResult {
  data: ProduccionLaborRateDto[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionLaborRateRepository {
  list(filters: ListProduccionLaborRatesFilters): Promise<ListProduccionLaborRatesResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionLaborRateDto | null>;
  create(applicationId: string, payload: CreateProduccionLaborRatePayload): Promise<ProduccionLaborRateDto>;
  update(id: string, payload: UpdateProduccionLaborRatePayload): Promise<ProduccionLaborRateDto>;
  delete(id: string): Promise<void>;
}
