import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionSupplierPayload,
  ListProduccionSuppliersFilters,
  ListProduccionSuppliersResult,
  ProduccionSupplierDetail,
  ProduccionSupplierMaterialLinkDto,
  ProduccionSupplierRepository,
  UpdateProduccionSupplierPayload,
} from '@domain/repositories/produccion-supplier.repository';

@Injectable()
export class ProduccionSupplierPrismaRepository implements ProduccionSupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapLink(row: {
    id: string;
    materialId: string;
    supplierSku: string | null;
    notes: string | null;
    material: { code: string; name: string; category: string };
  }): ProduccionSupplierMaterialLinkDto {
    return {
      id: row.id,
      materialId: row.materialId,
      materialCode: row.material.code,
      materialName: row.material.name,
      category: row.material.category,
      supplierSku: row.supplierSku,
      notes: row.notes,
    };
  }

  private async loadDetail(id: string): Promise<ProduccionSupplierDetail | null> {
    const row = await this.prisma.produccionSupplier.findUnique({
      where: { id },
      include: {
        materialLinks: {
          include: { material: { select: { code: true, name: true, category: true } } },
          orderBy: { id: 'asc' },
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
      isActive: row.isActive,
      notes: row.notes,
      materialLinks: row.materialLinks.map((l) => this.mapLink(l)),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: ListProduccionSuppliersFilters): Promise<ListProduccionSuppliersResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionSupplierWhereInput[] = [{ applicationId: app.id }];
    if (filters.isActive !== undefined) andParts.push({ isActive: filters.isActive });
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

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionSupplier.findMany({
        where,
        include: { _count: { select: { materialLinks: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionSupplier.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        companyName: r.companyName,
        ruc: r.ruc,
        contactName: r.contactName,
        phone: r.phone,
        email: r.email,
        isActive: r.isActive,
        linkedMaterialsCount: r._count.materialLinks,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionSupplierDetail | null> {
    const row = await this.prisma.produccionSupplier.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    return this.loadDetail(id);
  }

  async create(applicationId: string, payload: CreateProduccionSupplierPayload) {
    const dup = await this.prisma.produccionSupplier.findFirst({
      where: { applicationId, ruc: payload.ruc.trim() },
    });
    if (dup) throw new BadRequestException('Ya existe un proveedor con ese RUC');

    const row = await this.prisma.produccionSupplier.create({
      data: {
        applicationId,
        companyName: payload.companyName.trim(),
        ruc: payload.ruc.trim(),
        contactName: payload.contactName?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
        isActive: payload.isActive ?? true,
        notes: payload.notes?.trim() || null,
      },
    });
    const detail = await this.loadDetail(row.id);
    if (!detail) throw new BadRequestException('Error al crear proveedor');
    return detail;
  }

  async update(id: string, payload: UpdateProduccionSupplierPayload) {
    const current = await this.prisma.produccionSupplier.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Proveedor no encontrado');

    if (payload.ruc !== undefined) {
      const dup = await this.prisma.produccionSupplier.findFirst({
        where: { applicationId: current.applicationId, ruc: payload.ruc.trim(), NOT: { id } },
      });
      if (dup) throw new BadRequestException('Ya existe un proveedor con ese RUC');
    }

    const patch: Prisma.ProduccionSupplierUncheckedUpdateInput = {};
    if (payload.companyName !== undefined) patch.companyName = payload.companyName.trim();
    if (payload.ruc !== undefined) patch.ruc = payload.ruc.trim();
    if (payload.contactName !== undefined) patch.contactName = payload.contactName?.trim() || null;
    if (payload.phone !== undefined) patch.phone = payload.phone?.trim() || null;
    if (payload.email !== undefined) patch.email = payload.email?.trim() || null;
    if (payload.isActive !== undefined) patch.isActive = payload.isActive;
    if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;

    await this.prisma.produccionSupplier.update({ where: { id }, data: patch });
    const detail = await this.loadDetail(id);
    if (!detail) throw new BadRequestException('Proveedor no encontrado');
    return detail;
  }

  async delete(id: string): Promise<void> {
    const orders = await this.prisma.produccionPurchaseOrder.count({ where: { supplierId: id } });
    if (orders > 0) {
      throw new BadRequestException('No se puede eliminar: el proveedor tiene órdenes de compra');
    }
    await this.prisma.produccionSupplier.delete({ where: { id } });
  }

  async linkMaterial(
    supplierId: string,
    materialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ) {
    const supplier = await this.prisma.produccionSupplier.findUnique({
      where: { id: supplierId },
      include: { application: true },
    });
    if (!supplier) throw new BadRequestException('Proveedor no encontrado');

    const material = await this.prisma.produccionMaterial.findUnique({ where: { id: materialId } });
    if (!material || material.applicationId !== supplier.applicationId) {
      throw new BadRequestException('Material inválido para este proveedor');
    }

    await this.prisma.produccionSupplierMaterialLink.upsert({
      where: { supplierId_materialId: { supplierId, materialId } },
      create: {
        supplierId,
        materialId,
        supplierSku: supplierSku?.trim() || null,
        notes: notes?.trim() || null,
      },
      update: {
        supplierSku: supplierSku?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    const detail = await this.loadDetail(supplierId);
    if (!detail) throw new BadRequestException('Proveedor no encontrado');
    return detail;
  }

  async unlinkMaterial(linkId: string): Promise<void> {
    await this.prisma.produccionSupplierMaterialLink.delete({ where: { id: linkId } });
  }
}
