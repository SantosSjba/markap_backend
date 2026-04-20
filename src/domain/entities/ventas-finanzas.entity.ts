/**
 * Perfil de comisión de agente en el módulo Ventas — Finanzas.
 * El repositorio puede devolver filas enriquecidas; esta entidad fija el contrato mínimo cuando aplique.
 */
export class VentasAgentCommissionProfile {
  constructor(
    public readonly applicationId: string,
    public readonly agentId: string,
    public readonly commissionPercent: number,
  ) {}
}
