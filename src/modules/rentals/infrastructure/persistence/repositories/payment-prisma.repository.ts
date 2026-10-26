import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  formatDateOnly,
  parseDateOnly,
  startOfDayLima,
  startOfTodayLima,
  todayDateOnlyLima,
} from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { containsI } from '../../../../../shared/utils/prisma-contains-insensitive.util';
import type { PaymentStatus } from '../../../domain/entities/payment.entity';
import {
  OverdueSummary,
  OverduePaymentItem,
  Payment,
  PaymentCurrencyAmount,
  PaymentHistoryItem,
  PaymentStats,
  PendingPaymentItem,
} from '../../../domain/entities/payment.entity';
import type {
  ListPaymentHistoryFilters,
  ListOverduePaymentsFilters,
  ListOverduePaymentsResult,
  ListPaymentHistoryResult,
  ListPendingPaymentsFilters,
  ListPendingPaymentsResult,
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

/** Tope de meses que se completan de una vez si la generación de cuotas quedó atrás. */
const MAX_BACKFILL_MONTHS = 12;

/** Búsqueda de contratos por código, inquilino(s), propiedad o propietario. */
function rentalSearchWhere(search?: string): Prisma.RentalWhereInput {
  const q = search?.trim();
  if (!q) return {};
  return {
    OR: [
      { code: containsI(q) },
      { tenant: { fullName: containsI(q) } },
      { tenants: { some: { client: { fullName: containsI(q) } } } },
      { property: { addressLine: containsI(q) } },
      { property: { owner: { fullName: containsI(q) } } },
    ],
  };
}

/** Todos los inquilinos del contrato (el principal si no hay lista). */
function tenantNames(rental: {
  tenant: { fullName: string };
  tenants?: { client: { fullName: string } }[];
}): string {
  return rental.tenants?.length
    ? rental.tenants.map((t) => t.client.fullName).join(', ')
    : rental.tenant.fullName;
}

/** Soles primero; el resto en orden alfabético. */
function sortByCurrency<T extends { currency: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) =>
    a.currency === b.currency
      ? 0
      : a.currency === 'PEN'
        ? -1
        : b.currency === 'PEN'
          ? 1
          : a.currency.localeCompare(b.currency),
  );
}

function sumByCurrency(
  rows: { currency: string; amount: number }[],
): PaymentCurrencyAmount[] {
  const totals = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const t = totals.get(r.currency) ?? { amount: 0, count: 0 };
    t.amount += r.amount;
    t.count += 1;
    totals.set(r.currency, t);
  }
  return sortByCurrency(
    [...totals.entries()].map(
      ([currency, t]) =>
        new PaymentCurrencyAmount(
          currency,
          Math.round(t.amount * 100) / 100,
          t.count,
        ),
    ),
  );
}

