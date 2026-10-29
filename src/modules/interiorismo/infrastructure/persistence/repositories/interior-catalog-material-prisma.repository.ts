import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import type {
  CreateInteriorCatalogMaterialPayload,
  InteriorCatalogMaterialDetail,
  InteriorCatalogMaterialRepository,
  InteriorCatalogMaterialStats,
  ListInteriorCatalogMaterialsFilters,
  ListInteriorCatalogMaterialsResult,
  UpdateInteriorCatalogMaterialPayload,
} from '../../../domain/repositories/interior-catalog-material.repository';

const DETAIL_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' } },
  supplierLinks: {
    include: {
      supplier: { select: { id: true, companyName: true, ruc: true } },
    },
  },
  purchases: {
    orderBy: { purchasedAt: 'desc' },
    take: 50,
    include: { supplier: { select: { id: true, companyName: true } } },
  },
} satisfies Prisma.InteriorCatalogMaterialInclude;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class InteriorCatalogMaterialPrismaRepository implements InteriorCatalogMaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapDetail(
    row: Prisma.InteriorCatalogMaterialGetPayload<{
      include: typeof DETAIL_INCLUDE;
    }>,
  ): InteriorCatalogMaterialDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      brand: row.brand,
      unit: row.unit,
      price: num(row.price) ?? 0,
      currency: row.currency,
      description: row.description,
      stock: num(row.stock) ?? 0,
      technicalSheetUrl: row.technicalSheetUrl,
      suppliers: row.supplierLinks.map((l) => ({
        linkId: l.id,
        supplierId: l.supplier.id,
        companyName: l.supplier.companyName,
        ruc: l.supplier.ruc,
        supplierSku: l.supplierSku,
      })),
      purchases: row.purchases.map((p) => ({
        id: p.id,
        supplierId: p.supplier.id,
        supplierName: p.supplier.companyName,
        purchasedAt: p.purchasedAt.toISOString(),
        quantity: num(p.quantity) ?? 0,
        unitPrice: num(p.unitPrice) ?? 0,
        totalAmount: num(p.totalAmount) ?? 0,
        currency: p.currency,
        invoiceRef: p.invoiceRef,
      })),
      images: row.images.map((im) => ({
        id: im.id,
        sortOrder: im.sortOrder,
        url: im.url,
      })),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(
    filters: ListInteriorCatalogMaterialsFilters,
  ): Promise<ListInteriorCatalogMaterialsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.InteriorCatalogMaterialWhereInput[] = [
      { applicationId: app.id },
    ];
    if (filters.category?.trim()) {
      andParts.push({
        category: { equals: filters.category.trim(), mode: 'insensitive' },
      });
    }
    if (filters.stock === 'OUT') andParts.push({ stock: { lte: 0 } });
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

    const where: Prisma.InteriorCatalogMaterialWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.interiorCatalogMaterial.findMany({
        where,
        include: { _count: { select: { images: true, supplierLinks: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.interiorCatalogMaterial.count({ where }),
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
        currency: r.currency,
        stock: num(r.stock) ?? 0,
        imageCount: r._count.images,
        suppliersCount: r._count.supplierLinks,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(
    id: string,
    applicationSlug?: string,
  ): Promise<InteriorCatalogMaterialDetail | null> {
    const row = await this.prisma.interiorCatalogMaterial.findUnique({
      where: { id },
      include: { ...DETAIL_INCLUDE, application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (
      applicationSlug?.trim() &&
      row.application.slug !== applicationSlug.trim()
    )
      return null;
    return this.mapDetail(row);
  }

  async create(
    applicationId: string,
    payload: CreateInteriorCatalogMaterialPayload,
  ): Promise<InteriorCatalogMaterialDetail> {
    const urls = (payload.imageUrls ?? []).map((u) => u.trim()).filter(Boolean);
    const row = await this.prisma.interiorCatalogMaterial.create({
      data: {
        applicationId,
        code: payload.code.trim(),
        name: payload.name.trim(),
        category: payload.category.trim(),
        brand: payload.brand.trim(),
        unit: payload.unit.trim(),
        price: new Prisma.Decimal(payload.price),
        currency: payload.currency || 'PEN',
        description: payload.description?.trim() || null,
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
      include: DETAIL_INCLUDE,
    });
    return this.mapDetail(row);
  }

  async update(
    id: string,
    payload: UpdateInteriorCatalogMaterialPayload,
  ): Promise<InteriorCatalogMaterialDetail> {
    const patch: Prisma.InteriorCatalogMaterialUncheckedUpdateInput = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.category !== undefined)
      patch.category = payload.category.trim();
    if (payload.brand !== undefined) patch.brand = payload.brand.trim();
    if (payload.unit !== undefined) patch.unit = payload.unit.trim();
    if (payload.price !== undefined)
      patch.price = new Prisma.Decimal(payload.price);
    if (payload.currency !== undefined) patch.currency = payload.currency;
    if (payload.description !== undefined)
      patch.description = payload.description?.trim() || null;
    if (payload.stock !== undefined)
      patch.stock = new Prisma.Decimal(payload.stock);
    if (payload.technicalSheetUrl !== undefined) {
      patch.technicalSheetUrl = payload.technicalSheetUrl?.trim() || null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.interiorCatalogMaterial.update({
        where: { id },
        data: patch,
      });
      if (payload.imageUrls !== undefined) {
        await tx.interiorCatalogMaterialImage.deleteMany({
          where: { materialId: id },
        });
        const urls = payload.imageUrls.map((u) => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          await tx.interiorCatalogMaterialImage.createMany({
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
    if (!detail) throw new Error('Material no encontrado.');
    return detail;
  }

  async stats(applicationSlug: string): Promise<InteriorCatalogMaterialStats> {
    const where = { application: { slug: applicationSlug } };
    const [total, outOfStock, withoutSupplier, categories] = await Promise.all([
      this.prisma.interiorCatalogMaterial.count({ where }),
      this.prisma.interiorCatalogMaterial.count({
        where: { ...where, stock: { lte: 0 } },
      }),
      this.prisma.interiorCatalogMaterial.count({
        where: { ...where, supplierLinks: { none: {} } },
      }),
      this.prisma.interiorCatalogMaterial.findMany({
        where,
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
    ]);
    return {
      total,
      outOfStock,
      withoutSupplier,
      categories: categories.map((c) => c.category),
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.interiorCatalogMaterial.delete({ where: { id } });
  }
}
