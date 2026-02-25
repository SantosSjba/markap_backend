import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  AgentRepository,
  AgentData,
  AgentListItem,
  CreateAgentData,
  UpdateAgentData,
  ListAgentsFilters,
  ListAgentsResult,
} from '../../../../application/repositories/agent.repository';

@Injectable()
export class AgentPrismaRepository implements AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toAgentData(row: {
    id: string;
    applicationId: string;
    type: string;
    userId: string | null;
    fullName: string;
    email: string | null;
    phone: string | null;
    documentTypeId: string | null;
    documentNumber: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AgentData {
    return {
      id: row.id,
      applicationId: row.applicationId,
      type: row.type as 'INTERNAL' | 'EXTERNAL',
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      documentTypeId: row.documentTypeId,
      documentNumber: row.documentNumber,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toListItem(row: {
    id: string;
    applicationId: string;
    type: string;
    userId: string | null;
    fullName: string;
    email: string | null;
    phone: string | null;
    documentTypeId: string | null;
    documentNumber: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: string; firstName: string; lastName: string } | null;
    documentType?: { code: string; name: string } | null;
  }): AgentListItem {
    const base = this.toAgentData(row);
    return {
      ...base,
      user: row.user
        ? {
            id: row.user.id,
            firstName: row.user.firstName,
            lastName: row.user.lastName,
          }
        : null,
      documentType: row.documentType
        ? { code: row.documentType.code, name: row.documentType.name }
        : null,
    };
  }

  async create(data: CreateAgentData): Promise<AgentData> {
    const agent = await this.prisma.agent.create({
      data: {
        applicationId: data.applicationId,
        type: data.type,
        userId: data.userId ?? null,
        fullName: data.fullName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        documentTypeId: data.documentTypeId ?? null,
        documentNumber: data.documentNumber?.trim() || null,
      },
    });
    return this.toAgentData(agent);
  }

  async findById(id: string): Promise<AgentListItem | null> {
    const agent = await this.prisma.agent.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        documentType: { select: { code: true, name: true } },
      },
    });
    if (!agent) return null;
    return this.toListItem(agent);
  }

  async findMany(filters: ListAgentsFilters): Promise<ListAgentsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app)
      return {
        data: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
      };

    const where: Record<string, unknown> = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { documentNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          documentType: { select: { code: true, name: true } },
        },
        orderBy: { fullName: 'asc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data: data.map((row) => this.toListItem(row)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async update(id: string, data: UpdateAgentData): Promise<AgentData> {
    await this.prisma.agent.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.fullName !== undefined && { fullName: data.fullName.trim() }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.documentTypeId !== undefined && {
          documentTypeId: data.documentTypeId,
        }),
        ...(data.documentNumber !== undefined && {
          documentNumber: data.documentNumber?.trim() || null,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    const updated = await this.prisma.agent.findUniqueOrThrow({ where: { id } });
    return this.toAgentData(updated);
  }
}
