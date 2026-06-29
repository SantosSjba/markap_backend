export const CONTABILIDAD_LEGAL_ENTITY_REPOSITORY = Symbol('ContabilidadLegalEntityRepository');

export interface ContabilidadLegalEntityDto {
  id: string;
  code: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  fiscalAddress: string;
  district: string;
  province: string;
  department: string;
  ubigeoCode: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface ContabilidadLegalEntityRepository {
  ensureDefaults(applicationId: string): Promise<void>;
  list(applicationId: string): Promise<ContabilidadLegalEntityDto[]>;
  getDefault(applicationId: string): Promise<ContabilidadLegalEntityDto | null>;
  findById(applicationId: string, id: string): Promise<ContabilidadLegalEntityDto | null>;
}
