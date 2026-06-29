export const PRODUCCION_MATERIAL_REPOSITORY = Symbol('ProduccionMaterialRepository');

export type ProduccionStockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface ProduccionMaterialListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  minStockQty: number;
  currentStock: number;
  isActive: boolean;
  isLowStock: boolean;
  updatedAt: string;
}

export interface ProduccionMaterialDetail extends ProduccionMaterialListItem {
  notes: string | null;
}

export interface CreateProduccionMaterialPayload {
  code: string;
  name: string;
  category: string;
  unit: string;
  unitCost?: number;
  minStockQty?: number;
  isActive?: boolean;
  notes?: string | null;
}

export interface UpdateProduccionMaterialPayload {
  name?: string;
  category?: string;
  unit?: string;
  unitCost?: number;
  minStockQty?: number;
  isActive?: boolean;
  notes?: string | null;
}

export interface ListProduccionMaterialsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  lowStockOnly?: boolean;
}

export interface ListProduccionMaterialsResult {
  data: ProduccionMaterialListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionInventoryStats {
  totalMaterials: number;
  activeMaterials: number;
  lowStockCount: number;
  totalStockValue: number;
}

export interface ProduccionStockMovementDto {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  movementType: ProduccionStockMovementType;
  quantity: number;
  balanceAfter: number;
  unitCost: number | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateProduccionStockMovementPayload {
  materialId: string;
  movementType: ProduccionStockMovementType;
  quantity: number;
  unitCost?: number | null;
  reference?: string | null;
  notes?: string | null;
}

export interface ListProduccionStockMovementsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  materialId?: string;
  movementType?: ProduccionStockMovementType;
  search?: string;
}

export interface ListProduccionStockMovementsResult {
  data: ProduccionStockMovementDto[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionMaterialRepository {
  list(filters: ListProduccionMaterialsFilters): Promise<ListProduccionMaterialsResult>;
  getStats(applicationSlug: string): Promise<ProduccionInventoryStats>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionMaterialDetail | null>;
  create(applicationId: string, payload: CreateProduccionMaterialPayload): Promise<ProduccionMaterialDetail>;
  update(id: string, payload: UpdateProduccionMaterialPayload): Promise<ProduccionMaterialDetail>;
  delete(id: string): Promise<void>;
  listMovements(filters: ListProduccionStockMovementsFilters): Promise<ListProduccionStockMovementsResult>;
  createMovement(
    applicationSlug: string,
    payload: CreateProduccionStockMovementPayload,
  ): Promise<ProduccionStockMovementDto>;
}
