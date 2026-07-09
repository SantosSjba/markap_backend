import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/arquitectura-project-budget.repository';
import type { ArquitecturaProjectBudgetRepository } from '@domain/repositories/arquitectura-project-budget.repository';

@Injectable()
export class GetArquitecturaProjectBudgetUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'arquitectura') {
    return this.repo.getBudget(projectId, applicationSlug).then((budget) => {
      if (!budget) throw new NotFoundException('Presupuesto no encontrado');
      return budget;
    });
  }
}

@Injectable()
export class GetArquitecturaProjectSettlementUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'arquitectura') {
    return this.repo.getSettlement(projectId, applicationSlug).then((settlement) => {
      if (!settlement) throw new NotFoundException('Liquidación no disponible');
      return settlement;
    });
  }
}

@Injectable()
export class CreateArquitecturaProjectBudgetSectionUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    payload: { name: string; sortOrder?: number },
    applicationSlug = 'arquitectura',
  ) {
    return this.repo.createSection(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class UpdateArquitecturaProjectBudgetSectionUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    sectionId: string,
    payload: { name?: string; sortOrder?: number },
    applicationSlug = 'arquitectura',
  ) {
    return this.repo.updateSection(projectId, sectionId, payload, applicationSlug);
  }
}

@Injectable()
export class DeleteArquitecturaProjectBudgetSectionUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, sectionId: string, applicationSlug = 'arquitectura') {
    return this.repo.deleteSection(projectId, sectionId, applicationSlug);
  }
}

@Injectable()
export class CreateArquitecturaProjectBudgetLineItemUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
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
    applicationSlug = 'arquitectura',
  ) {
    return this.repo.createLineItem(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class UpdateArquitecturaProjectBudgetLineItemUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
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
    applicationSlug = 'arquitectura',
  ) {
    return this.repo.updateLineItem(projectId, lineItemId, payload, applicationSlug);
  }
}

@Injectable()
export class DeleteArquitecturaProjectBudgetLineItemUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, lineItemId: string, applicationSlug = 'arquitectura') {
    return this.repo.deleteLineItem(projectId, lineItemId, applicationSlug);
  }
}

@Injectable()
export class CreateArquitecturaLineItemSupplierPaymentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    payload: { lineItemId: string; paymentNumber: number; amount: number; paidAt: Date },
    applicationSlug = 'arquitectura',
  ) {
    return this.repo.createSupplierPayment(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class DeleteArquitecturaLineItemSupplierPaymentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, paymentId: string, applicationSlug = 'arquitectura') {
    return this.repo.deleteSupplierPayment(projectId, paymentId, applicationSlug);
  }
}

export { RenderArquitecturaProjectBudgetHtmlUseCase } from './render-arquitectura-project-budget-html.use-case';
export { DuplicateArquitecturaProjectBudgetSnapshotUseCase } from './duplicate-budget-snapshot.use-case';
export { SyncArquitecturaProjectBudgetFromExecutionUseCase } from './sync-budget-from-execution.use-case';
export { ImportArquitecturaProjectBudgetFromExcelUseCase } from './import-budget-from-excel.use-case';
export {
  ListArquitecturaProjectBudgetAttachmentsUseCase,
  UploadArquitecturaProjectBudgetAttachmentUseCase,
  DeleteArquitecturaProjectBudgetAttachmentUseCase,
} from './budget-attachments.use-case';
export { ListArquitecturaProjectBudgetSummariesUseCase } from './list-budget-summaries.use-case';
