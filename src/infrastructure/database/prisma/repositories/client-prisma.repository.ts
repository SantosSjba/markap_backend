import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  ClientRepository,
  ClientData,
  ClientType,
  CreateClientData,
  UpdateClientData,
  ClientDetailData,
  ListClientsFilters,
  ListClientsResult,
  ClientListItem,
  ClientStats,
} from '../../../../application/repositories/client.repository';

@Injectable()
export class ClientPrismaRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientData): Promise<ClientData> {
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
        addresses: {
          create: {
            addressType: 'FISCAL',
            addressLine: data.address.addressLine.trim(),
            districtId: data.address.districtId,
            reference: data.address.reference?.trim() || null,
            isPrimary: true,
          },
        },
      },
      include: {
        documentType: true,
        addresses: { include: { district: { include: { province: true } } } },
      },
    });
    return this.toClientData(client);
  }

  async findById(id: string): Promise<ClientDetailData | null> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        documentType: true,
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
    return {
      ...this.toClientData(client),
      documentType: client.documentType,
      primaryAddress: primaryAddress
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
    };
  }

  async update(id: string, data: UpdateClientData): Promise<ClientData> {
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
            ...(data.address.addressLine !== undefined && { addressLine: data.address.addressLine.trim() }),
            ...(data.address.districtId !== undefined && { districtId: data.address.districtId }),
            ...(data.address.reference !== undefined && { reference: data.address.reference?.trim() || null }),
          },
        });
      }
    }
    const updated = await this.prisma.client.findUniqueOrThrow({
      where: { id },
    });
    return this.toClientData(updated);
  }

  async findMany(filters: ListClientsFilters): Promise<ListClientsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const where: Record<string, unknown> = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.clientType) where.clientType = filters.clientType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { documentNumber: { contains: q } },
        { primaryEmail: { contains: q } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { documentType: true },
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
            where: { ownerId: { in: ownerIds }, deletedAt: null },
            _count: { id: true },
          })
        : [],
      tenantIds.length > 0
        ? this.prisma.rental.groupBy({
            by: ['tenantId'],
            where: { tenantId: { in: tenantIds }, deletedAt: null },
            _count: { id: true },
          })
        : [],
      ownerIds.length > 0
        ? this.prisma.rental.findMany({
            where: { deletedAt: null, property: { ownerId: { in: ownerIds } } },
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
      data: data.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        documentTypeCode: c.documentType.code,
        documentNumber: c.documentNumber,
        primaryPhone: c.primaryPhone,
        primaryEmail: c.primaryEmail,
        clientType: c.clientType as ClientType,
        isActive: c.isActive,
        propertiesCount: c.clientType === 'OWNER' ? propertiesCountMap.get(c.id) ?? 0 : 0,
        contractsCount:
          c.clientType === 'TENANT'
            ? rentalsByTenantMap.get(c.id) ?? 0
            : rentalsByOwnerMap.get(c.id) ?? 0,
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<ClientStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug },
    });
    if (!app)
      return { total: 0, owners: 0, tenants: 0, active: 0 };

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

  private toClientData(client: {
    id: string;
    applicationId: string;
    clientType: string;
    documentTypeId: string;
    documentNumber: string;
    fullName: string;
    legalRepresentativeName: string | null;
    legalRepresentativePosition: string | null;
    primaryPhone: string;
    secondaryPhone: string | null;
    primaryEmail: string;
    secondaryEmail: string | null;
    notes: string | null;
    isActive: boolean;
  }): ClientData {
    return {
      id: client.id,
      applicationId: client.applicationId,
      clientType: client.clientType as ClientType,
      documentTypeId: client.documentTypeId,
      documentNumber: client.documentNumber,
      fullName: client.fullName,
      legalRepresentativeName: client.legalRepresentativeName,
      legalRepresentativePosition: client.legalRepresentativePosition,
      primaryPhone: client.primaryPhone,
      secondaryPhone: client.secondaryPhone,
      primaryEmail: client.primaryEmail,
      secondaryEmail: client.secondaryEmail,
      notes: client.notes,
      isActive: client.isActive,
    };
  }
}
