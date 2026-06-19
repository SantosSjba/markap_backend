export const INTERIOR_PROJECT_BUDGET_REPOSITORY = Symbol('InteriorProjectBudgetRepository');

export interface ProjectBudgetLineItemDto {
  id: string;
  sectionId: string;
  sortOrder: number;
  description: string;
  budgetedCost: number;
  hasIgv: boolean;
  actualPurchaseCost: number | null;
  supplierName: string | null;
  supplierId: string | null;
  utilityAmount: number;
  totalBeforeIgv: number;
  igvAmount: number;
  price: number;
  emergencyUtilityAmount: number | null;
  totalSupplierPayments: number;
  supplierBalance: number | null;
  supplierPayments: Array<{
    id: string;
    paymentNumber: number;
    amount: number;
    paidAt: string;
  }>;
}

export interface ProjectBudgetSectionDto {
  id: string;
  name: string;
  sortOrder: number;
  lineItems: ProjectBudgetLineItemDto[];
  sectionTotal: number;
}

export interface ProjectBudgetDetailDto {
  projectId: string;
  projectCode: string;
  projectName: string;
  city: string | null;
  interventionLevel: string | null;
  executionTimeNote: string | null;
  currency: string;
  defaultUtilityPct: number;
  defaultIgvPct: number;
  sections: ProjectBudgetSectionDto[];
  totals: {
    budgetedCostTotal: number;
    utilityTotal: number;
    igvTotal: number;
    priceTotal: number;
    actualPurchaseCostTotal: number;
  };
}

export interface ProjectSettlementDto {
  budgetTotal: number;
  igvTotal: number;
  totalActualCost: number;
  totalSupplierPayments: number;
  depositsOnAccount: number;
  totalClientPaid: number;
  pendingToCollect: number;
  milestoneUtility: number;
}

export interface CreateProjectBudgetSectionPayload {
  name: string;
  sortOrder?: number;
}

export interface UpdateProjectBudgetSectionPayload {
  name?: string;
  sortOrder?: number;
}

export interface CreateProjectBudgetLineItemPayload {
  sectionId: string;
  description: string;
  sortOrder?: number;
  budgetedCost: number;
  hasIgv?: boolean;
  actualPurchaseCost?: number | null;
  supplierName?: string | null;
  supplierId?: string | null;
}

export interface UpdateProjectBudgetLineItemPayload {
  description?: string;
  sortOrder?: number;
  budgetedCost?: number;
  hasIgv?: boolean;
  actualPurchaseCost?: number | null;
  supplierName?: string | null;
  supplierId?: string | null;
}

export interface CreateLineItemSupplierPaymentPayload {
  lineItemId: string;
  paymentNumber: number;
  amount: number;
  paidAt: Date;
}

export interface InteriorProjectBudgetRepository {
  getBudget(projectId: string, applicationSlug?: string): Promise<ProjectBudgetDetailDto | null>;
  getSettlement(projectId: string, applicationSlug?: string): Promise<ProjectSettlementDto | null>;
  createSection(
    projectId: string,
    payload: CreateProjectBudgetSectionPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetSectionDto>;
  updateSection(
    projectId: string,
    sectionId: string,
    payload: UpdateProjectBudgetSectionPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetSectionDto>;
  deleteSection(projectId: string, sectionId: string, applicationSlug?: string): Promise<void>;
  createLineItem(
    projectId: string,
    payload: CreateProjectBudgetLineItemPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetLineItemDto>;
  updateLineItem(
    projectId: string,
    lineItemId: string,
    payload: UpdateProjectBudgetLineItemPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetLineItemDto>;
  deleteLineItem(projectId: string, lineItemId: string, applicationSlug?: string): Promise<void>;
  createSupplierPayment(
    projectId: string,
    payload: CreateLineItemSupplierPaymentPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetLineItemDto>;
  deleteSupplierPayment(
    projectId: string,
    paymentId: string,
    applicationSlug?: string,
  ): Promise<void>;
  duplicateBudgetSnapshot(
    projectId: string,
    applicationSlug?: string,
  ): Promise<{
    sectionsCreated: number;
    lineItemsCreated: number;
    budget: ProjectBudgetDetailDto;
  }>;
  syncActualCostsFromExecution(
    projectId: string,
    applicationSlug?: string,
  ): Promise<{
    updatedLineItems: number;
    unmatchedConcepts: string[];
    budget: ProjectBudgetDetailDto;
  }>;
  assertProjectExists(projectId: string, applicationSlug?: string): Promise<void>;
  assertLineItemBelongsToProject(
    projectId: string,
    lineItemId: string,
    applicationSlug?: string,
  ): Promise<void>;
  importBudgetSections(
    projectId: string,
    sections: Array<{
      name: string;
      lineItems: Array<{ description: string; budgetedCost: number; hasIgv?: boolean }>;
    }>,
    replace: boolean,
    applicationSlug?: string,
  ): Promise<{
    sectionsCreated: number;
    lineItemsCreated: number;
    budget: ProjectBudgetDetailDto;
  }>;
}
