import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionLaborRatePayload,
  ListProduccionLaborRatesFilters,
  ListProduccionLaborRatesResult,
  ProduccionLaborRateDto,
  ProduccionLaborRateRepository,
  UpdateProduccionLaborRatePayload,
} from '@domain/repositories/produccion-labor-rate.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class ProduccionLaborRatePrismaRepository implements ProduccionLaborRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    name: string;
    stage: string;
    hourlyRate: Prisma.Decimal;
    isActive: boolean;
    updatedAt: Date;
  }): ProduccionLaborRateDto {
    return {
      id: row.id,
      name: row.name,
      stage: row.stage,
      hourlyRate: num(row.hourlyRate),
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListProduccionLaborRatesFilters): Promise<ListProduccionLaborRatesResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionLaborRateWhereInput[] = [{ applicationId: app.id }];
    if (filters.isActive !== undefined) andParts.push({ isActive: filters.isActive });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { stage: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionLaborRate.findMany({
        where,
        orderBy: [{ stage: 'asc' }, { name: 'asc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionLaborRate.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.map(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionLaborRateDto | null> {
    const row = await this.prisma.produccionLaborRate.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.map(row);
  }

  async create(applicationId: string, payload: CreateProduccionLaborRatePayload) {
    const row = await this.prisma.produccionLaborRate.create({
      data: {
        applicationId,
        name: payload.name.trim(),
        stage: payload.stage.trim(),
        hourlyRate: new Prisma.Decimal(payload.hourlyRate),
        isActive: payload.isActive ?? true,
      },
    });
    return this.map(row);
  }

  async update(id: string, payload: UpdateProduccionLaborRatePayload) {
    const patch: Prisma.ProduccionLaborRateUncheckedUpdateInput = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.stage !== undefined) patch.stage = payload.stage.trim();
    if (payload.hourlyRate !== undefined) patch.hourlyRate = new Prisma.Decimal(payload.hourlyRate);
    if (payload.isActive !== undefined) patch.isActive = payload.isActive;

    const row = await this.prisma.produccionLaborRate.update({ where: { id }, data: patch });
    return this.map(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.produccionLaborRate.delete({ where: { id } });
  }
}
