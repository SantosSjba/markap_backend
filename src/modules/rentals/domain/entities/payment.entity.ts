export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'YAPE'
  | 'PLIN'
  | 'CHECK'
  | 'OTHER';

/** Cuota / registro de pago de alquiler. */
export class Payment {
  constructor(
    public readonly id: string,
    public readonly rentalId: string,
    public readonly periodYear: number,
    public readonly periodMonth: number,
    public readonly dueDate: Date,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
    public readonly paidDate: Date | null,
    public readonly paidAmount: number | null,
    public readonly paymentMethod: string | null,
    public readonly referenceNumber: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
  ) {}
}

/** Fila de listado de cuotas pendientes / atrasadas. */
export class PendingPaymentItem {
  constructor(
    public readonly paymentId: string,
    public readonly rentalId: string,
    public readonly rentalCode: string,
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly tenantHistoryNote: string | null,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly periodYear: number,
    public readonly periodMonth: number,
    public readonly periodLabel: string,
    public readonly dueDate: Date,
    public readonly daysOverdue: number,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
  ) {}
}

/** Fila de historial de pagos cobrados. */
export class PaymentHistoryItem {
  constructor(
    public readonly paymentId: string,
    public readonly rentalId: string,
    public readonly rentalCode: string,
    public readonly tenantName: string,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly periodYear: number,
    public readonly periodMonth: number,
    public readonly periodLabel: string,
    public readonly paidDate: Date,
    public readonly paidAmount: number,
    public readonly currency: string,
    public readonly paymentMethod: string,
    public readonly referenceNumber: string | null,
    public readonly notes: string | null,
  ) {}
}

/** Inquilino con deuda acumulada (vista agregada). */
export class OverduePaymentItem {
  constructor(
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly tenantDocument: string | null,
    public readonly tenantPhone: string | null,
    public readonly tenantEmail: string | null,
    public readonly overdueLevel: 'critical' | 'high' | 'moderate',
    public readonly totalOwed: number,
    public readonly currency: string,
    public readonly monthsOverdue: number,
    public readonly maxDaysOverdue: number,
    public readonly lastPaymentDate: Date | null,
    public readonly lastCommunicationDate: Date | null,
    public readonly lastCommunicationNote: string | null,
    public readonly propertyAddress: string,
    public readonly ownerName: string,
    public readonly rentalId: string,
  ) {}
}

/** Monto en una moneda (soles y dólares no se suman). */
export class PaymentCurrencyAmount {
  constructor(
    public readonly currency: string,
    public readonly amount: number,
    public readonly count: number,
  ) {}
}

/** Totales de cobranza del período actual. */
export class PaymentStats {
  constructor(
    /** Totales de la moneda principal (compatibilidad); el detalle va en `*ByCurrency` */
    public readonly totalPending: number,
    public readonly totalCollected: number,
    public readonly pendingCount: number,
    public readonly overdueCount: number,
    public readonly currency: string,
    /** Saldo por cobrar de las cuotas del mes, por moneda */
    public readonly pendingByCurrency: PaymentCurrencyAmount[] = [],
    /** Cobrado en las cuotas del mes, por moneda */
    public readonly collectedByCurrency: PaymentCurrencyAmount[] = [],
  ) {}
}

/** Resumen de todos los contratos con atraso (no solo la página). */
export class OverdueSummary {
  constructor(
    public readonly owedByCurrency: PaymentCurrencyAmount[],
    public readonly criticalCount: number,
    /** Contratos con atraso que ya tienen una nota de comunicación */
    public readonly withCommunicationCount: number,
  ) {}
}
