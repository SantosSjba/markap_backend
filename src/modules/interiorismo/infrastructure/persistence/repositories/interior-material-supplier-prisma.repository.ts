import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { todayDateOnlyLima } from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import type {
  CreateInteriorMaterialSupplierPayload,
  InteriorMaterialPurchaseDto,
  InteriorMaterialSupplierRepository,
  InteriorSupplierCatalogLinkDto,
  InteriorSupplierDetail,
  InteriorSupplierProjectItemDto,
  InteriorSupplierStats,
  ListInteriorMaterialSuppliersFilters,
  ListInteriorMaterialSuppliersResult,
  RecordInteriorMaterialPurchasePayload,
  UpdateInteriorMaterialSupplierPayload,
} from '../../../domain/repositories/interior-material-supplier.repository';

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
    currency: string;
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
      currency: row.currency,
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

  /** Partidas de presupuestos activos con este proveedor (lo comprado en proyectos) */
  private async loadProjectItems(
    supplierId: string,
  ): Promise<InteriorSupplierProjectItemDto[]> {
    const rows = await this.prisma.interiorBudgetRow.findMany({
      where: { supplierId, kind: 'ITEM', budget: { isActive: true } },
      orderBy: { updatedAt: 'desc' },
      include: {
        supplierPayments: { select: { amount: true } },
        budget: {
          select: {
            currency: true,
            project: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
    return rows.map((r) => ({
      rowId: r.id,
      description: r.description,
      status: r.status,
      cost:
        r.directCost != null
          ? num(r.directCost)
          : r.quantity != null && r.unitPrice != null
            ? Math.round(Number(r.quantity) * Number(r.unitPrice) * 100) / 100
            : null,
      actualCost: num(r.actualCost),
      paid: r.supplierPayments.reduce((s, p) => s + (num(p.amount) ?? 0), 0),
      currency: r.budget.currency,
      project: r.budget.project,
    }));
  }

  private async loadDetail(id: string): Promise<InteriorSupplierDetail | null> {
    const row = await this.prisma.interiorMaterialSupplier.findUnique({
      where: { id },
      include: {
        catalogLinks: {
          include: {
            catalogMaterial: {
              select: { code: true, name: true, category: true },
            },
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
      projectItems: await this.loadProjectItems(row.id),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(
    filters: ListInteriorMaterialSuppliersFilters,
  ): Promise<ListInteriorMaterialSuppliersResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.InteriorMaterialSupplierWhereInput[] = [
      { applicationId: app.id },
    ];
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
        include: {
          _count: {
            select: {
              catalogLinks: true,
              budgetRows: { where: { budget: { isActive: true } } },
            },
          },
          purchases: {
            orderBy: { purchasedAt: 'desc' },
            take: 1,
            select: { purchasedAt: true },
          },
        },
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
        projectItemsCount: r._count.budgetRows,
        lastPurchaseAt: r.purchases[0]?.purchasedAt.toISOString() ?? null,
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
  ): Promise<InteriorSupplierDetail | null> {
    if (applicationSlug?.trim()) {
      const scoped = await this.prisma.interiorMaterialSupplier.findFirst({
        where: { id, application: { slug: applicationSlug.trim() } },
        select: { id: true },
      });
      if (!scoped) return null;
    }
    return this.loadDetail(id);
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
    if (!detail) throw new Error('No se pudo cargar el proveedor.');
    return detail;
  }

  async update(
    id: string,
    payload: UpdateInteriorMaterialSupplierPayload,
  ): Promise<InteriorSupplierDetail> {
    const patch: Prisma.InteriorMaterialSupplierUncheckedUpdateInput = {};
    if (payload.companyName !== undefined)
      patch.companyName = payload.companyName.trim();
    if (payload.ruc !== undefined) patch.ruc = payload.ruc.trim();
    if (payload.contactName !== undefined)
      patch.contactName = payload.contactName?.trim() || null;
    if (payload.phone !== undefined)
      patch.phone = payload.phone?.trim() || null;
    if (payload.email !== undefined)
      patch.email = payload.email?.trim() || null;

    await this.prisma.interiorMaterialSupplier.update({
      where: { id },
      data: patch,
    });
    const detail = await this.loadDetail(id);
    if (!detail) throw new Error('Proveedor no encontrado.');
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
    if (!supplier || !material)
      throw new Error('Proveedor o material no encontrado.');
    if (supplier.applicationId !== material.applicationId) {
      throw new Error(
        'Proveedor y material deben pertenecer a la misma aplicación',
      );
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
    if (!detail)
      throw new Error('No se pudo cargar el vínculo con el proveedor.');
    return detail;
  }

  async unlinkCatalogMaterial(linkId: string): Promise<void> {
    await this.prisma.interiorSupplierCatalogLink.delete({
      where: { id: linkId },
    });
  }

  async recordPurchase(
    supplierId: string,
    payload: RecordInteriorMaterialPurchasePayload,
  ): Promise<InteriorSupplierDetail> {
    const supplier = await this.prisma.interiorMaterialSupplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new Error('Proveedor no encontrado.');

    const catalogMaterialId: string | null =
      payload.catalogMaterialId?.trim() || null;
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
        currency: payload.currency || 'PEN',
        invoiceRef: payload.invoiceRef?.trim() || null,
        notes: payload.notes?.trim() || null,
      },
    });

    const detail = await this.loadDetail(supplierId);
    if (!detail) throw new Error('No se pudo cargar la compra registrada.');
    return detail;
  }

  async stats(applicationSlug: string): Promise<InteriorSupplierStats> {
    const where = { application: { slug: applicationSlug } };
    // Primer día del mes en Lima (UTC−5)
    const monthStart = new Date(
      `${todayDateOnlyLima().slice(0, 7)}-01T05:00:00.000Z`,
    );
    const [total, withMaterials, withProjects, purchases] = await Promise.all([
      this.prisma.interiorMaterialSupplier.count({ where }),
      this.prisma.interiorMaterialSupplier.count({
        where: { ...where, catalogLinks: { some: {} } },
      }),
      this.prisma.interiorMaterialSupplier.count({
        where: {
          ...where,
          budgetRows: { some: { budget: { isActive: true } } },
        },
      }),
      this.prisma.interiorMaterialPurchase.groupBy({
        by: ['currency'],
        where: { supplier: where, purchasedAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
    ]);
    return {
      total,
      withMaterials,
      withProjects,
      purchasedThisMonth: purchases
        .map((p) => ({
          currency: p.currency,
          amount: num(p._sum.totalAmount) ?? 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    };
  }
}
