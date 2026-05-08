import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class DeleteInteriorBudgetUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(id: string, applicationSlug?: string): Promise<void> {
    const slug = applicationSlug?.trim() || 'interiorismo';
    const existing = await this.repo.findById(id, slug);
    if (!existing) throw new NotFoundException('Presupuesto no encontrado');
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden eliminar presupuestos en estado borrador.');
    }
    await this.repo.deleteById(id);
  }
}
