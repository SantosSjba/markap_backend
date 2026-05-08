/** Rango de fechas para reportes interiorismo (YYYY-MM-DD). */
export type InteriorReportsDateRange = {
  startDate: string;
  endDate: string;
};

export type InteriorReportsVentasDto = {
  cobranzasPeriodo: number;
  pagosRegistradosPeriodo: number;
  proyectosConCobroEnPeriodo: number;
  carteraPendienteCuotas: number;
};

export type InteriorReportsConversionDto = {
  proyectosPorEstado: { status: string; count: number }[];
  proyectosNuevosPeriodo: number;
  proyectosFinalizadosPeriodo: number;
  presupuestosAprobadosPeriodo: number;
  presupuestosRechazadosPeriodo: number;
  presupuestosEnviadosSnapshot: number;
  tasaCierrePresupuestoPct: number | null;
};

export type InteriorReportsRentabilidadDto = {
  volumenPresupuestosAprobadosPeriodo: number;
  costosEjecucionPeriodo: number;
  comprasMaterialesPeriodo: number;
  margenBrutoEstimado: number;
  margenBrutoPct: number | null;
};

export type InteriorReportsProductividadDto = {
  tareasTotales: number;
  tareasCompletadasSnapshot: number;
  tareasCompletadasPeriodo: number;
  pctAvanceTareas: number | null;
  evidenciasPeriodo: number;
  incidenciasAbiertas: number;
  progresoPromedioProyectosPct: number | null;
};

export type InteriorReportsCostosCategoriaDto = {
  category: string;
  total: number;
};

export type InteriorReportsCostosDto = {
  ejecucionPorCategoria: InteriorReportsCostosCategoriaDto[];
  comprasProveedoresPeriodo: number;
  totalCostosPeriodo: number;
};

export type InteriorReportsKpisDto = {
  proyectosActivos: number;
  proyectosEnEjecucion: number;
  clientesTotales: number;
  presupuestosBorrador: number;
};

export type InteriorReportsDashboardDto = {
  applicationSlug: string;
  range: InteriorReportsDateRange;
  ventas: InteriorReportsVentasDto;
  conversion: InteriorReportsConversionDto;
  rentabilidad: InteriorReportsRentabilidadDto;
  productividad: InteriorReportsProductividadDto;
  costos: InteriorReportsCostosDto;
  kpis: InteriorReportsKpisDto;
};
