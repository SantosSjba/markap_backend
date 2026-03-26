// ============================================================
// Payment — Puerto del repositorio (capa de Aplicación)
// Las implementaciones concretas viven en Infraestructura.
// ============================================================

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'YAPE'
  | 'PLIN'
  | 'CHECK'
  | 'OTHER';

export interface PaymentData {
  id: string;
  rentalId: string;
  periodYear: number;
  periodMonth: number;
  dueDate: Date;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidDate: Date | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export interface PendingPaymentItem {
  paymentId: string;
  rentalId: string;
  rentalCode: string;
  tenantId: string;
  tenantName: string;
  tenantHistoryNote: string | null; // nota de historial de pago del inquilino
  propertyAddress: string;
  ownerName: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string; // "Enero 2026"
  dueDate: Date;
  daysOverdue: number; // negativo = días restantes, positivo = días de atraso
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface PaymentHistoryItem {
  paymentId: string;
  rentalId: string;
  rentalCode: string;
  tenantName: string;
  propertyAddress: string;
  ownerName: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  paidDate: Date;
  paidAmount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
}

export interface OverduePaymentItem {
  tenantId: string;
  tenantName: string;
  tenantDocument: string | null;
  tenantPhone: string | null;
  tenantEmail: string | null;
  overdueLevel: 'critical' | 'high' | 'moderate'; // critical >30d, high 15-30d, moderate <15d
  totalOwed: number;
  currency: string;
  monthsOverdue: number; // cuántas cuotas pendientes
  maxDaysOverdue: number; // días del pago más atrasado
  lastPaymentDate: Date | null;
  lastCommunicationDate: Date | null;
  lastCommunicationNote: string | null;
  // Detalles de la propiedad (primera propiedad si tiene varias)
  propertyAddress: string;
  ownerName: string;
  rentalId: string;
}

export interface PaymentStats {
  totalPending: number;       // monto total pendiente del mes
  totalCollected: number;     // monto total cobrado del mes
  pendingCount: number;       // cantidad de pagos pendientes
  overdueCount: number;       // cantidad con atraso
  currency: string;
}

export interface RegisterPaymentData {
  paidDate: Date;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  registeredBy?: string | null;
}

export interface ListPendingPaymentsFilters {
  applicationSlug: string;
  search?: string;
  status?: PaymentStatus | 'ALL';
}

export interface ListPaymentHistoryFilters {
  applicationSlug: string;
  search?: string;
  periodYear?: number;
  periodMonth?: number;
  paymentMethod?: string;
  page: number;
  limit: number;
}

export interface ListPaymentHistoryResult {
  data: PaymentHistoryItem[];
  total: number;
  totalAmount: number;
  page: number;
  limit: number;
}

export interface PaymentRepository {
  /**
   * Genera (upsert) los pagos pendientes del mes actual para todos los alquileres
   * ACTIVE de la aplicación que no tengan pago registrado para ese período.
   */
  generateMonthlyPending(applicationSlug: string): Promise<number>;

  /** Lista pagos pendientes + atrasados del mes actual y anteriores no pagados */
  listPending(filters: ListPendingPaymentsFilters): Promise<PendingPaymentItem[]>;

  /** Registra el pago de una cuota */
  registerPayment(paymentId: string, data: RegisterPaymentData): Promise<PaymentData>;

  /** Historial de pagos realizados con paginación */
  listHistory(filters: ListPaymentHistoryFilters): Promise<ListPaymentHistoryResult>;

  /** Lista inquilinos con pagos en atraso */
  listOverdue(applicationSlug: string, search?: string): Promise<OverduePaymentItem[]>;

  /** Estadísticas del mes actual */
  getStats(applicationSlug: string): Promise<PaymentStats>;

  /** Busca un pago por id */
  findById(id: string): Promise<PaymentData | null>;
}

export const PAYMENT_REPOSITORY = Symbol('PaymentRepository');
