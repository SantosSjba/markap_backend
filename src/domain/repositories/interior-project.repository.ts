export type InteriorProjectType =
  | 'REMODELING'
  | 'INTERIOR_DESIGN'
  | 'IMPLEMENTATION'
  | 'FURNITURE';

export type InteriorProjectStatus =
  | 'PROSPECT'
  | 'DESIGN'
  | 'QUOTE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';

export interface InteriorProjectAgentRef {
  id: string;
  fullName: string;
}

export interface InteriorProjectClientRef {
  id: string;
  fullName: string;
  documentNumber: string;
}

export interface InteriorProjectListItem {
  id: string;
  code: string;
  name: string;
  projectType: InteriorProjectType;
  status: InteriorProjectStatus;
  progressPct: number;
  estimatedEndDate: string | null;
  client: InteriorProjectClientRef;
}

export interface InteriorProjectBudgetDto {
  id: string;
  code: string | null;
  title: string | null;
  version: number;
  totalAmount: number;
  status: string;
}

export interface InteriorProjectMaterialDto {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  estimatedCost: number | null;
}

export interface InteriorProjectDocumentDto {
  id: string;
  docType: string;
  title: string;
  fileUrl: string | null;
}

export interface InteriorProjectPaymentDto {
  id: string;
  paidAt: string;
  amount: number;
  concept: string;
  status: string;
  scheduleItemId: string | null;
}

export interface InteriorProjectActivityDto {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  occurredAt: string;
}

export interface InteriorProjectMilestoneDto {
  id: string;
  title: string;
  plannedDate: string;
  completedAt: string | null;
}

export interface InteriorProjectDetail extends InteriorProjectListItem {
  addressLine: string | null;
  areaSqm: number | null;
  levelsCount: number | null;
  environmentsNote: string | null;
  startDate: string | null;
  estimatedEndDate: string | null;
  designerAgent: InteriorProjectAgentRef | null;
  architectAgent: InteriorProjectAgentRef | null;
  supervisorAgent: InteriorProjectAgentRef | null;
  commercialAgent: InteriorProjectAgentRef | null;
  estimatedBudget: number | null;
  projectedCost: number | null;
  expectedMargin: number | null;
  budgets: InteriorProjectBudgetDto[];
  materials: InteriorProjectMaterialDto[];
  documents: InteriorProjectDocumentDto[];
  payments: InteriorProjectPaymentDto[];
  activities: InteriorProjectActivityDto[];
  milestones: InteriorProjectMilestoneDto[];
}

export interface CreateInteriorProjectData {
  applicationId: string;
  code: string;
  name: string;
  clientId: string;
  projectType: InteriorProjectType;
  status: InteriorProjectStatus;
  addressLine?: string | null;
  areaSqm?: number | null;
  levelsCount?: number | null;
  environmentsNote?: string | null;
  startDate?: Date | null;
  estimatedEndDate?: Date | null;
  designerAgentId?: string | null;
  architectAgentId?: string | null;
  supervisorAgentId?: string | null;
  commercialAgentId?: string | null;
  estimatedBudget?: number | null;
  projectedCost?: number | null;
  expectedMargin?: number | null;
  progressPct?: number | null;
}

export interface UpdateInteriorProjectData {
  name?: string;
  clientId?: string;
  projectType?: InteriorProjectType;
  status?: InteriorProjectStatus;
  addressLine?: string | null;
  areaSqm?: number | null;
  levelsCount?: number | null;
  environmentsNote?: string | null;
  startDate?: Date | null;
  estimatedEndDate?: Date | null;
  designerAgentId?: string | null;
  architectAgentId?: string | null;
  supervisorAgentId?: string | null;
  commercialAgentId?: string | null;
  estimatedBudget?: number | null;
  projectedCost?: number | null;
  expectedMargin?: number | null;
  progressPct?: number | null;
}

export interface ListInteriorProjectsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: InteriorProjectStatus;
  /** Si true, solo estados activos de obra/comercialización */
  inProgressOnly?: boolean;
  /** Filtrar proyectos de un cliente (flujo presupuestos) */
  clientId?: string;
}

export interface ListInteriorProjectsResult {
  data: InteriorProjectListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InteriorProjectRepository {
  findMany(filters: ListInteriorProjectsFilters): Promise<ListInteriorProjectsResult>;
  findById(id: string, applicationSlug?: string): Promise<InteriorProjectDetail | null>;
  create(data: CreateInteriorProjectData): Promise<InteriorProjectDetail>;
  update(id: string, data: UpdateInteriorProjectData): Promise<InteriorProjectDetail>;
}

export const INTERIOR_PROJECT_REPOSITORY = Symbol('InteriorProjectRepository');
