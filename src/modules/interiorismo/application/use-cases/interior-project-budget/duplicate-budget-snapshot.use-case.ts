import { Inject, Injectable } from '@nestjs/common';
import {
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  type InteriorProjectBudgetRepository,
} from '../../../domain/repositories/interior-project-budget.repository';

/** Copia el presupuesto activo (filas, costos reales y abonos) como nueva versión activa. */
@Injectable()
export class DuplicateInteriorProjectBudgetSnapshotUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'interiorismo') {
    return this.repo.duplicateActive(projectId, applicationSlug);
  }
}
