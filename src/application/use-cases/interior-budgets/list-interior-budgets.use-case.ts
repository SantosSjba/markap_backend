import { Injectable, Inject } from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
  type ListInteriorBudgetsFilters,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class ListInteriorBudgetsUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  execute(filters: ListInteriorBudgetsFilters) {
    return this.repo.list(filters);
  }
}
