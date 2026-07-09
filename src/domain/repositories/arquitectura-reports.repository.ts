import type { ArquitecturaReportsDashboardDto } from '@domain/entities/arquitectura-reports.entity';

export const ARQUITECTURA_REPORTS_REPOSITORY = Symbol('ArquitecturaReportsRepository');

export interface ArquitecturaReportsRepository {
  /**
   * Consolida métricas de proyectos, presupuestos, finanzas, ejecución y compras.
   * @returns `null` si no existe la aplicación para el slug indicado.
   */
  getDashboard(
    applicationSlug: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ArquitecturaReportsDashboardDto | null>;
}
