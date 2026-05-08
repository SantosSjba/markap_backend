import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateInteriorMaterialSupplierPayload,
  InteriorMaterialPurchaseDto,
  InteriorMaterialSupplierRepository,
  InteriorSupplierCatalogLinkDto,
  InteriorSupplierDetail,
  ListInteriorMaterialSuppliersFilters,
  ListInteriorMaterialSuppliersResult,
  RecordInteriorMaterialPurchasePayload,
  UpdateInteriorMaterialSupplierPayload,
} from '@domain/repositories/interior-material-supplier.repository';

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class InteriorMaterialSupplierPrismaRepository implements InteriorMaterialSupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapPurchase(row: {
    id: string;
    catalogMaterialId: string | null;
    purchasedAt: Date;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    invoiceRef: string | null;
    notes: string | null;
    catalogMaterial: { code: string; name: string } | null;
  }): InteriorMaterialPurchaseDto {
    return {
      id: row.id,
      catalogMaterialId: row.catalogMaterialId,
      materialCode: row.catalogMaterial?.code ?? null,
      materialName: row.catalogMaterial?.name ?? null,
      purchasedAt: row.purchasedAt.toISOString(),
      quantity: num(row.quantity) ?? 0,
      unitPrice: num(row.unitPrice) ?? 0,
      totalAmount: num(row.totalAmount) ?? 0,
      invoiceRef: row.invoiceRef,
      notes: row.notes,
    };
  }

  private mapLink(row: {
    id: string;
    catalogMaterialId: string;
    supplierSku: string | null;
    notes: string | null;
    catalogMaterial: { code: string; name: string; category: string };
  }): InteriorSupplierCatalogLinkDto {
    return {
      id: row.id,
      catalogMaterialId: row.catalogMaterialId,
      materialCode: row.catalogMaterial.code,
      materialName: row.catalogMaterial.name,
      category: row.catalogMaterial.category,
      supplierSku: row.supplierSku,
      notes: row.notes,
    };
  }

  private async loadDetail(id: string): Promise<InteriorSupplierDetail | null> {
    const row = await this.prisma.interiorMaterialSupplier.findUnique({
      where: { id },
      include: {
        catalogLinks: {
          include: {
            catalogMaterial: { select: { code: true, name: true, category: true } },
          },
          orderBy: { id: 'asc' },
        },
        purchases: {
          include: {
            catalogMaterial: { select: { code: true, name: true } },
          },
          orderBy: { purchasedAt: 'desc' },
        },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      companyName: row.companyName,
      ruc: row.ruc,
      contactName: row.contactName,
      phone: row.phone,
      email: row.email,
      catalogLinks: row.catalogLinks.map((l) => this.mapLink(l)),
      purchases: row.purchases.map((p) =>
        this.mapPurchase({
          ...p,
          catalogMaterial: p.catalogMaterial,
        }),
      ),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListInteriorMaterialSuppliersFilters): Promise<ListInteriorMaterialSuppliersResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.InteriorMaterialSupplierWhereInput[] = [{ applicationId: app.id }];
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { ruc: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.InteriorMaterialSupplierWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.interiorMaterialSupplier.findMany({
        where,
        include: { _count: { select: { catalogLinks: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.interiorMaterialSupplier.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        companyName: r.companyName,
        ruc: r.ruc,
        contactName: r.contactName,
        phone: r.phone,
        email: r.email,
        linkedMaterialsCount: r._count.catalogLinks,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<InteriorSupplierDetail | null> {
    const row = await this.prisma.interiorMaterialSupplier.findUnique({
      where: { id },
      include: {
        application: { select: { slug: true } },
        catalogLinks: {
          include: {
            catalogMaterial: { select: { code: true, name: true, category: true } },
          },
          orderBy: { id: 'asc' },
        },
        purchases: {
          include: {
            catalogMaterial: { select: { code: true, name: true } },
          },
          orderBy: { purchasedAt: 'desc' },
        },
      },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;

    return {
      id: row.id,
      companyName: row.companyName,
      ruc: row.ruc,
      contactName: row.contactName,
      phone: row.phone,
      email: row.email,
      catalogLinks: row.catalogLinks.map((l) => this.mapLink(l)),
      purchases: row.purchases.map((p) =>
        this.mapPurchase({
          ...p,
          catalogMaterial: p.catalogMaterial,
        }),
      ),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    applicationId: string,
    payload: CreateInteriorMaterialSupplierPayload,
  ): Promise<InteriorSupplierDetail> {
    const row = await this.prisma.interiorMaterialSupplier.create({
      data: {
        applicationId,
        companyName: payload.companyName.trim(),
        ruc: payload.ruc.trim(),
        contactName: payload.contactName?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
      },
    });
    const detail = await this.loadDetail(row.id);
    if (!detail) throw new Error('Supplier detail missing');
    return detail;
  }

  async update(id: string, payload: UpdateInteriorMaterialSupplierPayload): Promise<InteriorSupplierDetail> {
    const patch: Prisma.InteriorMaterialSupplierUncheckedUpdateInput = {};
    if (payload.companyName !== undefined) patch.companyName = payload.companyName.trim();
    if (payload.ruc !== undefined) patch.ruc = payload.ruc.trim();
    if (payload.contactName !== undefined) patch.contactName = payload.contactName?.trim() || null;
    if (payload.phone !== undefined) patch.phone = payload.phone?.trim() || null;
    if (payload.email !== undefined) patch.email = payload.email?.trim() || null;

    await this.prisma.interiorMaterialSupplier.update({
      where: { id },
      data: patch,
    });
    const detail = await this.loadDetail(id);
    if (!detail) throw new Error('Supplier update: not found');
    return detail;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.interiorMaterialSupplier.delete({ where: { id } });
  }

  async linkCatalogMaterial(
    supplierId: string,
    catalogMaterialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ): Promise<InteriorSupplierDetail> {
    const supplier = await this.prisma.interiorMaterialSupplier.findUnique({
      where: { id: supplierId },
    });
    const material = await this.prisma.interiorCatalogMaterial.findUnique({
      where: { id: catalogMaterialId },
    });
    if (!supplier || !material) throw new Error('Supplier or material not found');
    if (supplier.applicationId !== material.applicationId) {
      throw new Error('Proveedor y material deben pertenecer a la misma aplicación');
    }

    await this.prisma.interiorSupplierCatalogLink.create({
      data: {
        supplierId,
        catalogMaterialId,
        supplierSku: supplierSku?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    const detail = await this.loadDetail(supplierId);
    if (!detail) throw new Error('Supplier link: detail missing');
    return detail;
  }

  async unlinkCatalogMaterial(linkId: string): Promise<void> {
    await this.prisma.interiorSupplierCatalogLink.delete({ where: { id: linkId } });
  }

  async recordPurchase(
    supplierId: string,
    payload: RecordInteriorMaterialPurchasePayload,
  ): Promise<InteriorSupplierDetail> {
    const supplier = await this.prisma.interiorMaterialSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new Error('Supplier not found');

    let catalogMaterialId: string | null = payload.catalogMaterialId?.trim() || null;
    if (catalogMaterialId) {
      const material = await this.prisma.interiorCatalogMaterial.findUnique({
        where: { id: catalogMaterialId },
      });
      if (!material || material.applicationId !== supplier.applicationId) {
        throw new Error('Material de catálogo inválido para este proveedor');
      }
    }

    const qty = new Prisma.Decimal(payload.quantity);
    const unit = new Prisma.Decimal(payload.unitPrice);
    const totalAmount = qty.mul(unit);

    await this.prisma.interiorMaterialPurchase.create({
      data: {
        supplierId,
        catalogMaterialId,
        purchasedAt: payload.purchasedAt,
        quantity: qty,
        unitPrice: unit,
        totalAmount,
        invoiceRef: payload.invoiceRef?.trim() || null,
        notes: payload.notes?.trim() || null,
      },
    });

    const detail = await this.loadDetail(supplierId);
    if (!detail) throw new Error('Purchase: detail missing');
    return detail;
  }
}
