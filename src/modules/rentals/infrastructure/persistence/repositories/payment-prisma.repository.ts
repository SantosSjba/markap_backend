import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  parseDateOnly,
  startOfDayLima,
  startOfTodayLima,
  todayDateOnlyLima,
} from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { containsI } from '../../../../../shared/utils/prisma-contains-insensitive.util';
import type { PaymentStatus } from '../../../domain/entities/payment.entity';
import {
  OverduePaymentItem,
  Payment,
  PaymentHistoryItem,
  PaymentStats,
  PendingPaymentItem,
} from '../../../domain/entities/payment.entity';
import type {
  ListPaymentHistoryFilters,
  ListPaymentHistoryResult,
  ListPendingPaymentsFilters,
  PaymentRepository,
  RegisterPaymentData,
} from '../../../domain/repositories/payment.repository';
import { rentalPaymentState } from '../../../domain/utils/rental-payment-state.util';
import { PaymentPrismaMapper } from '../mappers/payment-prisma.mapper';
import { legacyRentalCode } from '../../../domain/utils/rental-code.util';

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

@Injectable()
export class PaymentPrismaRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Genera (upsert) cuotas PENDING para el mes actual de todos los alquileres
  // ACTIVE que no tengan pago registrado aún.
  // ─────────────────────────────────────────────────────────────────────────
  async generateMonthlyPending(applicationSlug: string): Promise<number> {
    const todayYmd = todayDateOnlyLima();
    const year = Number(todayYmd.slice(0, 4));
    const month = Number(todayYmd.slice(5, 7)); // 1-12
    const monthStart = parseDateOnly(`${year}-${pad2(month)}-01`);
    const monthEnd = parseDateOnly(
      `${year}-${pad2(month)}-${pad2(lastDayOfMonth(year, month))}`,
    );

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
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
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
      const dueDate = parseDateOnly(`${year}-${pad2(month)}-${pad2(dueDay)}`);

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

    // Actualizar a OVERDUE los pagos PENDING cuya dueDate ya pasó (día civil Lima)
    await this.prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: startOfTodayLima() },
        rental: { applicationId: app.id, deletedAt: null },
      },
      data: { status: 'OVERDUE' },
    });

    return created;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listPending(
    filters: ListPendingPaymentsFilters,
  ): Promise<PendingPaymentItem[]> {
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
        status: statusFilter,
        rental: {
          applicationId: app.id,
          status: 'ACTIVE',
          deletedAt: null,
          ...(filters.search?.trim()
            ? {
                OR: [
                  { tenant: { fullName: containsI(filters.search.trim()) } },
                  {
                    property: { addressLine: containsI(filters.search.trim()) },
                  },
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
      orderBy: [{ createdAt: 'desc' }, { dueDate: 'desc' }],
    });

    const today = startOfTodayLima();

    return payments.map((p) => {
      const due = startOfDayLima(p.dueDate);
      const diffMs = today.getTime() - due.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return new PendingPaymentItem(
        p.id,
        p.rentalId,
        p.rental.code ?? legacyRentalCode(p.rentalId, p.rental.startDate),
        p.rental.tenant.id,
        p.rental.tenant.fullName,
        p.rental.tenant.notes ?? null,
        `${p.rental.property.addressLine}, ${p.rental.property.district?.name ?? ''}`
          .trim()
          .replace(/,$/, ''),
        p.rental.property.owner?.fullName ?? '—',
        p.periodYear,
        p.periodMonth,
        `${MONTH_NAMES_ES[p.periodMonth - 1]} ${p.periodYear}`,
        p.dueDate,
        daysOverdue,
        Math.max(0, Math.round((p.amount - (p.paidAmount ?? 0)) * 100) / 100),
        p.currency,
        p.status as PaymentStatus,
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  async registerPayment(
    paymentId: string,
    data: RegisterPaymentData,
  ): Promise<Payment> {
    const updated = await this.prisma.$transaction(async (tx) => {
      // eslint-disable-next-line no-restricted-properties -- Bloqueo transaccional de lectura; no modifica filas.
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Cuota no encontrada');
      let state: ReturnType<typeof rentalPaymentState>;
      try {
        state = rentalPaymentState(
          payment.amount,
          payment.paidAmount ?? 0,
          data.paidAmount,
        );
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Abono no válido',
        );
      }
      return tx.payment.update({
        where: { id: paymentId },
        data: {
          paidDate: data.paidDate,
          paidAmount: state.paidAmount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber ?? null,
          notes: data.notes ?? null,
          status: state.status,
          createdBy: data.registeredBy ?? null,
        },
      });
    });
    return PaymentPrismaMapper.toDomain(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listHistory(
    filters: ListPaymentHistoryFilters,
  ): Promise<ListPaymentHistoryResult> {
    const app = await this.prisma.application.findFirst({
      where: { slug: filters.applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app)
      return {
        data: [],
        total: 0,
        totalAmount: 0,
        page: filters.page,
        limit: filters.limit,
      };

    const where: Prisma.PaymentWhereInput = {
      status: { in: ['PAID', 'PARTIAL'] },
      rental: { applicationId: app.id, deletedAt: null },
    };

    if (filters.periodYear) where.periodYear = filters.periodYear;
    if (filters.periodMonth) where.periodMonth = filters.periodMonth;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        {
          rental: {
            OR: [
              { tenant: { fullName: containsI(q) } },
              { tenants: { some: { client: { fullName: containsI(q) } } } },
              { property: { addressLine: containsI(q) } },
            ],
          },
        },
        { referenceNumber: containsI(q) },
      ];
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
        orderBy: [{ paidDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalAmountAgg = await this.prisma.payment.aggregate({
      where,
      _sum: { paidAmount: true },
    });

    const data: PaymentHistoryItem[] = payments.map(
      (p) =>
        new PaymentHistoryItem(
          p.id,
          p.rentalId,
          p.rental.code ?? legacyRentalCode(p.rentalId, p.rental.startDate),
          p.rental.tenant.fullName,
          `${p.rental.property.addressLine}, ${p.rental.property.district?.name ?? ''}`
            .trim()
            .replace(/,$/, ''),
          p.rental.property.owner?.fullName ?? '—',
          p.periodYear,
          p.periodMonth,
          `${MONTH_NAMES_ES[p.periodMonth - 1]} ${p.periodYear}`,
          p.paidDate!,
          p.paidAmount!,
          p.currency,
          p.paymentMethod ?? 'OTHER',
          p.referenceNumber ?? null,
          p.notes ?? null,
        ),
    );

    return {
      data,
      total,
      totalAmount: totalAmountAgg._sum.paidAmount ?? 0,
      page: filters.page,
      limit: filters.limit,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listOverdue(
    applicationSlug: string,
    search?: string,
  ): Promise<OverduePaymentItem[]> {
    const app = await this.prisma.application.findFirst({
      where: { slug: applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return [];

    const where: Prisma.PaymentWhereInput = {
      OR: [
        { status: 'OVERDUE' },
        { status: 'PARTIAL', dueDate: { lt: startOfTodayLima() } },
      ],
      rental: { applicationId: app.id, status: 'ACTIVE', deletedAt: null },
    };

    if (search?.trim()) {
      const q = search.trim();
      where.rental = {
        ...(where.rental as Prisma.RentalWhereInput),
        OR: [
          { tenant: { fullName: containsI(q) } },
          { property: { addressLine: containsI(q) } },
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
      orderBy: [{ createdAt: 'desc' }, { dueDate: 'desc' }],
    });

    // Pre-fetch lastCommunicationNote/Date for rentals in the result set
    const rentalIds = [...new Set(overduePayments.map((p) => p.rental.id))];
    const rentalNotes = await this.prisma.rental.findMany({
      where: { id: { in: rentalIds } },
      select: {
        id: true,
        lastCommunicationNote: true,
        lastCommunicationDate: true,
      },
    });
    const rentalNoteMap = new Map(
      rentalNotes.map((r) => [
        r.id,
        { note: r.lastCommunicationNote, date: r.lastCommunicationDate },
      ]),
    );

    // Agrupa por contrato para no mezclar propiedades ni monedas.
    const grouped = new Map<
      string,
      {
        tenant: {
          id: string;
          fullName: string;
          documentNumber: string | null;
          primaryPhone: string | null;
          primaryEmail: string | null;
          notes: string | null;
        };
        payments: typeof overduePayments;
        rental: (typeof overduePayments)[0]['rental'];
      }
    >();

    for (const p of overduePayments) {
      const tid = p.rental.id;
      if (!grouped.has(tid)) {
        grouped.set(tid, {
          tenant: p.rental.tenant,
          payments: [],
          rental: p.rental,
        });
      }
      grouped.get(tid)!.payments.push(p);
    }

    const today = startOfTodayLima();

    const result: OverduePaymentItem[] = [];
    for (const [, { tenant, payments, rental }] of grouped) {
      const totalOwed = payments.reduce(
        (s, p) => s + Math.max(0, p.amount - (p.paidAmount ?? 0)),
        0,
      );
      const monthsOverdue = payments.length;
      const maxDays = Math.max(
        ...payments.map((p) => {
          const due = startOfDayLima(p.dueDate);
          return Math.floor(
            (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
          );
        }),
      );

      const overdueLevel: 'critical' | 'high' | 'moderate' =
        maxDays > 30 ? 'critical' : maxDays > 14 ? 'high' : 'moderate';

      // Último pago pagado
      const lastPaidPayment = await this.prisma.payment.findFirst({
        where: { rentalId: rental.id, status: { in: ['PAID', 'PARTIAL'] } },
        orderBy: [{ paidDate: 'desc' }, { createdAt: 'desc' }],
        select: { paidDate: true },
      });

      const commNote = rentalNoteMap.get(rental.id);
      result.push(
        new OverduePaymentItem(
          tenant.id,
          tenant.fullName,
          tenant.documentNumber ?? null,
          tenant.primaryPhone ?? null,
          tenant.primaryEmail ?? null,
          overdueLevel,
          totalOwed,
          rental.currency,
          monthsOverdue,
          maxDays,
          lastPaidPayment?.paidDate ?? null,
          commNote?.date ?? null,
          commNote?.note ?? null,
          `${rental.property.addressLine}, ${rental.property.district?.name ?? ''}`
            .trim()
            .replace(/,$/, ''),
          rental.property.owner?.fullName ?? '—',
          rental.id,
        ),
      );
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
    if (!app) return new PaymentStats(0, 0, 0, 0, 'PEN');

    const todayYmd = todayDateOnlyLima();
    const year = Number(todayYmd.slice(0, 4));
    const month = Number(todayYmd.slice(5, 7));

    const [pendingAgg, collectedAgg, pendingCount, overdueCount] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            periodYear: year,
            periodMonth: month,
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            rental: { applicationId: app.id, deletedAt: null },
          },
          _sum: { amount: true, paidAmount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            periodYear: year,
            periodMonth: month,
            status: { in: ['PAID', 'PARTIAL'] },
            rental: { applicationId: app.id, deletedAt: null },
          },
          _sum: { paidAmount: true },
        }),
        this.prisma.payment.count({
          where: {
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            rental: { applicationId: app.id, deletedAt: null },
          },
        }),
        this.prisma.payment.count({
          where: {
            OR: [
              { status: 'OVERDUE' },
              { status: 'PARTIAL', dueDate: { lt: startOfTodayLima() } },
            ],
            rental: { applicationId: app.id, deletedAt: null },
          },
        }),
      ]);

    return new PaymentStats(
      Math.max(
        0,
        (pendingAgg._sum.amount ?? 0) - (pendingAgg._sum.paidAmount ?? 0),
      ),
      collectedAgg._sum.paidAmount ?? 0,
      pendingCount,
      overdueCount,
      'PEN',
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Payment | null> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    return p ? PaymentPrismaMapper.toDomain(p) : null;
  }
}
