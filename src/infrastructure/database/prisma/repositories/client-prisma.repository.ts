import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientPrismaMapper } from '../mappers/client-prisma.mapper';
import type {
  ClientRepository,
  Client,
  ClientType,
  CreateClientData,
  UpdateClientData,
  ClientDetail,
  ListClientsFilters,
  ListClientsResult,
  ClientStats,
  SalesPipelineStatus,
} from '@domain/repositories/client.repository';

@Injectable()
export class ClientPrismaRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientData): Promise<Client> {
    const client = await this.prisma.client.create({
      data: {
        applicationId: data.applicationId,
        clientType: data.clientType,
        documentTypeId: data.documentTypeId,
        documentNumber: data.documentNumber.trim(),
        fullName: data.fullName.trim(),
        legalRepresentativeName: data.legalRepresentativeName?.trim() || null,
        legalRepresentativePosition:
          data.legalRepresentativePosition?.trim() || null,
        primaryPhone: data.primaryPhone.trim(),
        secondaryPhone: data.secondaryPhone?.trim() || null,
        primaryEmail: data.primaryEmail.trim(),
        secondaryEmail: data.secondaryEmail?.trim() || null,
        notes: data.notes?.trim() || null,
        salesStatus: data.salesStatus ?? null,
        leadOrigin: data.leadOrigin?.trim() || null,
        assignedAgentId: data.assignedAgentId ?? null,
        ...(data.address
          ? {
              addresses: {
                create: {
                  addressType: 'FISCAL',
                  addressLine: data.address.addressLine.trim(),
                  districtId: data.address.districtId,
                  reference: data.address.reference?.trim() || null,
                  isPrimary: true,
                },
              },
            }
          : {}),
      },
      include: {
        documentType: true,
        addresses: { include: { district: { include: { province: true } } } },
      },
    });
    return ClientPrismaMapper.toDomain(client);
  }

  async findById(id: string): Promise<ClientDetail | null> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        application: { select: { slug: true } },
        documentType: true,
        assignedAgent: { select: { id: true, fullName: true } },
        addresses: {
          where: { isPrimary: true },
          take: 1,
          include: {
            district: {
              include: {
                province: { include: { department: true } },
              },
            },
          },
        },
      },
    });
    if (!client) return null;
    const primaryAddress = client.addresses[0] ?? null;
    return ClientPrismaMapper.toDetail(
      client,
      client.application.slug,
      client.documentType,
      primaryAddress
        ? {
            id: primaryAddress.id,
            addressLine: primaryAddress.addressLine,
            districtId: primaryAddress.districtId,
            reference: primaryAddress.reference,
            district: {
              id: primaryAddress.district.id,
              name: primaryAddress.district.name,
              province: {
                id: primaryAddress.district.province.id,
                name: primaryAddress.district.province.name,
                department: {
                  id: primaryAddress.district.province.department.id,
                  name: primaryAddress.district.province.department.name,
                },
              },
            },
          }
        : null,
      client.assignedAgent,
    );
  }

  async update(id: string, data: UpdateClientData): Promise<Client> {
    await this.prisma.client.update({
      where: { id },
      data: {
        ...(data.clientType !== undefined && { clientType: data.clientType }),
        ...(data.documentTypeId !== undefined && { documentTypeId: data.documentTypeId }),
        ...(data.documentNumber !== undefined && { documentNumber: data.documentNumber.trim() }),
        ...(data.fullName !== undefined && { fullName: data.fullName.trim() }),
        ...(data.legalRepresentativeName !== undefined && {
          legalRepresentativeName: data.legalRepresentativeName?.trim() || null,
        }),
        ...(data.legalRepresentativePosition !== undefined && {
          legalRepresentativePosition: data.legalRepresentativePosition?.trim() || null,
        }),
        ...(data.primaryPhone !== undefined && { primaryPhone: data.primaryPhone.trim() }),
        ...(data.secondaryPhone !== undefined && { secondaryPhone: data.secondaryPhone?.trim() || null }),
        ...(data.primaryEmail !== undefined && { primaryEmail: data.primaryEmail.trim() }),
        ...(data.secondaryEmail !== undefined && { secondaryEmail: data.secondaryEmail?.trim() || null }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        ...(data.salesStatus !== undefined && { salesStatus: data.salesStatus }),
        ...(data.leadOrigin !== undefined && { leadOrigin: data.leadOrigin?.trim() || null }),
        ...(data.assignedAgentId !== undefined && { assignedAgentId: data.assignedAgentId }),
      },
    });
    if (data.address) {
      const primary = await this.prisma.address.findFirst({
        where: { clientId: id, isPrimary: true },
      });
      if (primary) {
        await this.prisma.address.update({
          where: { id: primary.id },
          data: {
            ...(data.address.addressLine !== undefined && {
              addressLine: data.address.addressLine.trim(),
            }),
            ...(data.address.districtId !== undefined && { districtId: data.address.districtId }),
            ...(data.address.reference !== undefined && {
              reference: data.address.reference?.trim() || null,
            }),
          },
        });
      } else {
        const line = data.address.addressLine?.trim();
        const districtId = data.address.districtId;
        if (line && districtId) {
          await this.prisma.address.create({
            data: {
              clientId: id,
              addressType: 'FISCAL',
              addressLine: line,
              districtId,
              reference: data.address.reference?.trim() || null,
              isPrimary: true,
            },
          });
        }
      }
    }
    const updated = await this.prisma.client.findUniqueOrThrow({
      where: { id },
    });
    return ClientPrismaMapper.toDomain(updated);
  }

  async findMany(filters: ListClientsFilters): Promise<ListClientsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Record<string, unknown>[] = [
      { applicationId: app.id, deletedAt: null },
    ];

    if (app.slug === 'ventas') {
      const ct =
        filters.clientType === 'TENANT'
          ? undefined
          : filters.clientType === 'OWNER' || filters.clientType === 'BUYER'
            ? filters.clientType
            : undefined;
      const st = filters.salesStatus;

      if (ct === 'OWNER') {
        andParts.push({ clientType: 'OWNER' });
      } else if (ct === 'BUYER') {
        andParts.push({ clientType: 'BUYER' });
        if (st) {
          andParts.push({ salesStatus: st });
        }
      } else if (st) {
        andParts.push({ clientType: { in: ['BUYER', 'OWNER'] } });
        andParts.push({
          OR: [{ clientType: 'OWNER' }, { clientType: 'BUYER', salesStatus: st }],
        });
      } else {
        andParts.push({ clientType: { in: ['BUYER', 'OWNER'] } });
      }
    } else if (app.slug === 'interiorismo') {
      andParts.push({
        clientType: filters.clientType
          ? filters.clientType
          : { in: ['RESIDENTIAL', 'CORPORATE'] },
      });
    } else {
      andParts.push({
        clientType: filters.clientType ?? { in: ['OWNER', 'TENANT'] },
      });
    }

    if (filters.isActive !== undefined) {
      andParts.push({ isActive: filters.isActive });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { fullName: { contains: q } },
          { documentNumber: { contains: q } },
          { primaryEmail: { contains: q } },
        ],
      });
    }

    const where = { AND: andParts };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: {
          documentType: true,
          assignedAgent: { select: { id: true, fullName: true } },
        },
        orderBy: { fullName: 'asc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    const ownerIds = data.filter((c) => c.clientType === 'OWNER').map((c) => c.id);
    const tenantIds = data.filter((c) => c.clientType === 'TENANT').map((c) => c.id);

    const [propertiesCountByOwner, rentalsCountByTenant, rentalsForOwners] = await Promise.all([
      ownerIds.length > 0
        ? this.prisma.property.groupBy({
            by: ['ownerId'],
            where: {
              ownerId: { in: ownerIds },
              deletedAt: null,
              applicationId: app.id,
            },
            _count: { id: true },
          })
        : [],
      tenantIds.length > 0
        ? this.prisma.rental.groupBy({
            by: ['tenantId'],
            where: {
              tenantId: { in: tenantIds },
              deletedAt: null,
              applicationId: app.id,
            },
            _count: { id: true },
          })
        : [],
      ownerIds.length > 0
        ? this.prisma.rental.findMany({
            where: {
              deletedAt: null,
              applicationId: app.id,
              property: {
                ownerId: { in: ownerIds },
                deletedAt: null,
                applicationId: app.id,
              },
            },
            select: { property: { select: { ownerId: true } } },
          })
        : [],
    ]);

    const propertiesCountMap = new Map<string, number>();
    for (const row of propertiesCountByOwner as { ownerId: string; _count: { id: number } }[]) {
      propertiesCountMap.set(row.ownerId, row._count.id);
    }
    const rentalsByTenantMap = new Map<string, number>();
    for (const row of rentalsCountByTenant as { tenantId: string; _count: { id: number } }[]) {
      rentalsByTenantMap.set(row.tenantId, row._count.id);
    }
    const rentalsByOwnerMap = new Map<string, number>();
    for (const r of rentalsForOwners as { property: { ownerId: string } }[]) {
      const ownerId = r.property?.ownerId;
      if (ownerId) rentalsByOwnerMap.set(ownerId, (rentalsByOwnerMap.get(ownerId) ?? 0) + 1);
    }

    return {
      data: data.map((c) =>
        ClientPrismaMapper.toListItem(
          c,
          c.clientType === 'OWNER' ? propertiesCountMap.get(c.id) ?? 0 : 0,
          c.clientType === 'TENANT'
            ? rentalsByTenantMap.get(c.id) ?? 0
            : rentalsByOwnerMap.get(c.id) ?? 0,
        ),
      ),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<ClientStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app) return { total: 0, owners: 0, tenants: 0, active: 0 };

    if (app.slug === 'interiorismo') {
      const interiorTypes = { in: ['RESIDENTIAL', 'CORPORATE'] };
      const [total, residential, corporate, active] = await Promise.all([
        this.prisma.client.count({
          where: { applicationId: app.id, deletedAt: null, clientType: interiorTypes },
        }),
        this.prisma.client.count({
          where: { applicationId: app.id, deletedAt: null, clientType: 'RESIDENTIAL' },
        }),
        this.prisma.client.count({
          where: { applicationId: app.id, deletedAt: null, clientType: 'CORPORATE' },
        }),
        this.prisma.client.count({
          where: {
            applicationId: app.id,
            deletedAt: null,
            clientType: interiorTypes,
            isActive: true,
          },
        }),
      ]);
      return {
        total,
        owners: 0,
        tenants: 0,
        active,
        residential,
        corporate,
      };
    }

    if (app.slug === 'ventas') {
      const allVentas = {
        applicationId: app.id,
        deletedAt: null,
        clientType: { in: ['BUYER', 'OWNER'] },
      };
      const buyerBase = {
        applicationId: app.id,
        deletedAt: null,
        clientType: 'BUYER' as const,
      };
      const [total, owners, active, prospects, interested, salesClients] =
        await Promise.all([
          this.prisma.client.count({ where: allVentas }),
          this.prisma.client.count({
            where: { applicationId: app.id, deletedAt: null, clientType: 'OWNER' },
          }),
          this.prisma.client.count({
            where: { ...buyerBase, isActive: true },
          }),
          this.prisma.client.count({
            where: { ...buyerBase, salesStatus: 'PROSPECT' },
          }),
          this.prisma.client.count({
            where: { ...buyerBase, salesStatus: 'INTERESTED' },
          }),
          this.prisma.client.count({
            where: { ...buyerBase, salesStatus: 'CLIENT' },
          }),
        ]);
      return {
        total,
        owners,
        tenants: 0,
        active,
        prospects,
        interested,
        salesClients,
      };
    }

    const [total, owners, tenants, active] = await Promise.all([
      this.prisma.client.count({
        where: { applicationId: app.id, deletedAt: null },
      }),
      this.prisma.client.count({
        where: { applicationId: app.id, clientType: 'OWNER', deletedAt: null },
      }),
      this.prisma.client.count({
        where: { applicationId: app.id, clientType: 'TENANT', deletedAt: null },
      }),
      this.prisma.client.count({
        where: { applicationId: app.id, isActive: true, deletedAt: null },
      }),
    ]);
    return { total, owners, tenants, active };
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
