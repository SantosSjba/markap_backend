export const CONTABILIDAD_PERIOD_REPOSITORY = Symbol('ContabilidadPeriodRepository');

export interface ContabilidadPeriodDto {
  id: string;
  year: number;
  month: number;
  status: string;
  label: string;
}

export interface ContabilidadCostCenterDto {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateContabilidadCostCenterInput {
  code: string;
  name: string;
  parentId?: string | null;
}

export interface UpdateContabilidadCostCenterInput {
  code?: string;
  name?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface ContabilidadPeriodRepository {
  ensureYearPeriods(applicationId: string, year: number): Promise<ContabilidadPeriodDto[]>;
  listPeriods(applicationId: string, year: number): Promise<ContabilidadPeriodDto[]>;
  findPeriodById(applicationId: string, id: string): Promise<ContabilidadPeriodDto | null>;
  setPeriodStatus(applicationId: string, id: string, status: string): Promise<ContabilidadPeriodDto>;
  ensureDefaultCostCenters(applicationId: string): Promise<void>;
  listCostCenters(applicationId: string, search?: string): Promise<ContabilidadCostCenterDto[]>;
  findCostCenterById(applicationId: string, id: string): Promise<ContabilidadCostCenterDto | null>;
  findCostCenterByCode(applicationId: string, code: string): Promise<ContabilidadCostCenterDto | null>;
  createCostCenter(applicationId: string, input: CreateContabilidadCostCenterInput): Promise<ContabilidadCostCenterDto>;
  updateCostCenter(
    applicationId: string,
    id: string,
    input: UpdateContabilidadCostCenterInput,
  ): Promise<ContabilidadCostCenterDto>;
  deactivateCostCenter(applicationId: string, id: string): Promise<ContabilidadCostCenterDto>;
  hasCostCenterChildren(applicationId: string, id: string): Promise<boolean>;
}
