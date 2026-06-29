export const PRODUCCION_WORK_ORDER_REPOSITORY = Symbol('ProduccionWorkOrderRepository');

export const PRODUCCION_DEFAULT_STAGES = [
  { stageKey: 'planificacion', label: 'Planificación', sortOrder: 0 },
  { stageKey: 'corte', label: 'Corte', sortOrder: 1 },
  { stageKey: 'ensamble', label: 'Ensamble', sortOrder: 2 },
  { stageKey: 'acabados', label: 'Acabados', sortOrder: 3 },
] as const;

export type ProduccionWorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProduccionWorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ProduccionWorkOrderStageStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface ProduccionWorkOrderLineDto {
  id: string;
  furnitureId: string;
  furnitureCode: string;
  furnitureName: string;
  quantity: number;
  notes: string | null;
}

export interface ProduccionWorkOrderStageDto {
  id: string;
  stageKey: string;
  label: string;
  sortOrder: number;
  status: ProduccionWorkOrderStageStatus;
  assignee: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface ProduccionWorkOrderMaterialConsumptionDto {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  notes: string | null;
  consumedAt: string;
}

export interface ProduccionWorkOrderListItem {
  id: string;
  code: string;
  status: ProduccionWorkOrderStatus;
  priority: ProduccionWorkOrderPriority;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  progressPercent: number;
  clientId: string | null;
  clientName: string | null;
  furnitureSummary: string;
  assignedTo: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  updatedAt: string;
}

export interface ProduccionWorkOrderDetail {
  id: string;
  code: string;
  status: ProduccionWorkOrderStatus;
  priority: ProduccionWorkOrderPriority;
  currentStageKey: string | null;
  progressPercent: number;
  clientId: string | null;
  clientName: string | null;
  assignedTo: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  lines: ProduccionWorkOrderLineDto[];
  stages: ProduccionWorkOrderStageDto[];
  consumptions: ProduccionWorkOrderMaterialConsumptionDto[];
  updatedAt: string;
}

export interface ProduccionWorkOrderStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  byStage: { stageKey: string; label: string; count: number }[];
}

export interface CreateProduccionWorkOrderLinePayload {
  furnitureId: string;
  quantity?: number;
  notes?: string | null;
}

export interface CreateProduccionWorkOrderPayload {
  clientId?: string | null;
  priority?: ProduccionWorkOrderPriority;
  assignedTo?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  notes?: string | null;
  lines: CreateProduccionWorkOrderLinePayload[];
}

export interface UpdateProduccionWorkOrderPayload {
  clientId?: string | null;
  priority?: ProduccionWorkOrderPriority;
  assignedTo?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  notes?: string | null;
  lines?: CreateProduccionWorkOrderLinePayload[];
}

export interface UpdateProduccionWorkOrderStagePayload {
  assignee?: string | null;
  notes?: string | null;
  markDone?: boolean;
}

export interface ConsumeProduccionWorkOrderMaterialPayload {
  materialId: string;
  quantity: number;
  notes?: string | null;
}

export interface ListProduccionWorkOrdersFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: ProduccionWorkOrderStatus;
  stageKey?: string;
  clientId?: string;
  priority?: ProduccionWorkOrderPriority;
}

export interface ListProduccionWorkOrdersResult {
  data: ProduccionWorkOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionWorkOrderRepository {
  list(filters: ListProduccionWorkOrdersFilters): Promise<ListProduccionWorkOrdersResult>;
  getStats(applicationSlug: string): Promise<ProduccionWorkOrderStats>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionWorkOrderDetail | null>;
  create(applicationId: string, payload: CreateProduccionWorkOrderPayload): Promise<ProduccionWorkOrderDetail>;
  update(id: string, payload: UpdateProduccionWorkOrderPayload): Promise<ProduccionWorkOrderDetail>;
  start(id: string): Promise<ProduccionWorkOrderDetail>;
  updateStage(id: string, stageId: string, payload: UpdateProduccionWorkOrderStagePayload): Promise<ProduccionWorkOrderDetail>;
  complete(id: string): Promise<ProduccionWorkOrderDetail>;
  cancel(id: string): Promise<ProduccionWorkOrderDetail>;
  consumeMaterials(id: string, items: ConsumeProduccionWorkOrderMaterialPayload[]): Promise<ProduccionWorkOrderDetail>;
  delete(id: string): Promise<void>;
}
