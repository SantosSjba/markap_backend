import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class DuplicateInteriorBudgetUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(id: string, actorUserId?: string | null) {
    const src = await this.repo.findById(id, 'interiorismo');
    if (!src) throw new NotFoundException('Presupuesto no encontrado');

    try {
      return await this.repo.duplicateFrom(id, actorUserId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('not found')) throw new NotFoundException('Presupuesto no encontrado');
      throw e;
    }
  }
}
