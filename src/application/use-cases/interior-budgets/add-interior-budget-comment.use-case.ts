import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class AddInteriorBudgetCommentUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(budgetId: string, body: string, authorUserId?: string | null) {
    const trimmed = body?.trim();
    if (!trimmed) throw new BadRequestException('El comentario no puede estar vacío');

    const exists = await this.repo.findById(budgetId, 'interiorismo');
    if (!exists) throw new NotFoundException('Presupuesto no encontrado');

    return this.repo.addComment(budgetId, trimmed, authorUserId);
  }
}
