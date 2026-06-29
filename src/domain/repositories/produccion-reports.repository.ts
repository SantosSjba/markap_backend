export const PRODUCCION_REPORTS_REPOSITORY = Symbol('ProduccionReportsRepository');

export interface ProduccionReportsDateRange {
  startDate: string;
  endDate: string;
}

export interface ProduccionReportsFilters extends ProduccionReportsDateRange {
  applicationSlug: string;
  clientId?: string;
  category?: string;
}

export interface ProduccionReportsWorkOrdersByStatus {
  status: string;
  count: number;
}

export interface ProduccionReportsProduccionDto {
  workOrdersCreated: number;
  workOrdersCompleted: number;
  workOrdersInProgressSnapshot: number;
  workOrdersByStatus: ProduccionReportsWorkOrdersByStatus[];
  materialConsumptionQty: number;
}

export interface ProduccionReportsVentasDto {
  quotationsSent: number;
  quotationsAccepted: number;
  ordersCreated: number;
  ordersDelivered: number;
  salesRevenuePeriod: number;
  pipelineValue: number;
}

export interface ProduccionReportsInventoryByCategory {
  category: string;
  itemCount: number;
  totalValue: number;
}

export interface ProduccionReportsInventarioDto {
  totalMaterials: number;
  activeMaterials: number;
  lowStockCount: number;
  totalStockValue: number;
  stockValueByCategory: ProduccionReportsInventoryByCategory[];
  movementsInPeriod: number;
  stockInValuePeriod: number;
}

export interface ProduccionReportsRentabilidadRow {
  furnitureId: string;
  furnitureCode: string;
  furnitureName: string;
  category: string;
  referencePrice: number;
  estimatedCost: number;
  marginAmount: number;
  marginPercent: number | null;
  unitsSoldPeriod: number;
  revenuePeriod: number;
}

export interface ProduccionReportsRentabilidadDto {
  rows: ProduccionReportsRentabilidadRow[];
  avgMarginPercent: number | null;
}

export interface ProduccionReportsKpisDto {
  openQuotations: number;
  pendingOrders: number;
  activeWorkOrders: number;
  pendingPurchaseOrders: number;
}

export type ProduccionReportsActivityType = 'WORK_ORDER' | 'DELIVERY' | 'STOCK_MOVEMENT';

export interface ProduccionReportsActivityItem {
  type: ProduccionReportsActivityType;
  entityId: string;
  title: string;
  detail: string;
  occurredAt: string;
  materialId?: string;
}

export interface ProduccionReportsDashboardDto {
  applicationSlug: string;
  range: ProduccionReportsDateRange;
  filters: { clientId: string | null; category: string | null };
  produccion: ProduccionReportsProduccionDto;
  ventas: ProduccionReportsVentasDto;
  inventario: ProduccionReportsInventarioDto;
  rentabilidad: ProduccionReportsRentabilidadDto;
  kpis: ProduccionReportsKpisDto;
  recentActivity: ProduccionReportsActivityItem[];
}

export interface ProduccionReportsRepository {
  getDashboard(filters: ProduccionReportsFilters): Promise<ProduccionReportsDashboardDto | null>;
}
