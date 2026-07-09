export const ARQUITECTURA_EXECUTION_REPOSITORY = Symbol('ArquitecturaExecutionRepository');

export interface ArquitecturaExecutionMilestoneDto {
  id: string;
  title: string;
  plannedDate: string;
  completedAt: string | null;
}

export interface ArquitecturaExecutionTaskDto {
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

export interface ArquitecturaExecutionEvidenceDto {
  id: string;
  projectId: string;
  taskId: string | null;
  kind: string;
  title: string;
  fileUrl: string;
  capturedAt: string;
}

export interface ArquitecturaExecutionIncidentDto {
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

export interface ArquitecturaExecutionActualCostDto {
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

export interface ArquitecturaExecutionBudgetReferenceDto {
  budgetId: string | null;
  code: string | null;
  version: number | null;
  grandTotal: number | null;
}

export interface ArquitecturaExecutionCostTotalsDto {
  labor: number;
  material: number;
  expense: number;
  transport: number;
  total: number;
}

export interface ArquitecturaExecutionOverviewDto {
  projectId: string;
  projectCode: string;
  projectName: string;
  progressPct: number;
  milestones: ArquitecturaExecutionMilestoneDto[];
  tasks: ArquitecturaExecutionTaskDto[];
  evidences: ArquitecturaExecutionEvidenceDto[];
  incidents: ArquitecturaExecutionIncidentDto[];
  actualCosts: ArquitecturaExecutionActualCostDto[];
  costTotals: ArquitecturaExecutionCostTotalsDto;
  budgetReference: ArquitecturaExecutionBudgetReferenceDto;
  varianceVsBudget: number | null;
}

export interface CreateArquitecturaExecutionTaskPayload {
  phase: string;
  title: string;
  description?: string | null;
  kanbanStatus?: string;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  progressPct?: number;
}

export interface UpdateArquitecturaExecutionTaskPayload {
  phase?: string;
  title?: string;
  description?: string | null;
  kanbanStatus?: string;
  sortOrder?: number;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  progressPct?: number;
}

export interface CreateArquitecturaExecutionEvidencePayload {
  taskId?: string | null;
  kind: string;
  title: string;
  fileUrl: string;
  capturedAt: Date;
}

export interface CreateArquitecturaExecutionIncidentPayload {
  severity: string;
  title: string;
  description?: string | null;
  reportedAt: Date;
}

export interface UpdateArquitecturaExecutionIncidentPayload {
  status?: string;
  title?: string;
  description?: string | null;
  severity?: string;
  closedAt?: Date | null;
}

export interface CreateArquitecturaExecutionActualCostPayload {
  costCategory: string;
  concept: string;
  amount: number;
  occurredAt: Date;
  catalogMaterialId?: string | null;
}

export interface ArquitecturaExecutionRepository {
  ensureProjectScope(projectId: string, applicationSlug?: string): Promise<boolean>;
  getOverview(
    projectId: string,
    applicationSlug?: string,
  ): Promise<ArquitecturaExecutionOverviewDto | null>;
  createTask(
    projectId: string,
    payload: CreateArquitecturaExecutionTaskPayload,
  ): Promise<ArquitecturaExecutionTaskDto>;
  updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateArquitecturaExecutionTaskPayload,
  ): Promise<ArquitecturaExecutionTaskDto | null>;
  deleteTask(projectId: string, taskId: string): Promise<boolean>;
  createEvidence(
    projectId: string,
    payload: CreateArquitecturaExecutionEvidencePayload,
  ): Promise<ArquitecturaExecutionEvidenceDto>;
  deleteEvidence(projectId: string, evidenceId: string): Promise<boolean>;
  createIncident(
    projectId: string,
    payload: CreateArquitecturaExecutionIncidentPayload,
  ): Promise<ArquitecturaExecutionIncidentDto>;
  updateIncident(
    projectId: string,
    incidentId: string,
    payload: UpdateArquitecturaExecutionIncidentPayload,
  ): Promise<ArquitecturaExecutionIncidentDto | null>;
  createActualCost(
    projectId: string,
    payload: CreateArquitecturaExecutionActualCostPayload,
  ): Promise<ArquitecturaExecutionActualCostDto>;
  deleteActualCost(projectId: string, costId: string): Promise<boolean>;
}
