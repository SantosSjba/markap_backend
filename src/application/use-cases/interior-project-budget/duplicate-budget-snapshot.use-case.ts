import { Inject, Injectable } from '@nestjs/common';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/interior-project-budget.repository';
import type {
  InteriorProjectBudgetRepository,
  ProjectBudgetDetailDto,
} from '@domain/repositories/interior-project-budget.repository';

export interface DuplicateBudgetSnapshotResult {
  sectionsCreated: number;
  lineItemsCreated: number;
  budget: ProjectBudgetDetailDto;
}

@Injectable()
export class DuplicateInteriorProjectBudgetSnapshotUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'interiorismo'): Promise<DuplicateBudgetSnapshotResult> {
    return this.repo.duplicateBudgetSnapshot(projectId, applicationSlug);
  }
}
