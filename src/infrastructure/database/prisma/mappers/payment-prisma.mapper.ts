import type { PaymentStatus } from '@domain/entities/payment.entity';
import { Payment } from '@domain/entities/payment.entity';

export class PaymentPrismaMapper {
  static toDomain(p: {
    id: string;
    rentalId: string;
    periodYear: number;
    periodMonth: number;
    dueDate: Date;
    amount: number | { toNumber?: () => number };
    currency: string;
    status: string;
    paidDate: Date | null;
    paidAmount: number | { toNumber?: () => number } | null;
    paymentMethod: string | null;
    referenceNumber: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
  }): Payment {
    const num = (v: number | { toNumber?: () => number } | null | undefined): number | null => {
      if (v == null) return null;
      return typeof v === 'number' ? v : v.toNumber?.() ?? Number(v);
    };
    return new Payment(
      p.id,
      p.rentalId,
      p.periodYear,
      p.periodMonth,
      p.dueDate,
      num(p.amount) ?? 0,
      p.currency,
      p.status as PaymentStatus,
      p.paidDate ?? null,
      num(p.paidAmount),
      p.paymentMethod ?? null,
      p.referenceNumber ?? null,
      p.notes ?? null,
      p.createdAt,
      p.updatedAt,
      p.createdBy ?? null,
    );
  }
}
