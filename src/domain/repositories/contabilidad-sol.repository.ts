export const CONTABILIDAD_SOL_REPOSITORY = Symbol('ContabilidadSolRepository');

export interface ContabilidadSolCredentialsDto {
  id: string;
  legalEntityId: string;
  legalEntityCode: string;
  legalEntityRuc: string;
  solUser: string;
  solPasswordHint: string | null;
  hasSolPassword: boolean;
  useSandbox: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface UpsertSolCredentialsInput {
  solUser: string;
  solPassword?: string | null;
  useSandbox?: boolean;
  isActive?: boolean;
}

export interface ContabilidadSunatDeclarationLogDto {
  id: string;
  legalEntityId: string;
  legalEntityCode: string;
  legalEntityRuc: string;
  periodId: string;
  periodYear: number;
  periodMonth: number;
  declarationType: string;
  status: string;
  sunatResponseCode: string | null;
  sunatResponseMessage: string | null;
  packageHash: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContabilidadSolPdt621PackageDto {
  logId: string;
  declarationType: string;
  status: string;
  packageHash: string;
  package: Record<string, unknown>;
  manualInstructions: string[];
}

export interface ContabilidadSolPlameDraftDto {
  logId: string;
  declarationType: string;
  status: string;
  package: Record<string, unknown>;
  note: string;
}

export interface ListSunatDeclarationsFilters {
  periodId?: string;
  declarationType?: string;
  limit?: number;
}

export interface ContabilidadSolRepository {
  getCredentials(
    applicationId: string,
    legalEntityId: string,
  ): Promise<ContabilidadSolCredentialsDto | null>;
  upsertCredentials(
    applicationId: string,
    legalEntityId: string,
    input: UpsertSolCredentialsInput,
  ): Promise<ContabilidadSolCredentialsDto>;
  listDeclarations(
    applicationId: string,
    legalEntityId: string,
    filters: ListSunatDeclarationsFilters,
  ): Promise<ContabilidadSunatDeclarationLogDto[]>;
  findLatestDeclaration(
    applicationId: string,
    legalEntityId: string,
    periodId: string,
    declarationType: string,
  ): Promise<ContabilidadSunatDeclarationLogDto | null>;
  saveDeclaration(input: {
    applicationId: string;
    legalEntityId: string;
    periodId: string;
    declarationType: string;
    status: string;
    packageJson: string;
    packageHash: string;
    sunatResponseCode?: string | null;
    sunatResponseMessage?: string | null;
    submittedAt?: Date | null;
    acceptedAt?: Date | null;
    createdBy?: string | null;
    existingLogId?: string | null;
  }): Promise<ContabilidadSunatDeclarationLogDto>;
  getPeriodLegalEntity(
    applicationId: string,
    periodId: string,
  ): Promise<{ legalEntityId: string; ruc: string; legalName: string; code: string; year: number; month: number } | null>;
  getPackageContent(applicationId: string, logId: string): Promise<string | null>;
  findDeclarationById(
    applicationId: string,
    logId: string,
  ): Promise<ContabilidadSunatDeclarationLogDto | null>;
}
