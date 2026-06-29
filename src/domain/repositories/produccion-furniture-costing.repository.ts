export const PRODUCCION_FURNITURE_COSTING_REPOSITORY = Symbol('ProduccionFurnitureCostingRepository');

export interface CostingMaterialLineDto {
  id: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitCost: number | null;
  lineTotal: number;
}

export interface CostingLaborLineDto {
  id: string;
  laborRateId: string | null;
  description: string;
  hours: number;
  hourlyRate: number;
  lineTotal: number;
}

export interface CostingExtraLineDto {
  id: string;
  catalogItemId: string | null;
  description: string;
  amount: number;
}

export interface CostingTotalsDto {
  materials: number;
  labor: number;
  extras: number;
  totalCost: number;
  referencePrice: number;
  marginAmount: number;
  marginPercent: number | null;
}

export interface CostingSnapshotDto {
  id: string;
  label: string | null;
  materialsTotal: number;
  laborTotal: number;
  extrasTotal: number;
  totalCost: number;
  referencePrice: number;
  marginPercent: number | null;
  createdAt: string;
}

export interface FurnitureCostingDetail {
  furnitureId: string;
  furnitureCode: string;
  furnitureName: string;
  referencePrice: number;
  materials: CostingMaterialLineDto[];
  laborEntries: CostingLaborLineDto[];
  extraExpenses: CostingExtraLineDto[];
  totals: CostingTotalsDto;
  recentSnapshots: CostingSnapshotDto[];
}

export interface CostingLaborEntryInput {
  id?: string;
  laborRateId?: string | null;
  description: string;
  hours: number;
  hourlyRate?: number;
}

export interface CostingExtraExpenseInput {
  id?: string;
  catalogItemId?: string | null;
  description: string;
  amount: number;
}

export interface CostingBomUnitCostInput {
  id: string;
  unitCost: number | null;
}

export interface UpdateFurnitureCostingPayload {
  bomUnitCosts?: CostingBomUnitCostInput[];
  laborEntries?: CostingLaborEntryInput[];
  extraExpenses?: CostingExtraExpenseInput[];
}

export interface CreateCostingSnapshotPayload {
  label?: string | null;
}

export interface ProduccionFurnitureCostingRepository {
  getCosting(furnitureId: string, applicationSlug: string): Promise<FurnitureCostingDetail | null>;
  updateCosting(
    furnitureId: string,
    applicationSlug: string,
    payload: UpdateFurnitureCostingPayload,
  ): Promise<FurnitureCostingDetail>;
  createSnapshot(
    furnitureId: string,
    applicationSlug: string,
    payload: CreateCostingSnapshotPayload,
  ): Promise<CostingSnapshotDto>;
  listSnapshots(furnitureId: string, applicationSlug: string): Promise<CostingSnapshotDto[]>;
}
