export const CONTABILIDAD_INVENTORY_REPOSITORY = Symbol('ContabilidadInventoryRepository');

export interface ContabilidadInventoryItemDto {
  id: string;
  code: string;
  description: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  unit: string;
  costMethod: string;
  quantityOnHand: string;
  avgUnitCost: string;
  valuedBalance: string;
  isActive: boolean;
}

export interface ContabilidadInventoryMovementDto {
  id: string;
  itemId: string;
  itemCode: string;
  itemDescription: string;
  periodId: string;
  movementType: string;
  movementDate: string;
  quantity: string;
  unitCost: string;
  totalAmount: string;
  offsetType: string | null;
  notes: string | null;
  journalEntryId: string | null;
  runningQuantity: string;
  runningValue: string;
  createdAt: string;
}

export interface ContabilidadInventoryKardexLineDto {
  id: string;
  movementDate: string;
  movementType: string;
  quantity: string;
  unitCost: string;
  totalAmount: string;
  runningQuantity: string;
  runningValue: string;
  notes: string | null;
  journalEntryId: string | null;
}

export interface ContabilidadInventoryValuedLineDto {
  itemId: string;
  itemCode: string;
  description: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  unit: string;
  costMethod: string;
  quantityOnHand: string;
  avgUnitCost: string;
  valuedBalance: string;
}

export interface ListInventoryItemsFilters {
  search?: string;
  activeOnly?: boolean;
  accountId?: string;
}

export interface ListInventoryMovementsFilters {
  periodId?: string;
  itemId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateInventoryItemInput {
  code: string;
  description: string;
  accountId: string;
  unit?: string;
  costMethod?: string;
}

export interface UpdateInventoryItemInput {
  description?: string;
  accountId?: string;
  unit?: string;
  costMethod?: string;
  isActive?: boolean;
}

export interface CreateInventoryMovementInput {
  itemId: string;
  periodId: string;
  movementType: string;
  movementDate: string;
  quantity: number | string;
  unitCost?: number | string;
  offsetType?: string;
  notes?: string | null;
}

export interface ContabilidadInventoryRepository {
  listItems(
    applicationId: string,
    filters: ListInventoryItemsFilters,
  ): Promise<{ items: ContabilidadInventoryItemDto[] }>;

  getItem(applicationId: string, id: string): Promise<ContabilidadInventoryItemDto | null>;

  createItem(applicationId: string, input: CreateInventoryItemInput): Promise<ContabilidadInventoryItemDto>;

  updateItem(
    applicationId: string,
    id: string,
    input: UpdateInventoryItemInput,
  ): Promise<ContabilidadInventoryItemDto>;

  listMovements(
    applicationId: string,
    filters: ListInventoryMovementsFilters,
  ): Promise<{ movements: ContabilidadInventoryMovementDto[] }>;

  createMovement(
    applicationId: string,
    input: CreateInventoryMovementInput,
    createdBy?: string | null,
  ): Promise<ContabilidadInventoryMovementDto>;

  getKardex(
    applicationId: string,
    itemId: string,
  ): Promise<{ item: ContabilidadInventoryItemDto; lines: ContabilidadInventoryKardexLineDto[] }>;

  getValuedBalance(applicationId: string): Promise<{ lines: ContabilidadInventoryValuedLineDto[]; totalValue: string }>;

  getValuedBalanceByAccount(
    applicationId: string,
  ): Promise<{ accountCode: string; accountName: string; balance: string }[]>;
}
