import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class AddInteriorBudgetAttachmentUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(
    budgetId: string,
    title: string,
    fileUrl: string,
    actorUserId?: string | null,
  ) {
    const t = title?.trim();
    const u = fileUrl?.trim();
    if (!t) throw new BadRequestException('Título del adjunto requerido');
    if (!u) throw new BadRequestException('URL del archivo requerida');

    const exists = await this.repo.findById(budgetId, 'interiorismo');
    if (!exists) throw new NotFoundException('Presupuesto no encontrado');

    return this.repo.addAttachment(budgetId, t, u, actorUserId);
  }
}
