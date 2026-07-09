import type { ArquitecturaProjectTypeCode } from '@domain/constants/arquitectura-project-stages.constants';

export type ArquitecturaProjectType = ArquitecturaProjectTypeCode;

export type ArquitecturaProjectLifecycleStatus =
  | 'DESIGN'
  | 'QUOTE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'FINISHED';

/** Ciclo comercial + cancelación administrativa. */
export type ArquitecturaProjectStatus = ArquitecturaProjectLifecycleStatus | 'CANCELLED';

export interface ArquitecturaProjectAgentRef {
  id: string;
  fullName: string;
}

export interface ArquitecturaProjectClientRef {
  id: string;
  fullName: string;
  documentNumber: string;
}

export interface ArquitecturaProjectListItem {
  id: string;
  code: string;
  name: string;
  projectType: ArquitecturaProjectType;
  status: ArquitecturaProjectStatus;
  progressPct: number;
  estimatedEndDate: string | null;
  client: ArquitecturaProjectClientRef;
}

export interface ArquitecturaProjectDetail extends ArquitecturaProjectListItem {
  addressLine: string | null;
  city: string | null;
  interventionLevel: string | null;
  executionTimeNote: string | null;
  currency: string;
  defaultUtilityPct: number;
  defaultIgvPct: number;
  areaSqm: number | null;
  levelsCount: number | null;
  environmentsNote: string | null;
  startDate: string | null;
  designerAgent: ArquitecturaProjectAgentRef | null;
  architectJrAgent: ArquitecturaProjectAgentRef | null;
  architectSrAgent: ArquitecturaProjectAgentRef | null;
  supervisorAgent: ArquitecturaProjectAgentRef | null;
  commercialAgent: ArquitecturaProjectAgentRef | null;
  estimatedBudget: number | null;
  projectedCost: number | null;
  expectedMargin: number | null;
  payments: ArquitecturaProjectPaymentDto[];
}

export interface ArquitecturaProjectPaymentDto {
  id: string;
  paidAt: string;
  amount: number;
  concept: string;
  paymentType: string;
  status: string;
  scheduleItemId: string | null;
}

export interface CreateArquitecturaProjectData {
  applicationId: string;
  code: string;
  name: string;
  clientId: string;
  projectType: ArquitecturaProjectType;
  status: ArquitecturaProjectStatus;
  addressLine?: string | null;
  city?: string | null;
  interventionLevel?: string | null;
  executionTimeNote?: string | null;
  currency?: string;
  defaultUtilityPct?: number | null;
  defaultIgvPct?: number | null;
  areaSqm?: number | null;
  levelsCount?: number | null;
  environmentsNote?: string | null;
  startDate?: Date | null;
  estimatedEndDate?: Date | null;
  designerAgentId?: string | null;
  architectJrAgentId?: string | null;
  architectSrAgentId?: string | null;
  supervisorAgentId?: string | null;
  commercialAgentId?: string | null;
  estimatedBudget?: number | null;
  projectedCost?: number | null;
  expectedMargin?: number | null;
  progressPct?: number | null;
}

export interface UpdateArquitecturaProjectData {
  name?: string;
  clientId?: string;
  projectType?: ArquitecturaProjectType;
  status?: ArquitecturaProjectStatus;
  addressLine?: string | null;
  city?: string | null;
  interventionLevel?: string | null;
  executionTimeNote?: string | null;
  currency?: string;
  defaultUtilityPct?: number | null;
  defaultIgvPct?: number | null;
  areaSqm?: number | null;
  levelsCount?: number | null;
  environmentsNote?: string | null;
  startDate?: Date | null;
  estimatedEndDate?: Date | null;
  designerAgentId?: string | null;
  architectJrAgentId?: string | null;
  architectSrAgentId?: string | null;
  supervisorAgentId?: string | null;
  commercialAgentId?: string | null;
  estimatedBudget?: number | null;
  projectedCost?: number | null;
  expectedMargin?: number | null;
  progressPct?: number | null;
}

export interface ListArquitecturaProjectsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: ArquitecturaProjectStatus;
  /** Si true, solo APPROVED e IN_PROGRESS (en ejecución). */
  inProgressOnly?: boolean;
  clientId?: string;
}

export interface ListArquitecturaProjectsResult {
  data: ArquitecturaProjectListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ArquitecturaProjectRepository {
  findMany(filters: ListArquitecturaProjectsFilters): Promise<ListArquitecturaProjectsResult>;
  findById(id: string, applicationSlug?: string): Promise<ArquitecturaProjectDetail | null>;
  create(data: CreateArquitecturaProjectData): Promise<ArquitecturaProjectDetail>;
  update(id: string, data: UpdateArquitecturaProjectData): Promise<ArquitecturaProjectDetail>;
}

export const ARQUITECTURA_PROJECT_REPOSITORY = Symbol('ArquitecturaProjectRepository');
