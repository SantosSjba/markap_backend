import { Inject, Injectable } from '@nestjs/common';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/arquitectura-project-budget.repository';
import type {
  ArquitecturaProjectBudgetRepository,
  ProjectBudgetDetailDto,
} from '@domain/repositories/arquitectura-project-budget.repository';

export interface DuplicateBudgetSnapshotResult {
  sectionsCreated: number;
  lineItemsCreated: number;
  budget: ProjectBudgetDetailDto;
}

@Injectable()
export class DuplicateArquitecturaProjectBudgetSnapshotUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(projectId: string, applicationSlug = 'arquitectura'): Promise<DuplicateBudgetSnapshotResult> {
    return this.repo.duplicateBudgetSnapshot(projectId, applicationSlug);
  }
}
