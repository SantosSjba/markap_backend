export const CONTABILIDAD_ACCOUNT_REPOSITORY = Symbol('ContabilidadAccountRepository');

export interface ContabilidadAccountDto {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  level: number;
  accountType: string;
  isMovement: boolean;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  hasMovements: boolean;
  children?: ContabilidadAccountDto[];
}

export interface ContabilidadAccountFlatDto {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  level: number;
  accountType: string;
  isMovement: boolean;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  hasMovements: boolean;
}

export interface CreateContabilidadAccountInput {
  parentId: string;
  code: string;
  name: string;
  accountType: string;
  isMovement: boolean;
  sortOrder?: number;
}

export interface UpdateContabilidadAccountInput {
  code?: string;
  name?: string;
  accountType?: string;
  isMovement?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ImportPcgeResultDto {
  classes: number[];
  created: number;
  skipped: number;
  pendingParent: number;
  totalInCatalog: number;
}

export interface ContabilidadAccountRepository {
  ensurePcgeSeed(applicationId: string): Promise<void>;
  importPcge(applicationId: string, classes: number[]): Promise<ImportPcgeResultDto>;
  listFlat(applicationId: string, search?: string): Promise<ContabilidadAccountFlatDto[]>;
  findById(applicationId: string, id: string): Promise<ContabilidadAccountFlatDto | null>;
  findByCode(applicationId: string, code: string): Promise<ContabilidadAccountFlatDto | null>;
  hasChildren(applicationId: string, id: string): Promise<boolean>;
  create(applicationId: string, input: CreateContabilidadAccountInput): Promise<ContabilidadAccountFlatDto>;
  update(applicationId: string, id: string, input: UpdateContabilidadAccountInput): Promise<ContabilidadAccountFlatDto>;
  deactivate(applicationId: string, id: string): Promise<ContabilidadAccountFlatDto>;
  markHasMovements(applicationId: string, accountIds: string[]): Promise<void>;
}
