import type {
  BudgetIgvMode,
  BudgetMarginMode,
  BudgetRowKind,
  BudgetSheetTotals,
  ComputedBudgetRow,
} from '../budget/budget-sheet.calculator';

export const INTERIOR_PROJECT_BUDGET_REPOSITORY = Symbol(
  'InteriorProjectBudgetRepository',
);

export type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED';
export type BudgetRowStatus = 'PENDING' | 'QUOTED' | 'PURCHASED' | 'GIFT';

export interface BudgetHeaderDto {
  id: string;
  projectId: string;
  version: number;
  isActive: boolean;
  number: string | null;
  issuedAt: string | null;
  executionTerm: string | null;
  executedBy: string | null;
  status: BudgetStatus;
  currency: string;
  exchangeRate: number | null;
  exchangeRateDate: string | null;
  marginMode: BudgetMarginMode;
  utilityPct: number;
  overheadPct: number;
  igvMode: BudgetIgvMode;
  igvPct: number;
  terms: string | null;
  /** Claves de columnas visibles en el editor; null = las predeterminadas */
  visibleColumns: string[] | null;
}

export interface BudgetSupplierPaymentDto {
  id: string;
  amount: number;
  paidAt: string;
  note: string | null;
}

export interface BudgetSheetRowDto extends ComputedBudgetRow {
  /** Código escrito a mano (el mostrado está en `code`) */
  manualCode: string | null;
  status: BudgetRowStatus;
  note: string | null;
  supplierId: string | null;
  supplierName: string | null;
  supplierPayments: BudgetSupplierPaymentDto[];
}

export interface BudgetVersionDto {
  id: string;
  version: number;
  isActive: boolean;
  status: BudgetStatus;
  createdAt: string;
}

export interface BudgetSheetDto {
  project: { id: string; code: string; name: string; currency: string };
  budget: BudgetHeaderDto;
  versions: BudgetVersionDto[];
  /** Filas en orden de lectura, con montos calculados */
  rows: BudgetSheetRowDto[];
  totals: BudgetSheetTotals;
}

export type { ProjectSettlementResult as ProjectSettlementDto } from '../budget/project-settlement.calculator';
import type { ProjectSettlementResult } from '../budget/project-settlement.calculator';

export interface UpdateBudgetHeaderPayload {
  number?: string | null;
  issuedAt?: Date | null;
  executionTerm?: string | null;
  executedBy?: string | null;
  status?: BudgetStatus;
  currency?: string;
  exchangeRate?: number | null;
  exchangeRateDate?: Date | null;
  marginMode?: BudgetMarginMode;
  utilityPct?: number;
  overheadPct?: number;
  igvMode?: BudgetIgvMode;
  igvPct?: number;
  terms?: string | null;
  visibleColumns?: string[] | null;
}

/** Campos editables de una fila (las celdas de la hoja) */
export interface BudgetRowFields {
  kind?: BudgetRowKind;
  code?: string | null;
  description?: string;
  unit?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  directCost?: number | null;
  actualCost?: number | null;
  utilityPctOverride?: number | null;
  hasIgv?: boolean;
  supplierId?: string | null;
  supplierName?: string | null;
  status?: BudgetRowStatus;
  note?: string | null;
}

/** Dónde insertar: dentro de `parentId` (null = raíz), justo después de `afterRowId` (null = al final) */
export interface BudgetRowPosition {
  parentId: string | null;
  afterRowId: string | null;
}

/** Fila importada de Excel (árbol) */
export interface ImportedBudgetRow extends BudgetRowFields {
  kind: BudgetRowKind;
  description: string;
  children?: ImportedBudgetRow[];
}

export interface ImportedBudget {
  header: UpdateBudgetHeaderPayload;
  rows: ImportedBudgetRow[];
}

export interface InteriorProjectBudgetRepository {
  /** Hoja del presupuesto activo (crea la v1 vacía con los valores por defecto del proyecto) */
  getSheet(
    projectId: string,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  getSettlement(
    projectId: string,
    applicationSlug?: string,
  ): Promise<ProjectSettlementResult>;
  updateHeader(
    projectId: string,
    payload: UpdateBudgetHeaderPayload,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  createRows(
    projectId: string,
    position: BudgetRowPosition,
    rows: BudgetRowFields[],
    applicationSlug?: string,
  ): Promise<BudgetSheetDto & { createdRowIds: string[] }>;
  updateRow(
    projectId: string,
    rowId: string,
    payload: BudgetRowFields,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  moveRow(
    projectId: string,
    rowId: string,
    target: { parentId: string | null; index: number },
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  deleteRow(
    projectId: string,
    rowId: string,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  addSupplierPayment(
    projectId: string,
    rowId: string,
    payload: { amount: number; paidAt: Date; note?: string | null },
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  deleteSupplierPayment(
    projectId: string,
    paymentId: string,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  /** Copia el presupuesto activo como nueva versión activa */
  duplicateActive(
    projectId: string,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  activateVersion(
    projectId: string,
    budgetId: string,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto>;
  importRows(
    projectId: string,
    imported: ImportedBudget,
    replace: boolean,
    applicationSlug?: string,
  ): Promise<BudgetSheetDto & { rowsCreated: number }>;
  syncActualCostsFromExecution(
    projectId: string,
    applicationSlug?: string,
  ): Promise<{
    updatedRows: number;
    unmatchedConcepts: string[];
    sheet: BudgetSheetDto;
  }>;
  assertProjectExists(
    projectId: string,
    applicationSlug?: string,
  ): Promise<void>;
  assertRowBelongsToProject(
    projectId: string,
    rowId: string,
    applicationSlug?: string,
  ): Promise<void>;
}
