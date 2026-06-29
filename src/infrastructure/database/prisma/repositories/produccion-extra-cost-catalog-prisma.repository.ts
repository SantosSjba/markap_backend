import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionExtraCostCatalogPayload,
  ListProduccionExtraCostCatalogFilters,
  ListProduccionExtraCostCatalogResult,
  ProduccionExtraCostCatalogDto,
  ProduccionExtraCostCatalogRepository,
  UpdateProduccionExtraCostCatalogPayload,
} from '@domain/repositories/produccion-extra-cost-catalog.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class ProduccionExtraCostCatalogPrismaRepository implements ProduccionExtraCostCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    name: string;
    defaultAmount: Prisma.Decimal;
    description: string | null;
    isActive: boolean;
    updatedAt: Date;
  }): ProduccionExtraCostCatalogDto {
    return {
      id: row.id,
      name: row.name,
      defaultAmount: num(row.defaultAmount),
      description: row.description,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(
    filters: ListProduccionExtraCostCatalogFilters,
  ): Promise<ListProduccionExtraCostCatalogResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionExtraCostCatalogWhereInput[] = [{ applicationId: app.id }];
    if (filters.isActive !== undefined) andParts.push({ isActive: filters.isActive });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionExtraCostCatalog.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionExtraCostCatalog.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.map(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionExtraCostCatalogDto | null> {
    const row = await this.prisma.produccionExtraCostCatalog.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.map(row);
  }

  async create(applicationId: string, payload: CreateProduccionExtraCostCatalogPayload) {
    const row = await this.prisma.produccionExtraCostCatalog.create({
      data: {
        applicationId,
        name: payload.name.trim(),
        defaultAmount: new Prisma.Decimal(payload.defaultAmount),
        description: payload.description?.trim() || null,
        isActive: payload.isActive ?? true,
      },
    });
    return this.map(row);
  }

  async update(id: string, payload: UpdateProduccionExtraCostCatalogPayload) {
    const patch: Prisma.ProduccionExtraCostCatalogUncheckedUpdateInput = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.defaultAmount !== undefined) {
      patch.defaultAmount = new Prisma.Decimal(payload.defaultAmount);
    }
    if (payload.description !== undefined) patch.description = payload.description?.trim() || null;
    if (payload.isActive !== undefined) patch.isActive = payload.isActive;

    const row = await this.prisma.produccionExtraCostCatalog.update({ where: { id }, data: patch });
    return this.map(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.produccionExtraCostCatalog.delete({ where: { id } });
  }
}
