import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  PaymentRepository,
  PaymentData,
  PaymentStatus,
  PendingPaymentItem,
  PaymentHistoryItem,
  OverduePaymentItem,
  PaymentStats,
  RegisterPaymentData,
  ListPendingPaymentsFilters,
  ListPaymentHistoryFilters,
  ListPaymentHistoryResult,
} from '../../../../application/repositories/payment.repository';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Injectable()
export class PaymentPrismaRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Genera (upsert) cuotas PENDING para el mes actual de todos los alquileres
  // ACTIVE que no tengan pago registrado aún.
  // ─────────────────────────────────────────────────────────────────────────
  async generateMonthlyPending(applicationSlug: string): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    const app = await this.prisma.application.findFirst({
      where: { slug: applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return 0;

    const activeRentals = await this.prisma.rental.findMany({
      where: {
        applicationId: app.id,
        status: 'ACTIVE',
        deletedAt: null,
        startDate: { lte: new Date(year, month - 1 + 1, 0) }, // startDate <= fin del mes
        endDate: { gte: new Date(year, month - 1, 1) },        // endDate >= inicio del mes
      },
      select: {
        id: true,
        monthlyAmount: true,
        currency: true,
        paymentDueDay: true,
      },
    });

    let created = 0;
    for (const rental of activeRentals) {
      const dueDay = Math.min(rental.paymentDueDay, 28);
      const dueDate = new Date(year, month - 1, dueDay);

      await this.prisma.payment.upsert({
        where: {
          rentalId_periodYear_periodMonth: {
            rentalId: rental.id,
            periodYear: year,
            periodMonth: month,
          },
        },
        create: {
          rentalId: rental.id,
          periodYear: year,
          periodMonth: month,
          dueDate,
          amount: rental.monthlyAmount,
          currency: rental.currency,
          status: 'PENDING',
        },
        update: {},
      });
      created++;
    }

    // Actualizar a OVERDUE los pagos PENDING cuya dueDate ya pasó
    await this.prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
        rental: { applicationId: app.id, deletedAt: null },
      },
      data: { status: 'OVERDUE' },
    });

    return created;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listPending(filters: ListPendingPaymentsFilters): Promise<PendingPaymentItem[]> {
    const app = await this.prisma.application.findFirst({
      where: { slug: filters.applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return [];

    const statusFilter =
      !filters.status || filters.status === 'ALL'
        ? { in: ['PENDING', 'OVERDUE', 'PARTIAL'] }
        : { equals: filters.status as string };

    const payments = await this.prisma.payment.findMany({
      where: {
        status: statusFilter as any,
        rental: {
          applicationId: app.id,
          status: 'ACTIVE',
          deletedAt: null,
          ...(filters.search
            ? {
                OR: [
                  { tenant: { fullName: { contains: filters.search } } },
                  { property: { addressLine: { contains: filters.search } } },
                ],
              }
            : {}),
        },
      },
      include: {
        rental: {
          include: {
            tenant: { select: { id: true, fullName: true, notes: true } },
            property: {
              include: {
                owner: { select: { fullName: true } },
                district: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { rental: { tenant: { fullName: 'asc' } } }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return payments.map((p) => {
      const due = new Date(p.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffMs = today.getTime() - due.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        paymentId: p.id,
        rentalId: p.rentalId,
        rentalCode: `ALQ-${p.rentalId.slice(-6).toUpperCase()}`,
        tenantId: p.rental.tenant.id,
        tenantName: p.rental.tenant.fullName,
        tenantHistoryNote: p.rental.tenant.notes ?? null,
        propertyAddress: `${p.rental.property.addressLine}, ${p.rental.property.district?.name ?? ''}`.trim().replace(/,$/, ''),
        ownerName: p.rental.property.owner?.fullName ?? '—',
        periodYear: p.periodYear,
        periodMonth: p.periodMonth,
        periodLabel: `${MONTH_NAMES_ES[p.periodMonth - 1]} ${p.periodYear}`,
        dueDate: p.dueDate,
        daysOverdue,
        amount: p.amount,
        currency: p.currency,
        status: p.status as PaymentStatus,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  async registerPayment(paymentId: string, data: RegisterPaymentData): Promise<PaymentData> {
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        paidDate: data.paidDate,
        paidAmount: data.paidAmount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber ?? null,
        notes: data.notes ?? null,
        status: 'PAID',
        createdBy: data.registeredBy ?? null,
      },
    });
    return this.mapPayment(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listHistory(filters: ListPaymentHistoryFilters): Promise<ListPaymentHistoryResult> {
    const app = await this.prisma.application.findFirst({
      where: { slug: filters.applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return { data: [], total: 0, totalAmount: 0, page: filters.page, limit: filters.limit };

    const where: any = {
      status: 'PAID',
      rental: { applicationId: app.id, deletedAt: null },
    };

    if (filters.periodYear) where.periodYear = filters.periodYear;
    if (filters.periodMonth) where.periodMonth = filters.periodMonth;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.search) {
      where.rental = {
        ...where.rental,
        OR: [
          { tenant: { fullName: { contains: filters.search } } },
          { property: { addressLine: { contains: filters.search } } },
        ],
      };
      if (filters.search) {
        where.OR = [
          ...(where.OR ?? []),
          { referenceNumber: { contains: filters.search } },
        ];
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          rental: {
            include: {
              tenant: { select: { fullName: true } },
              property: {
                include: {
                  owner: { select: { fullName: true } },
                  district: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { paidDate: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalAmountAgg = await this.prisma.payment.aggregate({
      where,
      _sum: { paidAmount: true },
    });

    const data: PaymentHistoryItem[] = payments.map((p) => ({
      paymentId: p.id,
      rentalId: p.rentalId,
      rentalCode: `ALQ-${p.rentalId.slice(-6).toUpperCase()}`,
      tenantName: p.rental.tenant.fullName,
      propertyAddress: `${p.rental.property.addressLine}, ${p.rental.property.district?.name ?? ''}`.trim().replace(/,$/, ''),
      ownerName: p.rental.property.owner?.fullName ?? '—',
      periodYear: p.periodYear,
      periodMonth: p.periodMonth,
      periodLabel: `${MONTH_NAMES_ES[p.periodMonth - 1]} ${p.periodYear}`,
      paidDate: p.paidDate!,
      paidAmount: p.paidAmount!,
      currency: p.currency,
      paymentMethod: p.paymentMethod ?? 'OTHER',
      referenceNumber: p.referenceNumber ?? null,
      notes: p.notes ?? null,
    }));

    return {
      data,
      total,
      totalAmount: totalAmountAgg._sum.paidAmount ?? 0,
      page: filters.page,
      limit: filters.limit,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listOverdue(applicationSlug: string, search?: string): Promise<OverduePaymentItem[]> {
    const app = await this.prisma.application.findFirst({
      where: { slug: applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return [];

    const where: any = {
      status: 'OVERDUE',
      rental: { applicationId: app.id, status: 'ACTIVE', deletedAt: null },
    };

    if (search) {
      where.rental = {
        ...where.rental,
        OR: [
          { tenant: { fullName: { contains: search } } },
          { property: { addressLine: { contains: search } } },
        ],
      };
    }

    const overduePayments = await this.prisma.payment.findMany({
      where,
      include: {
        rental: {
          include: {
            tenant: {
              select: {
                id: true,
                fullName: true,
                documentNumber: true,
                primaryPhone: true,
                primaryEmail: true,
                notes: true,
              },
            },
            property: {
              include: {
                owner: { select: { fullName: true } },
                district: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Pre-fetch lastCommunicationNote/Date for rentals in the result set
    const rentalIds = [...new Set(overduePayments.map((p) => p.rental.id))];
    const rentalNotes = await this.prisma.rental.findMany({
      where: { id: { in: rentalIds } },
      select: { id: true, lastCommunicationNote: true, lastCommunicationDate: true },
    });
    const rentalNoteMap = new Map(
      rentalNotes.map((r) => [r.id, { note: r.lastCommunicationNote, date: r.lastCommunicationDate }]),
    );

    // Agrupa por tenantId
    const grouped = new Map<
      string,
      {
        tenant: { id: string; fullName: string; documentNumber: string | null; primaryPhone: string | null; primaryEmail: string | null; notes: string | null };
        payments: typeof overduePayments;
        rental: (typeof overduePayments)[0]['rental'];
      }
    >();

    for (const p of overduePayments) {
      const tid = p.rental.tenant.id;
      if (!grouped.has(tid)) {
        grouped.set(tid, { tenant: p.rental.tenant, payments: [], rental: p.rental });
      }
      grouped.get(tid)!.payments.push(p);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: OverduePaymentItem[] = [];
    for (const [, { tenant, payments, rental }] of grouped) {
      const totalOwed = payments.reduce((s, p) => s + p.amount, 0);
      const monthsOverdue = payments.length;
      const maxDays = Math.max(
        ...payments.map((p) => {
          const due = new Date(p.dueDate);
          due.setHours(0, 0, 0, 0);
          return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }),
      );

      const overdueLevel: OverduePaymentItem['overdueLevel'] =
        maxDays > 30 ? 'critical' : maxDays > 14 ? 'high' : 'moderate';

      // Último pago pagado
      const lastPaidPayment = await this.prisma.payment.findFirst({
        where: { rentalId: rental.id, status: 'PAID' },
        orderBy: { paidDate: 'desc' },
        select: { paidDate: true },
      });

      const commNote = rentalNoteMap.get(rental.id);
      result.push({
        tenantId: tenant.id,
        tenantName: tenant.fullName,
        tenantDocument: tenant.documentNumber ?? null,
        tenantPhone: tenant.primaryPhone ?? null,
        tenantEmail: tenant.primaryEmail ?? null,
        overdueLevel,
        totalOwed,
        currency: rental.currency,
        monthsOverdue,
        maxDaysOverdue: maxDays,
        lastPaymentDate: lastPaidPayment?.paidDate ?? null,
        lastCommunicationDate: commNote?.date ?? null,
        lastCommunicationNote: commNote?.note ?? null,
        propertyAddress: `${rental.property.addressLine}, ${rental.property.district?.name ?? ''}`.trim().replace(/,$/, ''),
        ownerName: rental.property.owner?.fullName ?? '—',
        rentalId: rental.id,
      });
    }

    result.sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async getStats(applicationSlug: string): Promise<PaymentStats> {
    const app = await this.prisma.application.findFirst({
      where: { slug: applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return { totalPending: 0, totalCollected: 0, pendingCount: 0, overdueCount: 0, currency: 'PEN' };

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [pendingAgg, collectedAgg, pendingCount, overdueCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { periodYear: year, periodMonth: month, status: { in: ['PENDING', 'OVERDUE'] }, rental: { applicationId: app.id, deletedAt: null } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { periodYear: year, periodMonth: month, status: 'PAID', rental: { applicationId: app.id, deletedAt: null } },
        _sum: { paidAmount: true },
      }),
      this.prisma.payment.count({
        where: { status: { in: ['PENDING', 'OVERDUE'] }, rental: { applicationId: app.id, deletedAt: null } },
      }),
      this.prisma.payment.count({
        where: { status: 'OVERDUE', rental: { applicationId: app.id, deletedAt: null } },
      }),
    ]);

    return {
      totalPending: pendingAgg._sum.amount ?? 0,
      totalCollected: collectedAgg._sum.paidAmount ?? 0,
      pendingCount,
      overdueCount,
      currency: 'PEN',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<PaymentData | null> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    return p ? this.mapPayment(p) : null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  private mapPayment(p: any): PaymentData {
    return {
      id: p.id,
      rentalId: p.rentalId,
      periodYear: p.periodYear,
      periodMonth: p.periodMonth,
      dueDate: p.dueDate,
      amount: p.amount,
      currency: p.currency,
      status: p.status as PaymentStatus,
      paidDate: p.paidDate ?? null,
      paidAmount: p.paidAmount ?? null,
      paymentMethod: p.paymentMethod ?? null,
      referenceNumber: p.referenceNumber ?? null,
      notes: p.notes ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      createdBy: p.createdBy ?? null,
    };
  }
}
