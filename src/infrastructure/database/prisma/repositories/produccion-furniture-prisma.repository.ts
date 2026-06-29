import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionFurniturePayload,
  ListProduccionFurnitureFilters,
  ListProduccionFurnitureResult,
  ProduccionFurnitureBomLineInput,
  ProduccionFurnitureDetail,
  ProduccionFurnitureRepository,
  ProduccionFurnitureStats,
  UpdateProduccionFurniturePayload,
} from '@domain/repositories/produccion-furniture.repository';

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class ProduccionFurniturePrismaRepository implements ProduccionFurnitureRepository {
  constructor(private readonly prisma: PrismaService) {}

  private bomCreateRows(lines: ProduccionFurnitureBomLineInput[]) {
    return lines
      .filter((l) => l.materialName.trim() && l.unit.trim())
      .map((l, i) => ({
        sortOrder: i,
        materialName: l.materialName.trim(),
        unit: l.unit.trim(),
        quantity: new Prisma.Decimal(l.quantity),
        unitCost: l.unitCost != null ? new Prisma.Decimal(l.unitCost) : null,
        notes: l.notes?.trim() || null,
      }));
  }

  private mapDetail(row: {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string | null;
    widthCm: number | null;
    depthCm: number | null;
    heightCm: number | null;
    referencePrice: Prisma.Decimal;
    technicalSheetUrl: string | null;
    notes: string | null;
    isActive: boolean;
    updatedAt: Date;
    images: { id: string; sortOrder: number; url: string }[];
    bomLines: {
      id: string;
      sortOrder: number;
      materialName: string;
      unit: string;
      quantity: Prisma.Decimal;
      unitCost: Prisma.Decimal | null;
      notes: string | null;
    }[];
  }): ProduccionFurnitureDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      description: row.description,
      widthCm: row.widthCm,
      depthCm: row.depthCm,
      heightCm: row.heightCm,
      referencePrice: num(row.referencePrice) ?? 0,
      technicalSheetUrl: row.technicalSheetUrl,
      notes: row.notes,
      isActive: row.isActive,
      images: row.images.map((im) => ({
        id: im.id,
        sortOrder: im.sortOrder,
        url: im.url,
      })),
      bomLines: row.bomLines.map((bl) => ({
        id: bl.id,
        sortOrder: bl.sortOrder,
        materialName: bl.materialName,
        unit: bl.unit,
        quantity: num(bl.quantity) ?? 0,
        unitCost: num(bl.unitCost),
        notes: bl.notes,
      })),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListProduccionFurnitureFilters): Promise<ListProduccionFurnitureResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.ProduccionFurnitureWhereInput[] = [{ applicationId: app.id }];
    if (filters.category?.trim()) {
      andParts.push({ category: { equals: filters.category.trim(), mode: 'insensitive' } });
    }
    if (filters.isActive !== undefined) {
      andParts.push({ isActive: filters.isActive });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ProduccionFurnitureWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.produccionFurniture.findMany({
        where,
        include: { _count: { select: { images: true, bomLines: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionFurniture.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        category: r.category,
        referencePrice: num(r.referencePrice) ?? 0,
        isActive: r.isActive,
        imageCount: r._count.images,
        bomLineCount: r._count.bomLines,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<ProduccionFurnitureStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug.trim() },
    });
    if (!app) return { total: 0, active: 0, inactive: 0 };

    const [total, active] = await Promise.all([
      this.prisma.produccionFurniture.count({ where: { applicationId: app.id } }),
      this.prisma.produccionFurniture.count({ where: { applicationId: app.id, isActive: true } }),
    ]);

    return { total, active, inactive: total - active };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionFurnitureDetail | null> {
    const row = await this.prisma.produccionFurniture.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        bomLines: { orderBy: { sortOrder: 'asc' } },
        application: { select: { slug: true } },
      },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    const { application: _app, ...furniture } = row;
    return this.mapDetail(furniture);
  }

  async create(
    applicationId: string,
    payload: CreateProduccionFurniturePayload,
  ): Promise<ProduccionFurnitureDetail> {
    const urls = (payload.imageUrls ?? []).map((u) => u.trim()).filter(Boolean);
    const bomRows = this.bomCreateRows(payload.bomLines ?? []);
    const row = await this.prisma.produccionFurniture.create({
      data: {
        applicationId,
        code: payload.code.trim(),
        name: payload.name.trim(),
        category: payload.category.trim(),
        description: payload.description?.trim() || null,
        widthCm: payload.widthCm ?? null,
        depthCm: payload.depthCm ?? null,
        heightCm: payload.heightCm ?? null,
        referencePrice: new Prisma.Decimal(payload.referencePrice),
        technicalSheetUrl: payload.technicalSheetUrl?.trim() || null,
        notes: payload.notes?.trim() || null,
        isActive: payload.isActive ?? true,
        images:
          urls.length > 0
            ? {
                create: urls.map((url, i) => ({
                  sortOrder: i,
                  url,
                })),
              }
            : undefined,
        bomLines: bomRows.length > 0 ? { create: bomRows } : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        bomLines: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return this.mapDetail(row);
  }

  async update(id: string, payload: UpdateProduccionFurniturePayload): Promise<ProduccionFurnitureDetail> {
    const patch: Prisma.ProduccionFurnitureUncheckedUpdateInput = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.category !== undefined) patch.category = payload.category.trim();
    if (payload.description !== undefined) patch.description = payload.description?.trim() || null;
    if (payload.widthCm !== undefined) patch.widthCm = payload.widthCm;
    if (payload.depthCm !== undefined) patch.depthCm = payload.depthCm;
    if (payload.heightCm !== undefined) patch.heightCm = payload.heightCm;
    if (payload.referencePrice !== undefined) {
      patch.referencePrice = new Prisma.Decimal(payload.referencePrice);
    }
    if (payload.technicalSheetUrl !== undefined) {
      patch.technicalSheetUrl = payload.technicalSheetUrl?.trim() || null;
    }
    if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;
    if (payload.isActive !== undefined) patch.isActive = payload.isActive;

    await this.prisma.$transaction(async (tx) => {
      await tx.produccionFurniture.update({
        where: { id },
        data: patch,
      });
      if (payload.imageUrls !== undefined) {
        await tx.produccionFurnitureImage.deleteMany({ where: { furnitureId: id } });
        const urls = payload.imageUrls.map((u) => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          await tx.produccionFurnitureImage.createMany({
            data: urls.map((url, i) => ({
              furnitureId: id,
              sortOrder: i,
              url,
            })),
          });
        }
      }
      if (payload.bomLines !== undefined) {
        await tx.produccionFurnitureBomLine.deleteMany({ where: { furnitureId: id } });
        const bomRows = this.bomCreateRows(payload.bomLines);
        if (bomRows.length > 0) {
          await tx.produccionFurnitureBomLine.createMany({
            data: bomRows.map((bl) => ({
              furnitureId: id,
              ...bl,
            })),
          });
        }
      }
    });

    const detail = await this.findById(id);
    if (!detail) throw new Error('ProduccionFurniture update: not found');
    return detail;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.produccionFurniture.delete({ where: { id } });
  }
}
