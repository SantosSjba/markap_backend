/** Etapa de ciclo de proyecto arquitectura configurada por aplicación. */
export class ArquitecturaProjectStage {
  constructor(
    public readonly code: string,
    public readonly label: string,
    public readonly sortOrder: number,
    public readonly isActive: boolean,
  ) {}
}

/** Serie de numeración para códigos de proyecto arquitectura. */
export class ArquitecturaNumberingSeries {
  constructor(
    public readonly seriesKey: string,
    public readonly prefix: string,
    public readonly lastNumber: number,
  ) {}
}
