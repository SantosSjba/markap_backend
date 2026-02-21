import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  ClientRepository,
  ClientData,
  ClientType,
  CreateClientData,
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
        { fullName: { contains: q, mode: 'insensitive' } },
        { documentNumber: { contains: q, mode: 'insensitive' } },
        { primaryEmail: { contains: q, mode: 'insensitive' } },
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
        propertiesCount: 0,
        contractsCount: 0,
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
