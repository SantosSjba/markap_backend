import { Inject, Injectable, Optional } from '@nestjs/common';
import { todayDateOnlyLima } from '../../../../../shared/domain/utils/peru-date.util';
import { INTERIOR_PROJECT_ACTIVE_STATUS_CODES } from '../../../domain/constants/interior-project-stages.constants';
import { INTERIOR_PROJECT_STATUS_CODES } from '../../../domain/constants/interior-project-stages.constants';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
  type InteriorProjectStats,
  type InteriorProjectStatus,
} from '../../../domain/repositories/interior-project.repository';

/** Reloj inyectable para los tests (mes actual en Lima). */
export const INTERIOR_PROJECT_STATS_CLOCK = Symbol('InteriorProjectStatsClock');

const ACTIVE = new Set<string>(INTERIOR_PROJECT_ACTIVE_STATUS_CODES);

/**
 * Indicadores del listado de proyectos: conteo por etapa, nuevos del mes y cartera activa
 * (presupuesto estimado de proyectos no finalizados ni cancelados) por moneda, sin mezclarlas.
 */
@Injectable()
export class GetInteriorProjectStatsUseCase {
  private readonly now: () => Date;

  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    @Optional()
    @Inject(INTERIOR_PROJECT_STATS_CLOCK)
    now?: () => Date,
  ) {
    this.now = now ?? (() => new Date());
  }

  async execute(applicationSlug: string): Promise<InteriorProjectStats> {
    const rows = await this.repo.findStatsRows(applicationSlug);
    const currentMonth = todayDateOnlyLima(this.now()).slice(0, 7);

    const byStatus = Object.fromEntries(
      INTERIOR_PROJECT_STATUS_CODES.map((code) => [code, 0]),
    ) as Record<InteriorProjectStatus, number>;
    const budgets = new Map<string, number>();
    let createdThisMonth = 0;

    for (const r of rows) {
      if (r.status in byStatus) byStatus[r.status as InteriorProjectStatus]++;
      if (todayDateOnlyLima(r.createdAt).slice(0, 7) === currentMonth) {
        createdThisMonth++;
      }
      if (ACTIVE.has(r.status) && r.estimatedBudget != null) {
        budgets.set(
          r.currency,
          (budgets.get(r.currency) ?? 0) + r.estimatedBudget,
        );
      }
    }

    return {
      total: rows.length,
      byStatus,
      createdThisMonth,
      activeBudgetByCurrency: [...budgets]
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  }
}
