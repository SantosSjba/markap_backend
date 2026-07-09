import { Inject, Injectable } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_BUDGET_REPOSITORY,
  type ArquitecturaProjectBudgetRepository,
  type ListProjectBudgetSummariesFilters,
} from '@domain/repositories/arquitectura-project-budget.repository';

@Injectable()
export class ListArquitecturaProjectBudgetSummariesUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(filters: ListProjectBudgetSummariesFilters) {
    return this.repo.listBudgetSummaries(filters);
  }
}
