import { Inject, Injectable } from '@nestjs/common';
import {
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  type BudgetRowFields,
  type BudgetRowPosition,
  type InteriorProjectBudgetRepository,
  type UpdateBudgetHeaderPayload,
} from '../../../domain/repositories/interior-project-budget.repository';

/**
 * Casos de uso del presupuesto tipo hoja. Toda mutación devuelve la hoja completa recalculada
 * (códigos, subtotales y totales), así el editor no repite reglas de cálculo.
 */

abstract class BudgetUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    protected readonly repo: InteriorProjectBudgetRepository,
  ) {}
}

@Injectable()
export class GetInteriorProjectBudgetUseCase extends BudgetUseCase {
  execute(projectId: string, applicationSlug = 'interiorismo') {
    return this.repo.getSheet(projectId, applicationSlug);
  }
}

@Injectable()
export class GetInteriorProjectSettlementUseCase extends BudgetUseCase {
  execute(projectId: string, applicationSlug = 'interiorismo') {
    return this.repo.getSettlement(projectId, applicationSlug);
  }
}

@Injectable()
export class UpdateInteriorBudgetHeaderUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    payload: UpdateBudgetHeaderPayload,
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.updateHeader(projectId, payload, applicationSlug);
  }
}

@Injectable()
export class CreateInteriorBudgetRowsUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    position: BudgetRowPosition,
    rows: BudgetRowFields[],
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.createRows(projectId, position, rows, applicationSlug);
  }
}

@Injectable()
export class UpdateInteriorBudgetRowUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    rowId: string,
    payload: BudgetRowFields,
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.updateRow(projectId, rowId, payload, applicationSlug);
  }
}

@Injectable()
export class MoveInteriorBudgetRowUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    rowId: string,
    target: { parentId: string | null; index: number },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.moveRow(projectId, rowId, target, applicationSlug);
  }
}

@Injectable()
export class DeleteInteriorBudgetRowUseCase extends BudgetUseCase {
  execute(projectId: string, rowId: string, applicationSlug = 'interiorismo') {
    return this.repo.deleteRow(projectId, rowId, applicationSlug);
  }
}

@Injectable()
export class CreateInteriorBudgetSupplierPaymentUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    rowId: string,
    payload: { amount: number; paidAt: Date; note?: string | null },
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.addSupplierPayment(
      projectId,
      rowId,
      payload,
      applicationSlug,
    );
  }
}

@Injectable()
export class DeleteInteriorBudgetSupplierPaymentUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    paymentId: string,
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.deleteSupplierPayment(
      projectId,
      paymentId,
      applicationSlug,
    );
  }
}

@Injectable()
export class ActivateInteriorBudgetVersionUseCase extends BudgetUseCase {
  execute(
    projectId: string,
    budgetId: string,
    applicationSlug = 'interiorismo',
  ) {
    return this.repo.activateVersion(projectId, budgetId, applicationSlug);
  }
}
