import { Inject, Injectable } from '@nestjs/common';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/interior-project-budget.repository';
import type {
  InteriorProjectBudgetRepository,
  ProjectBudgetDetailDto,
} from '@domain/repositories/interior-project-budget.repository';

export interface SyncBudgetFromExecutionResult {
  updatedLineItems: number;
  unmatchedConcepts: string[];
  budget: ProjectBudgetDetailDto;
}

@Injectable()
export class SyncInteriorProjectBudgetFromExecutionUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'interiorismo'): Promise<SyncBudgetFromExecutionResult> {
    return this.repo.syncActualCostsFromExecution(projectId, applicationSlug);
  }
}
