import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateArquitecturaCatalogMaterialPayload,
  ArquitecturaCatalogMaterialDetail,
  ArquitecturaCatalogMaterialRepository,
  ListArquitecturaCatalogMaterialsFilters,
  ListArquitecturaCatalogMaterialsResult,
  UpdateArquitecturaCatalogMaterialPayload,
} from '@domain/repositories/arquitectura-catalog-material.repository';

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class ArquitecturaCatalogMaterialPrismaRepository implements ArquitecturaCatalogMaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapDetail(row: {
    id: string;
    code: string;
    name: string;
    category: string;
    brand: string;
    unit: string;
    price: Prisma.Decimal;
    stock: Prisma.Decimal;
    technicalSheetUrl: string | null;
    updatedAt: Date;
    images: { id: string; sortOrder: number; url: string }[];
  }): ArquitecturaCatalogMaterialDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      brand: row.brand,
      unit: row.unit,
      price: num(row.price) ?? 0,
      stock: num(row.stock) ?? 0,
      technicalSheetUrl: row.technicalSheetUrl,
      images: row.images.map((im) => ({
        id: im.id,
        sortOrder: im.sortOrder,
        url: im.url,
      })),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListArquitecturaCatalogMaterialsFilters): Promise<ListArquitecturaCatalogMaterialsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.ArquitecturaCatalogMaterialWhereInput[] = [{ applicationId: app.id }];
    if (filters.category?.trim()) {
      andParts.push({ category: { equals: filters.category.trim(), mode: 'insensitive' } });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ArquitecturaCatalogMaterialWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.arquitecturaCatalogMaterial.findMany({
        where,
        include: { _count: { select: { images: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.arquitecturaCatalogMaterial.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        category: r.category,
        brand: r.brand,
        unit: r.unit,
        price: num(r.price) ?? 0,
        stock: num(r.stock) ?? 0,
        imageCount: r._count.images,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ArquitecturaCatalogMaterialDetail | null> {
    const row = await this.prisma.arquitecturaCatalogMaterial.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        application: { select: { slug: true } },
      },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    const { application: _app, ...mat } = row;
    return this.mapDetail(mat);
  }

  async create(
    applicationId: string,
    payload: CreateArquitecturaCatalogMaterialPayload,
  ): Promise<ArquitecturaCatalogMaterialDetail> {
    const urls = (payload.imageUrls ?? []).map((u) => u.trim()).filter(Boolean);
    const row = await this.prisma.arquitecturaCatalogMaterial.create({
      data: {
        applicationId,
        code: payload.code.trim(),
        name: payload.name.trim(),
        category: payload.category.trim(),
        brand: payload.brand.trim(),
        unit: payload.unit.trim(),
        price: new Prisma.Decimal(payload.price),
        stock: new Prisma.Decimal(payload.stock ?? 0),
        technicalSheetUrl: payload.technicalSheetUrl?.trim() || null,
        images:
          urls.length > 0
            ? {
                create: urls.map((url, i) => ({
                  sortOrder: i,
                  url,
                })),
              }
            : undefined,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    return this.mapDetail(row);
  }

  async update(id: string, payload: UpdateArquitecturaCatalogMaterialPayload): Promise<ArquitecturaCatalogMaterialDetail> {
    const patch: Prisma.ArquitecturaCatalogMaterialUncheckedUpdateInput = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.category !== undefined) patch.category = payload.category.trim();
    if (payload.brand !== undefined) patch.brand = payload.brand.trim();
    if (payload.unit !== undefined) patch.unit = payload.unit.trim();
    if (payload.price !== undefined) patch.price = new Prisma.Decimal(payload.price);
    if (payload.stock !== undefined) patch.stock = new Prisma.Decimal(payload.stock);
    if (payload.technicalSheetUrl !== undefined) {
      patch.technicalSheetUrl = payload.technicalSheetUrl?.trim() || null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.arquitecturaCatalogMaterial.update({
        where: { id },
        data: patch,
      });
      if (payload.imageUrls !== undefined) {
        await tx.arquitecturaCatalogMaterialImage.deleteMany({ where: { materialId: id } });
        const urls = payload.imageUrls.map((u) => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          await tx.arquitecturaCatalogMaterialImage.createMany({
            data: urls.map((url, i) => ({
              materialId: id,
              sortOrder: i,
              url,
            })),
          });
        }
      }
    });

    const detail = await this.findById(id);
    if (!detail) throw new Error('ArquitecturaCatalogMaterial update: not found');
    return detail;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.arquitecturaCatalogMaterial.delete({ where: { id } });
  }
}
