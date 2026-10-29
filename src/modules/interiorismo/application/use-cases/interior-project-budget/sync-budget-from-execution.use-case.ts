import { Inject, Injectable } from '@nestjs/common';
import {
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  type InteriorProjectBudgetRepository,
} from '../../../domain/repositories/interior-project-budget.repository';

/** Lleva a «costo real» los costos de Ejecución cuyo concepto coincide con la descripción. */
@Injectable()
export class SyncInteriorProjectBudgetFromExecutionUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'interiorismo') {
    return this.repo.syncActualCostsFromExecution(projectId, applicationSlug);
  }
}
