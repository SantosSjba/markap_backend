import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
  type UpdateInteriorBudgetPayload,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class UpdateInteriorBudgetUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(id: string, payload: UpdateInteriorBudgetPayload, actorUserId?: string | null) {
    const exists = await this.repo.findById(id, 'interiorismo');
    if (!exists) throw new NotFoundException('Presupuesto no encontrado');

    try {
      return await this.repo.update(id, payload, actorUserId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('not found')) throw new NotFoundException('Presupuesto no encontrado');
      throw e;
    }
  }
}
