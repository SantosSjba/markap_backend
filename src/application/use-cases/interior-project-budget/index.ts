import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/interior-project-budget.repository';
import type { InteriorProjectBudgetRepository } from '@domain/repositories/interior-project-budget.repository';

@Injectable()
export class GetInteriorProjectBudgetUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'interiorismo') {
    return this.repo.getBudget(projectId, applicationSlug).then((budget) => {
      if (!budget) throw new NotFoundException('Presupuesto no encontrado');
      return budget;
    });
  }
}

@Injectable()
export class GetInteriorProjectSettlementUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'interiorismo') {
    return this.repo.getSettlement(projectId, applicationSlug).then((settlement) => {
      if (!settlement) throw new NotFoundException('Liquidación no disponible');
      return settlement;
    });
  }
}

@Injectable()
export class CreateInteriorProjectBudgetSectionUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    payload: { name: string; sortOrder?: number },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.createSection(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class UpdateInteriorProjectBudgetSectionUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    sectionId: string,
    payload: { name?: string; sortOrder?: number },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.updateSection(projectId, sectionId, payload, applicationSlug);
  }
}

@Injectable()
export class DeleteInteriorProjectBudgetSectionUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, sectionId: string, applicationSlug = 'interiorismo') {
    return this.repo.deleteSection(projectId, sectionId, applicationSlug);
  }
}

@Injectable()
export class CreateInteriorProjectBudgetLineItemUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    payload: {
      sectionId: string;
      description: string;
      sortOrder?: number;
      budgetedCost: number;
      hasIgv?: boolean;
      actualPurchaseCost?: number | null;
      supplierName?: string | null;
      supplierId?: string | null;
    },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.createLineItem(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class UpdateInteriorProjectBudgetLineItemUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    lineItemId: string,
    payload: {
      description?: string;
      sortOrder?: number;
      budgetedCost?: number;
      hasIgv?: boolean;
      actualPurchaseCost?: number | null;
      supplierName?: string | null;
      supplierId?: string | null;
    },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.updateLineItem(projectId, lineItemId, payload, applicationSlug);
  }
}

@Injectable()
export class DeleteInteriorProjectBudgetLineItemUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, lineItemId: string, applicationSlug = 'interiorismo') {
    return this.repo.deleteLineItem(projectId, lineItemId, applicationSlug);
  }
}

@Injectable()
export class CreateInteriorLineItemSupplierPaymentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    payload: { lineItemId: string; paymentNumber: number; amount: number; paidAt: Date },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.createSupplierPayment(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class DeleteInteriorLineItemSupplierPaymentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, paymentId: string, applicationSlug = 'interiorismo') {
    return this.repo.deleteSupplierPayment(projectId, paymentId, applicationSlug);
  }
}
