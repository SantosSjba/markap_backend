export type InteriorProjectType =
  | 'REMODELING'
  | 'INTERIOR_DESIGN'
  | 'IMPLEMENTATION'
  | 'FURNITURE';

export type InteriorProjectLifecycleStatus =
  | 'DESIGN'
  | 'QUOTE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'FINISHED';

/** Ciclo comercial + cancelación administrativa. */
export type InteriorProjectStatus =
  | InteriorProjectLifecycleStatus
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

export interface InteriorProjectDistrictRef {
  id: string;
  name: string;
  provinceId: string;
  departmentId: string;
}

export interface InteriorProjectListItem {
  id: string;
  code: string;
  name: string;
  projectType: InteriorProjectType;
  status: InteriorProjectStatus;
  progressPct: number;
  interventionLevel: string | null;
  currency: string;
  estimatedBudget: number | null;
  /** Suma de los cobros al cliente en estado pagado */
  paidTotal: number;
  startDate: string | null;
  estimatedEndDate: string | null;
  district: InteriorProjectDistrictRef | null;
  client: InteriorProjectClientRef;
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
  archivoId: string | null;
}

export interface InteriorProjectPaymentDto {
  id: string;
  paidAt: string;
  amount: number;
  concept: string;
  paymentType: string;
  status: string;
  scheduleItemId: string | null;
  /** null = moneda del presupuesto */
  currency: string | null;
  exchangeRate: number | null;
}

export interface InteriorProjectActivityDto {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  occurredAt: string;
}

/** Tipos que se registran a mano; STATUS_CHANGE lo anota el sistema al cambiar de etapa. */
export const INTERIOR_MANUAL_ACTIVITY_TYPES = [
  'NOTE',
  'MEETING',
  'TASK',
  'OTHER',
] as const;
export type InteriorManualActivityType =
  (typeof INTERIOR_MANUAL_ACTIVITY_TYPES)[number];

export interface CreateInteriorProjectActivityData {
  activityType: InteriorManualActivityType | 'STATUS_CHANGE';
  title: string;
  description?: string | null;
  occurredAt: Date;
}

export interface InteriorProjectMilestoneDto {
  id: string;
  title: string;
  plannedDate: string;
  completedAt: string | null;
}

export interface InteriorProjectDetail extends InteriorProjectListItem {
  legacyCode: string | null;
  addressLine: string | null;
  city: string | null;
  executionTimeNote: string | null;
  exchangeRate: number | null;
  defaultUtilityPct: number;
  defaultOverheadPct: number;
  defaultIgvPct: number;
  areaSqm: number | null;
  levelsCount: number | null;
  environmentsNote: string | null;
  designerAgent: InteriorProjectAgentRef | null;
  architectJrAgent: InteriorProjectAgentRef | null;
  architectSrAgent: InteriorProjectAgentRef | null;
  supervisorAgent: InteriorProjectAgentRef | null;
  commercialAgent: InteriorProjectAgentRef | null;
  estimatedBudget: number | null;
  projectedCost: number | null;
  expectedMargin: number | null;
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
  city?: string | null;
  interventionLevel?: string | null;
  executionTimeNote?: string | null;
  currency?: string;
  defaultUtilityPct?: number | null;
  defaultIgvPct?: number | null;
  defaultOverheadPct?: number | null;
  exchangeRate?: number | null;
  districtId?: string | null;
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

export interface UpdateInteriorProjectData {
  code?: string;
  name?: string;
  clientId?: string;
  projectType?: InteriorProjectType;
  status?: InteriorProjectStatus;
  addressLine?: string | null;
  city?: string | null;
  interventionLevel?: string | null;
  executionTimeNote?: string | null;
  currency?: string;
  defaultUtilityPct?: number | null;
  defaultIgvPct?: number | null;
  defaultOverheadPct?: number | null;
  exchangeRate?: number | null;
  districtId?: string | null;
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
  projectType?: InteriorProjectType;
  /** Proyectos donde el agente figura en cualquiera de los cinco roles */
  agentId?: string;
}

export interface InteriorProjectCurrencyAmount {
  currency: string;
  amount: number;
}

export interface InteriorProjectStats {
  total: number;
  byStatus: Record<InteriorProjectStatus, number>;
  createdThisMonth: number;
  /** Presupuesto estimado de proyectos activos, por moneda (mayor primero) */
  activeBudgetByCurrency: InteriorProjectCurrencyAmount[];
}

/** Fila mínima para calcular los indicadores del listado */
export interface InteriorProjectStatsRow {
  status: string;
  currency: string;
  estimatedBudget: number | null;
  createdAt: Date;
}

export interface ListInteriorProjectsResult {
  data: InteriorProjectListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InteriorProjectRepository {
  findMany(
    filters: ListInteriorProjectsFilters,
  ): Promise<ListInteriorProjectsResult>;
  findById(
    id: string,
    applicationSlug?: string,
  ): Promise<InteriorProjectDetail | null>;
  create(data: CreateInteriorProjectData): Promise<InteriorProjectDetail>;
  update(
    id: string,
    data: UpdateInteriorProjectData,
  ): Promise<InteriorProjectDetail>;
  createActivity(
    projectId: string,
    data: CreateInteriorProjectActivityData,
  ): Promise<void>;
  /** Elimina una actividad registrada a mano; `false` si no existe o es automática */
  deleteManualActivity(projectId: string, activityId: string): Promise<boolean>;
  /** Códigos usados que empiezan con `prefix` (para el sufijo `-2`, `-3`…) */
  listCodesWithPrefix(applicationId: string, prefix: string): Promise<string[]>;
  findStatsRows(applicationSlug: string): Promise<InteriorProjectStatsRow[]>;
  /** Proyectos por cliente (total y activos) para el listado de clientes */
  summarizeByClients(
    applicationSlug: string,
    clientIds: string[],
  ): Promise<InteriorClientProjectsSummary[]>;
  /** Cobros del cliente en todos sus proyectos, más recientes primero */
  findClientPayments(
    applicationSlug: string,
    clientId: string,
  ): Promise<InteriorClientPaymentDto[]>;
}

export interface InteriorClientProjectsSummary {
  clientId: string;
  total: number;
  active: number;
}

export interface InteriorClientPaymentDto {
  id: string;
  paidAt: string;
  amount: number;
  /** Moneda efectiva: la del cobro o, si no tiene, la del proyecto */
  currency: string;
  concept: string;
  paymentType: string;
  status: string;
  project: { id: string; code: string; name: string };
}

export const INTERIOR_PROJECT_REPOSITORY = Symbol('InteriorProjectRepository');
