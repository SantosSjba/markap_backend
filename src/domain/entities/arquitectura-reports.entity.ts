/** Rango de fechas para reportes arquitectura (YYYY-MM-DD). */
export type ArquitecturaReportsDateRange = {
  startDate: string;
  endDate: string;
};

export type ArquitecturaReportsVentasDto = {
  cobranzasPeriodo: number;
  pagosRegistradosPeriodo: number;
  proyectosConCobroEnPeriodo: number;
  carteraPendienteCuotas: number;
};

export type ArquitecturaReportsConversionDto = {
  proyectosPorEstado: { status: string; count: number }[];
  proyectosNuevosPeriodo: number;
  proyectosFinalizadosPeriodo: number;
  presupuestosAprobadosPeriodo: number;
  presupuestosRechazadosPeriodo: number;
  presupuestosEnviadosSnapshot: number;
  tasaCierrePresupuestoPct: number | null;
};

export type ArquitecturaReportsRentabilidadDto = {
  volumenPresupuestosAprobadosPeriodo: number;
  costosEjecucionPeriodo: number;
  comprasMaterialesPeriodo: number;
  margenBrutoEstimado: number;
  margenBrutoPct: number | null;
};

export type ArquitecturaReportsProductividadDto = {
  tareasTotales: number;
  tareasCompletadasSnapshot: number;
  tareasCompletadasPeriodo: number;
  pctAvanceTareas: number | null;
  evidenciasPeriodo: number;
  incidenciasAbiertas: number;
  progresoPromedioProyectosPct: number | null;
};

export type ArquitecturaReportsCostosCategoriaDto = {
  category: string;
  total: number;
};

export type ArquitecturaReportsCostosDto = {
  ejecucionPorCategoria: ArquitecturaReportsCostosCategoriaDto[];
  comprasProveedoresPeriodo: number;
  totalCostosPeriodo: number;
};

export type ArquitecturaReportsKpisDto = {
  proyectosActivos: number;
  proyectosEnEjecucion: number;
  clientesTotales: number;
  presupuestosBorrador: number;
};

export type ArquitecturaReportsDashboardDto = {
  applicationSlug: string;
  range: ArquitecturaReportsDateRange;
  ventas: ArquitecturaReportsVentasDto;
  conversion: ArquitecturaReportsConversionDto;
  rentabilidad: ArquitecturaReportsRentabilidadDto;
  productividad: ArquitecturaReportsProductividadDto;
  costos: ArquitecturaReportsCostosDto;
  kpis: ArquitecturaReportsKpisDto;
};
