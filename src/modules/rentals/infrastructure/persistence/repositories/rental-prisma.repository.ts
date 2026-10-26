import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  dateOnlyYear,
  startOfTodayLima,
} from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { GenArchivoService } from '../../../../../shared/infrastructure/storage/gen-archivo.service';
import { containsI } from '../../../../../shared/utils/prisma-contains-insensitive.util';
import {
  buildRentalCode,
  legacyRentalCode,
  withUniqueSuffix,
} from '../../../domain/utils/rental-code.util';
import type { Rental } from '../../../domain/entities/rental.entity';
import {
  resolveRentalCommissionState,
  type RentalCommissionPatch,
  type RentalCommissionState,
} from '../../../domain/utils/rental-commission.util';
import {
  RentalAttachment,
  RentalDetail,
  RentalStats,
} from '../../../domain/entities/rental.entity';
import type {
  CreateRentalData,
  ListRentalsFilters,
  ListRentalsResult,
  RentalRepository,
  UpdateRentalData,
} from '../../../domain/repositories/rental.repository';
import { RentalPrismaMapper } from '../mappers/rental-prisma.mapper';

const rentalTenantsInclude = {
  tenants: {
    include: { client: { select: { id: true, fullName: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
};

function resolveTenantClients(r: {
  tenant?: { id: string; fullName: string };
  tenants?: { client: { id: string; fullName: string } }[];
}): { id: string; fullName: string }[] {
  if (r.tenants?.length) {
    return r.tenants.map((rt) => rt.client);
  }
  if (r.tenant) return [r.tenant];
  return [];
}

/** Reglas del cobro de la comisión como error 400 para el cliente. */
function resolveCommission(
  current: RentalCommissionState,
  patch: RentalCommissionPatch | undefined,
): RentalCommissionState {
  try {
    return resolveRentalCommissionState(current, patch ?? {});
  } catch (err) {
    if (err instanceof RangeError) throw new BadRequestException(err.message);
    throw err;
  }
}

@Injectable()
export class RentalPrismaRepository implements RentalRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly genArchivo: GenArchivoService,
  ) {}

  async create(data: CreateRentalData): Promise<Rental> {
    if (!data.tenantIds.length)
      throw new BadRequestException('Debe indicar al menos un inquilino');
    if (
      !Number.isFinite(data.startDate.getTime()) ||
      !Number.isFinite(data.endDate.getTime()) ||
      data.endDate < data.startDate
    )
      throw new BadRequestException(
        'El rango de fechas del contrato no es válido',
      );
    const primaryTenantId = data.tenantIds[0];
    const commission = resolveCommission(
      {
        commissionStatus: 'PENDING',
        commissionDueDate: null,
        commissionPaidDate: null,
      },
      data.commission,
    );
    const rental = await this.prisma.$transaction(async (tx) => {
      // eslint-disable-next-line no-restricted-properties -- Bloqueo transaccional de lectura; no modifica filas.
      await tx.$queryRaw`SELECT id FROM properties WHERE id = ${data.propertyId} FOR UPDATE`;
      const property = await tx.property.findFirst({
        where: {
          id: data.propertyId,
          applicationId: data.applicationId,
          deletedAt: null,
          isActive: true,
        },
      });
      if (!property)
        throw new BadRequestException(
          'La propiedad no pertenece a la aplicación o no está disponible',
        );
      const tenantCount = await tx.client.count({
        where: {
          id: { in: data.tenantIds },
          applicationId: data.applicationId,
          clientType: 'TENANT',
          deletedAt: null,
          isActive: true,
        },
      });
      if (tenantCount !== new Set(data.tenantIds).size)
        throw new BadRequestException(
          'Uno o más inquilinos no pertenecen a la aplicación',
        );
      const overlap = await tx.rental.findFirst({
        where: {
          propertyId: data.propertyId,
          deletedAt: null,
          status: 'ACTIVE',
          startDate: { lte: data.endDate },
          endDate: { gte: data.startDate },
        },
      });
      if (overlap)
        throw new BadRequestException(
          'La propiedad ya tiene un contrato activo en ese rango de fechas',
        );
      // Código descriptivo a partir del de la propiedad y el año de inicio (único por aplicación)
      const baseCode = buildRentalCode(
        property.code,
        dateOnlyYear(data.startDate),
      );
      const usedCodes = await tx.rental.findMany({
        where: {
          applicationId: data.applicationId,
          code: { startsWith: baseCode },
        },
        select: { code: true },
      });
      const code = withUniqueSuffix(
        baseCode,
        usedCodes.map((r) => r.code).filter((c): c is string => !!c),
      );
      const created = await tx.rental.create({
        data: {
          applicationId: data.applicationId,
          propertyId: data.propertyId,
          tenantId: primaryTenantId,
          code,
          startDate: data.startDate,
          endDate: data.endDate,
          currency: data.currency,
          monthlyAmount: data.monthlyAmount,
          securityDeposit: data.securityDeposit ?? null,
          paymentDueDay: data.paymentDueDay,
          notes: data.notes?.trim() || null,
          enableExpirationAlerts: data.enableExpirationAlerts ?? true,
          enableCollectionAlerts: data.enableCollectionAlerts ?? true,
          ...commission,
          tenants: {
            create: data.tenantIds.map((clientId, sortOrder) => ({
              clientId,
              sortOrder,
            })),
          },
        },
      });
      // Default empty config so new rentals have a row; existing ones without config stay untouched.
      await tx.rentalFinancialConfig.create({
        data: {
          rentalId: created.id,
          currency: data.currency,
          baseAmount: data.monthlyAmount,
        },
      });
      await tx.property.update({
        where: { id: data.propertyId },
        data: { listingStatus: 'RENTED' },
      });
      return created;
    });
    return RentalPrismaMapper.toDomain(rental);
  }

  async findMany(filters: ListRentalsFilters): Promise<ListRentalsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const where: Prisma.RentalWhereInput = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: containsI(q) },
        { property: { code: containsI(q) } },
        { property: { addressLine: containsI(q) } },
        { tenant: { fullName: containsI(q) } },
        {
          tenants: {
            some: { client: { fullName: containsI(q) } },
          },
        },
        { property: { owner: { fullName: containsI(q) } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              code: true,
              addressLine: true,
              ownerId: true,
              owner: { select: { id: true, fullName: true } },
            },
          },
          tenant: { select: { id: true, fullName: true } },
          ...rentalTenantsInclude,
          attachments: { where: { type: 'CONTRACT' }, select: { id: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { startDate: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.rental.count({ where }),
    ]);

    return {
      data: data.map((r) => RentalPrismaMapper.toListItem(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<RentalStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) {
      return new RentalStats(0, 0, 0, 0);
    }

    const today = startOfTodayLima();
    const in30Days = new Date(today);
    in30Days.setUTCDate(in30Days.getUTCDate() + 30);

    const baseWhere = { applicationId: app.id, deletedAt: null };

    const [total, vigentes, porVencer, vencidos] = await Promise.all([
      this.prisma.rental.count({ where: baseWhere }),
      this.prisma.rental.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      this.prisma.rental.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE',
          endDate: { gte: today, lte: in30Days },
        },
      }),
      this.prisma.rental.count({
        where: {
          ...baseWhere,
          OR: [{ endDate: { lt: today } }, { status: 'EXPIRED' }],
        },
      }),
    ]);

    return new RentalStats(total, vigentes, porVencer, vencidos);
  }

  async findById(id: string): Promise<RentalDetail | null> {
    const r = await this.prisma.rental.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            addressLine: true,
            ownerId: true,
            owner: { select: { id: true, fullName: true } },
          },
        },
        tenant: { select: { id: true, fullName: true } },
        ...rentalTenantsInclude,
        attachments: {
          select: {
            id: true,
            type: true,
            archivoId: true,
            filePath: true,
            originalFileName: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!r) return null;
    const tenantClients = resolveTenantClients(r);
    const attachmentRows: Array<{
      id: string;
      type: string;
      archivoId: string | null;
      filePath: string;
      originalFileName: string;
    }> = r.attachments || [];
    const contractCount = attachmentRows.filter(
      (a) => a.type === 'CONTRACT',
    ).length;
    const deliveryCount = attachmentRows.filter(
      (a) => a.type === 'DELIVERY_ACT',
    ).length;
    const attachments = await Promise.all(
      attachmentRows.map(async (a) => {
        const downloadUrl = await this.genArchivo.resolveDownloadUrl(
          a.archivoId,
          a.filePath,
        );
        return new RentalAttachment(
          a.id,
          a.type,
          a.filePath,
          a.originalFileName,
          a.archivoId,
          downloadUrl,
        );
      }),
    );
    const base = RentalPrismaMapper.toDomain(r);
    return new RentalDetail(
      base,
      r.code ?? legacyRentalCode(r.id, r.startDate),
      {
        id: r.property.id,
        code: r.property.code,
        addressLine: r.property.addressLine,
        ownerId: r.property.ownerId,
        owner: { id: r.property.owner.id, fullName: r.property.owner.fullName },
      },
      tenantClients[0] ?? { id: r.tenant.id, fullName: r.tenant.fullName },
      tenantClients,
      contractCount > 0,
      deliveryCount > 0,
      attachments,
    );
  }

  async countActiveByPropertyId(propertyId: string): Promise<number> {
    const today = startOfTodayLima();
    return this.prisma.rental.count({
      where: {
        propertyId,
        status: 'ACTIVE',
        endDate: { gte: today },
        deletedAt: null,
      },
    });
  }

  async countActiveInvolvingClient(
    clientId: string,
    applicationId: string,
  ): Promise<number> {
    const today = startOfTodayLima();
    const activeRental = {
      status: 'ACTIVE',
      endDate: { gte: today },
      deletedAt: null,
      applicationId,
    };
    return this.prisma.rental.count({
      where: {
        ...activeRental,
        OR: [
          { tenantId: clientId },
          { tenants: { some: { clientId } } },
          {
            property: {
              ownerId: clientId,
              deletedAt: null,
              applicationId,
            },
          },
        ],
      },
    });
  }

  async update(id: string, data: UpdateRentalData): Promise<Rental> {
    const patch: Record<string, unknown> = {
      ...(data.startDate != null && { startDate: data.startDate }),
      ...(data.endDate != null && { endDate: data.endDate }),
      ...(data.currency != null && { currency: data.currency }),
      ...(data.monthlyAmount != null && { monthlyAmount: data.monthlyAmount }),
      ...(data.securityDeposit !== undefined && {
        securityDeposit: data.securityDeposit,
      }),
      ...(data.paymentDueDay != null && { paymentDueDay: data.paymentDueDay }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.status != null && { status: data.status }),
      ...(data.enableExpirationAlerts !== undefined && {
        enableExpirationAlerts: data.enableExpirationAlerts,
      }),
      ...(data.enableCollectionAlerts !== undefined && {
        enableCollectionAlerts: data.enableCollectionAlerts,
      }),
    };

    if (data.tenantIds?.length) {
      patch.tenantId = data.tenantIds[0];
    }

    const r = await this.prisma.$transaction(async (tx) => {
      if (data.tenantIds?.length) {
        await tx.rentalTenant.deleteMany({ where: { rentalId: id } });
        patch.tenants = {
          create: data.tenantIds.map((clientId, sortOrder) => ({
            clientId,
            sortOrder,
          })),
        };
      }
      const current = await tx.rental.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Contrato no encontrado');
      const startDate = data.startDate ?? current.startDate;
      const endDate = data.endDate ?? current.endDate;
      if (endDate < startDate)
        throw new BadRequestException(
          'La fecha final no puede ser anterior al inicio',
        );
      if (data.commission) {
        Object.assign(
          patch,
          resolveCommission(
            {
              commissionStatus:
                current.commissionStatus === 'PAID' ? 'PAID' : 'PENDING',
              commissionDueDate: current.commissionDueDate,
              commissionPaidDate: current.commissionPaidDate,
            },
            data.commission,
          ),
        );
      }
      if (data.tenantIds?.length) {
        const count = await tx.client.count({
          where: {
            id: { in: data.tenantIds },
            applicationId: current.applicationId,
            clientType: 'TENANT',
            deletedAt: null,
            isActive: true,
          },
        });
        if (count !== new Set(data.tenantIds).size)
          throw new BadRequestException(
            'Inquilinos no válidos para este contrato',
          );
      }
      const updated = await tx.rental.update({ where: { id }, data: patch });
      await this.syncPropertyStatus(tx, current.propertyId);
      return updated;
    });
    return RentalPrismaMapper.toDomain(r);
  }

  private async syncPropertyStatus(
    tx: Prisma.TransactionClient,
    propertyId: string,
  ): Promise<void> {
    // eslint-disable-next-line no-restricted-properties -- Bloqueo transaccional de lectura; no modifica filas.
    await tx.$queryRaw`SELECT id FROM properties WHERE id = ${propertyId} FOR UPDATE`;
    const property = await tx.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) return;
    const active = await tx.rental.count({
      where: {
        propertyId,
        deletedAt: null,
        status: 'ACTIVE',
        endDate: { gte: startOfTodayLima() },
      },
    });
    if (
      active > 0 &&
      (!property.listingStatus || property.listingStatus === 'AVAILABLE')
    ) {
      await tx.property.update({
        where: { id: propertyId },
        data: { listingStatus: 'RENTED' },
      });
    } else if (
      active === 0 &&
      ['RENTED', 'EXPIRING'].includes(property.listingStatus ?? '')
    ) {
      await tx.property.update({
        where: { id: propertyId },
        data: { listingStatus: 'AVAILABLE' },
      });
    }
  }

  async cancel(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.update({
        where: { id },
        data: { status: 'CANCELLED', deletedAt: new Date() },
      });
      await this.syncPropertyStatus(tx, rental.propertyId);
    });
  }
}