@Injectable()
export class PaymentPrismaRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Genera (upsert) las cuotas PENDING hasta el mes actual de los alquileres
  // ACTIVE con cobranza administrada. Si un mes quedó sin generar (nadie abrió
  // Cobranzas), se completa desde la última cuota existente; un contrato sin
  // cuotas empieza en el mes actual (no se crea deuda histórica).
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
        // Sin cobranza activa la inmobiliaria no administra los pagos: no se generan cuotas
        enableCollectionAlerts: true,
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      select: {
        id: true,
        startDate: true,
        monthlyAmount: true,
        currency: true,
        paymentDueDay: true,
      },
    });

    const latest = await this.prisma.payment.findMany({
      where: { rentalId: { in: activeRentals.map((r) => r.id) } },
      distinct: ['rentalId'],
      orderBy: [
        { rentalId: 'asc' },
        { periodYear: 'desc' },
        { periodMonth: 'desc' },
      ],
      select: { rentalId: true, periodYear: true, periodMonth: true },
    });
    const latestIndex = new Map(
      latest.map((p) => [p.rentalId, p.periodYear * 12 + p.periodMonth - 1]),
    );
    const currentIndex = year * 12 + month - 1;

    let created = 0;
    for (const rental of activeRentals) {
      const startYmd = formatDateOnly(rental.startDate);
      const rentalStartIndex =
        Number(startYmd.slice(0, 4)) * 12 + Number(startYmd.slice(5, 7)) - 1;
      const last = latestIndex.get(rental.id);
      const from = Math.max(
        last != null ? last + 1 : currentIndex,
        rentalStartIndex,
        currentIndex - MAX_BACKFILL_MONTHS + 1,
      );
      const dueDay = Math.min(rental.paymentDueDay, 28);
      for (let index = from; index <= currentIndex; index++) {
        const y = Math.floor(index / 12);
        const m = (index % 12) + 1;
        await this.prisma.payment.upsert({
          where: {
            rentalId_periodYear_periodMonth: {
              rentalId: rental.id,
              periodYear: y,
              periodMonth: m,
            },
          },
          create: {
            rentalId: rental.id,
            periodYear: y,
            periodMonth: m,
            dueDate: parseDateOnly(`${y}-${pad2(m)}-${pad2(dueDay)}`),
            amount: rental.monthlyAmount,
            currency: rental.currency,
            status: 'PENDING',
          },
          update: {},
        });
        created++;
      }
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
  ): Promise<ListPendingPaymentsResult> {
    const empty = {
      data: [],
      total: 0,
      page: filters.page,
      limit: filters.limit,
    };
    const app = await this.prisma.application.findFirst({
      where: { slug: filters.applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return empty;

    const statusFilter =
      !filters.status || filters.status === 'ALL'
        ? { in: ['PENDING', 'OVERDUE', 'PARTIAL'] }
        : { equals: filters.status as string };

    const where: Prisma.PaymentWhereInput = {
      status: statusFilter,
      ...(filters.rentalId ? { rentalId: filters.rentalId } : {}),
      rental: {
        applicationId: app.id,
        status: 'ACTIVE',
        deletedAt: null,
        enableCollectionAlerts: true,
        ...rentalSearchWhere(filters.search),
      },
    };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          rental: {
            include: {
              tenant: { select: { id: true, fullName: true, notes: true } },
              tenants: {
                orderBy: { sortOrder: 'asc' },
                include: { client: { select: { fullName: true } } },
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
        // Lo más antiguo (y más atrasado) primero
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    const today = startOfTodayLima();

    const data = payments.map((p) => {
      const due = startOfDayLima(p.dueDate);
      const diffMs = today.getTime() - due.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return new PendingPaymentItem(
        p.id,
        p.rentalId,
        p.rental.code ?? legacyRentalCode(p.rentalId, p.rental.startDate),
        p.rental.tenant.id,
        tenantNames(p.rental),
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
    return { data, total, page: filters.page, limit: filters.limit };
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
        totalsByCurrency: [],
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
              { code: containsI(q) },
              { tenant: { fullName: containsI(q) } },
              { tenants: { some: { client: { fullName: containsI(q) } } } },
              { property: { addressLine: containsI(q) } },
              { property: { owner: { fullName: containsI(q) } } },
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

    const totalsRows = await this.prisma.payment.groupBy({
      by: ['currency'],
      where,
      _sum: { paidAmount: true },
      _count: { _all: true },
    });
    const totalsByCurrency = sortByCurrency(
      totalsRows.map(
        (r) =>
          new PaymentCurrencyAmount(
            r.currency,
            Math.round((r._sum.paidAmount ?? 0) * 100) / 100,
            r._count._all,
          ),
      ),
    );

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
      totalAmount: totalsByCurrency.reduce((acc, t) => acc + t.amount, 0),
      totalsByCurrency,
      page: filters.page,
      limit: filters.limit,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  async listOverdue(
    filters: ListOverduePaymentsFilters,
  ): Promise<ListOverduePaymentsResult> {
    const empty = {
      data: [],
      total: 0,
      page: filters.page,
      limit: filters.limit,
      summary: new OverdueSummary([], 0, 0),
    };
    const app = await this.prisma.application.findFirst({
      where: { slug: filters.applicationSlug, deletedAt: null },
      select: { id: true },
    });
    if (!app) return empty;

    const today = startOfTodayLima();
    const overduePayments = await this.prisma.payment.findMany({
      where: {
        OR: [
          { status: 'OVERDUE' },
          { status: 'PARTIAL', dueDate: { lt: today } },
        ],
        rental: {
          applicationId: app.id,
          status: 'ACTIVE',
          deletedAt: null,
          enableCollectionAlerts: true,
          ...rentalSearchWhere(filters.search),
        },
      },
      select: {
        rentalId: true,
        amount: true,
        paidAmount: true,
        dueDate: true,
        currency: true,
      },
    });

    // Agrupa por contrato para no mezclar propiedades ni monedas.
    const grouped = new Map<
      string,
      { owed: number; months: number; maxDays: number; currency: string }
    >();
    for (const p of overduePayments) {
      const days = Math.floor(
        (today.getTime() - startOfDayLima(p.dueDate).getTime()) / 86_400_000,
      );
      const row = grouped.get(p.rentalId) ?? {
        owed: 0,
        months: 0,
        maxDays: 0,
        currency: p.currency,
      };
      row.owed += Math.max(0, p.amount - (p.paidAmount ?? 0));
      row.months += 1;
      row.maxDays = Math.max(row.maxDays, days);
      grouped.set(p.rentalId, row);
    }
    const levelOf = (maxDays: number): 'critical' | 'high' | 'moderate' =>
      maxDays > 30 ? 'critical' : maxDays > 14 ? 'high' : 'moderate';

    // Más atrasados primero; solo la página pide el detalle de cada contrato
    const ordered = [...grouped.entries()].sort(
      (a, b) => b[1].maxDays - a[1].maxDays,
    );
    const rentalIds = ordered.map(([id]) => id);
    const withCommunicationCount = rentalIds.length
      ? await this.prisma.rental.count({
          where: {
            id: { in: rentalIds },
            lastCommunicationDate: { not: null },
          },
        })
      : 0;
    const summary = new OverdueSummary(
      sumByCurrency(
        ordered.map(([, g]) => ({ currency: g.currency, amount: g.owed })),
      ),
      ordered.filter(([, g]) => levelOf(g.maxDays) === 'critical').length,
      withCommunicationCount,
    );

    const pageIds = rentalIds.slice(
      (filters.page - 1) * filters.limit,
      filters.page * filters.limit,
    );
    const [rentals, lastPaid] = await Promise.all([
      this.prisma.rental.findMany({
        where: { id: { in: pageIds } },
        include: {
          tenant: {
            select: {
              id: true,
              fullName: true,
              documentNumber: true,
              primaryPhone: true,
              primaryEmail: true,
            },
          },
          tenants: {
            orderBy: { sortOrder: 'asc' },
            include: { client: { select: { fullName: true } } },
          },
          property: {
            include: {
              owner: { select: { fullName: true } },
              district: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          rentalId: { in: pageIds },
          status: { in: ['PAID', 'PARTIAL'] },
          paidDate: { not: null },
        },
        distinct: ['rentalId'],
        orderBy: [{ rentalId: 'asc' }, { paidDate: 'desc' }],
        select: { rentalId: true, paidDate: true },
      }),
    ]);
    const rentalById = new Map(rentals.map((r) => [r.id, r]));
    const lastPaidById = new Map(lastPaid.map((p) => [p.rentalId, p.paidDate]));

    const data = pageIds.flatMap((id) => {
      const rental = rentalById.get(id);
      const g = grouped.get(id);
      if (!rental || !g) return [];
      return [
        new OverduePaymentItem(
          rental.tenant.id,
          tenantNames(rental),
          rental.tenant.documentNumber ?? null,
          rental.tenant.primaryPhone ?? null,
          rental.tenant.primaryEmail ?? null,
          levelOf(g.maxDays),
          Math.round(g.owed * 100) / 100,
          rental.currency,
          g.months,
          g.maxDays,
          lastPaidById.get(id) ?? null,
          rental.lastCommunicationDate ?? null,
          rental.lastCommunicationNote ?? null,
          `${rental.property.addressLine}, ${rental.property.district?.name ?? ''}`
            .trim()
            .replace(/,$/, ''),
          rental.property.owner?.fullName ?? '—',
          rental.id,
        ),
      ];
    });

    return {
      data,
      total: ordered.length,
      page: filters.page,
      limit: filters.limit,
      summary,
    };
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

    // Solo contratos cuya cobranza administra la inmobiliaria; lo pendiente,
    // igual que los listados (contratos vigentes)
    const collectedRental = {
      applicationId: app.id,
      deletedAt: null,
      enableCollectionAlerts: true,
    };
    const pendingRental = { ...collectedRental, status: 'ACTIVE' };
    const [pendingRows, collectedRows, pendingCount, overdueCount] =
      await Promise.all([
        this.prisma.payment.groupBy({
          by: ['currency'],
          where: {
            periodYear: year,
            periodMonth: month,
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            rental: pendingRental,
          },
          _sum: { amount: true, paidAmount: true },
          _count: { _all: true },
        }),
        this.prisma.payment.groupBy({
          by: ['currency'],
          where: {
            periodYear: year,
            periodMonth: month,
            status: { in: ['PAID', 'PARTIAL'] },
            rental: collectedRental,
          },
          _sum: { paidAmount: true },
          _count: { _all: true },
        }),
        this.prisma.payment.count({
          where: {
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            rental: pendingRental,
          },
        }),
        this.prisma.payment.count({
          where: {
            OR: [
              { status: 'OVERDUE' },
              { status: 'PARTIAL', dueDate: { lt: startOfTodayLima() } },
            ],
            rental: pendingRental,
          },
        }),
      ]);

    const pendingByCurrency = sortByCurrency(
      pendingRows.map(
        (r) =>
          new PaymentCurrencyAmount(
            r.currency,
            Math.max(
              0,
              Math.round(
                ((r._sum.amount ?? 0) - (r._sum.paidAmount ?? 0)) * 100,
              ) / 100,
            ),
            r._count._all,
          ),
      ),
    );
    const collectedByCurrency = sortByCurrency(
      collectedRows.map(
        (r) =>
          new PaymentCurrencyAmount(
            r.currency,
            Math.round((r._sum.paidAmount ?? 0) * 100) / 100,
            r._count._all,
          ),
      ),
    );
    const main = pendingByCurrency[0]?.currency ?? 'PEN';
    const amountIn = (rows: PaymentCurrencyAmount[]) =>
      rows.find((r) => r.currency === main)?.amount ?? 0;

    return new PaymentStats(
      amountIn(pendingByCurrency),
      amountIn(collectedByCurrency),
      pendingCount,
      overdueCount,
      main,
      pendingByCurrency,
      collectedByCurrency,
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Payment | null> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    return p ? PaymentPrismaMapper.toDomain(p) : null;
  }
}
