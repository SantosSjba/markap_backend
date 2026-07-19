export const INTERIOR_EXECUTION_REPOSITORY = Symbol('InteriorExecutionRepository');

export interface InteriorExecutionMilestoneDto {
  id: string;
  title: string;
  plannedDate: string;
  completedAt: string | null;
}

export interface InteriorExecutionTaskDto {
  id: string;
  projectId: string;
  phase: string;
  title: string;
  description: string | null;
  kanbanStatus: string;
  sortOrder: number;
  plannedStart: string | null;
  plannedEnd: string | null;
  progressPct: number;
  updatedAt: string;
}

export interface InteriorExecutionEvidenceDto {
  id: string;
  projectId: string;
  taskId: string | null;
  kind: string;
  title: string;
  fileUrl: string;
  archivoId: string | null;
  downloadUrl?: string | null;
  capturedAt: string;
}

export interface InteriorExecutionIncidentDto {
  id: string;
  projectId: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  reportedAt: string;
  closedAt: string | null;
  updatedAt: string;
}

export interface InteriorExecutionActualCostDto {
  id: string;
  projectId: string;
  costCategory: string;
  concept: string;
  amount: number;
  occurredAt: string;
  catalogMaterialId: string | null;
  materialCode: string | null;
  materialName: string | null;
}

export interface InteriorExecutionBudgetReferenceDto {
  budgetId: string | null;
  code: string | null;
  version: number | null;
  grandTotal: number | null;
}

export interface InteriorExecutionCostTotalsDto {
  labor: number;
  material: number;
  expense: number;
  transport: number;
  total: number;
}

export interface InteriorExecutionOverviewDto {
  projectId: string;
  projectCode: string;
  projectName: string;
  progressPct: number;
  milestones: InteriorExecutionMilestoneDto[];
  tasks: InteriorExecutionTaskDto[];
  evidences: InteriorExecutionEvidenceDto[];
  incidents: InteriorExecutionIncidentDto[];
  actualCosts: InteriorExecutionActualCostDto[];
  costTotals: InteriorExecutionCostTotalsDto;
  budgetReference: InteriorExecutionBudgetReferenceDto;
  varianceVsBudget: number | null;
}

export interface CreateInteriorExecutionTaskPayload {
  phase: string;
  title: string;
  description?: string | null;
  kanbanStatus?: string;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  progressPct?: number;
}

export interface UpdateInteriorExecutionTaskPayload {
  phase?: string;
  title?: string;
  description?: string | null;
  kanbanStatus?: string;
  sortOrder?: number;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  progressPct?: number;
}

export interface CreateInteriorExecutionEvidencePayload {
  taskId?: string | null;
  kind: string;
  title: string;
  fileUrl: string;
  archivoId?: string | null;
  capturedAt: Date;
}

export interface CreateInteriorExecutionIncidentPayload {
  severity: string;
  title: string;
  description?: string | null;
  reportedAt: Date;
}

export interface UpdateInteriorExecutionIncidentPayload {
  status?: string;
  title?: string;
  description?: string | null;
  severity?: string;
  closedAt?: Date | null;
}

export interface CreateInteriorExecutionActualCostPayload {
  costCategory: string;
  concept: string;
  amount: number;
  occurredAt: Date;
  catalogMaterialId?: string | null;
}

export interface InteriorExecutionRepository {
  ensureProjectScope(projectId: string, applicationSlug?: string): Promise<boolean>;
  getOverview(
    projectId: string,
    applicationSlug?: string,
  ): Promise<InteriorExecutionOverviewDto | null>;
  createTask(
    projectId: string,
    payload: CreateInteriorExecutionTaskPayload,
  ): Promise<InteriorExecutionTaskDto>;
  updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateInteriorExecutionTaskPayload,
  ): Promise<InteriorExecutionTaskDto | null>;
  deleteTask(projectId: string, taskId: string): Promise<boolean>;
  createEvidence(
    projectId: string,
    payload: CreateInteriorExecutionEvidencePayload,
  ): Promise<InteriorExecutionEvidenceDto>;
  deleteEvidence(projectId: string, evidenceId: string): Promise<boolean>;
  createIncident(
    projectId: string,
    payload: CreateInteriorExecutionIncidentPayload,
  ): Promise<InteriorExecutionIncidentDto>;
  updateIncident(
    projectId: string,
    incidentId: string,
    payload: UpdateInteriorExecutionIncidentPayload,
  ): Promise<InteriorExecutionIncidentDto | null>;
  createActualCost(
    projectId: string,
    payload: CreateInteriorExecutionActualCostPayload,
  ): Promise<InteriorExecutionActualCostDto>;
  deleteActualCost(projectId: string, costId: string): Promise<boolean>;
}
