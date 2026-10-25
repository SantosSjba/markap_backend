/** Etapa de ciclo de proyecto interiorismo configurada por aplicación. */
export class InteriorismoProjectStage {
  constructor(
    public readonly code: string,
    public readonly label: string,
    public readonly sortOrder: number,
    public readonly isActive: boolean,
  ) {}
}

/** Serie de numeración para códigos de proyecto interiorismo. */
export class InteriorismoNumberingSeries {
  constructor(
    public readonly seriesKey: string,
    public readonly prefix: string,
    public readonly lastNumber: number,
  ) {}
}
