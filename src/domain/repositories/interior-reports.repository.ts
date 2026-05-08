import type { InteriorReportsDashboardDto } from '@domain/entities/interior-reports.entity';

export const INTERIOR_REPORTS_REPOSITORY = Symbol('InteriorReportsRepository');

export interface InteriorReportsRepository {
  /**
   * Consolida métricas de proyectos, presupuestos, finanzas, ejecución y compras.
   * @returns `null` si no existe la aplicación para el slug indicado.
   */
  getDashboard(
    applicationSlug: string,
    startDate?: string,
    endDate?: string,
  ): Promise<InteriorReportsDashboardDto | null>;
}
