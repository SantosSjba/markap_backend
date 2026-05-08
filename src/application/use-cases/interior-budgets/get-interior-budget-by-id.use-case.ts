import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';

@Injectable()
export class GetInteriorBudgetByIdUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? 'interiorismo');
    if (!row) throw new NotFoundException('Presupuesto no encontrado');
    return row;
  }
}
