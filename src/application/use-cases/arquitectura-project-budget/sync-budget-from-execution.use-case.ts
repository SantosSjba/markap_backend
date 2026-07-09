import { Inject, Injectable } from '@nestjs/common';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/arquitectura-project-budget.repository';
import type {
  ArquitecturaProjectBudgetRepository,
  ProjectBudgetDetailDto,
} from '@domain/repositories/arquitectura-project-budget.repository';

export interface SyncBudgetFromExecutionResult {
  updatedLineItems: number;
  unmatchedConcepts: string[];
  budget: ProjectBudgetDetailDto;
}

@Injectable()
export class SyncArquitecturaProjectBudgetFromExecutionUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'arquitectura'): Promise<SyncBudgetFromExecutionResult> {
    return this.repo.syncActualCostsFromExecution(projectId, applicationSlug);
  }
}
