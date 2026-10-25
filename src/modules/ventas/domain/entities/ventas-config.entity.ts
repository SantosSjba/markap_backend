/** Etapa del embudo de ventas configurada por aplicación. */
export class VentasPipelineStage {
  constructor(
    public readonly code: string,
    public readonly label: string,
    public readonly sortOrder: number,
    public readonly isActive: boolean,
  ) {}
}

/** Serie de numeración para códigos (ej. procesos de venta). */
export class VentasNumberingSeries {
  constructor(
    public readonly seriesKey: string,
    public readonly prefix: string,
    public readonly lastNumber: number,
  ) {}
}

/** Tipo de inmueble del catálogo global (lectura). */
export class VentasPropertyTypeCatalogItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
  ) {}
}
