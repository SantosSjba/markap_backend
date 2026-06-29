import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateProduccionMaterialPayload,
  CreateProduccionStockMovementPayload,
  ListProduccionMaterialsFilters,
  ListProduccionMaterialsResult,
  ListProduccionStockMovementsFilters,
  ListProduccionStockMovementsResult,
  ProduccionInventoryStats,
  ProduccionMaterialDetail,
  ProduccionMaterialRepository,
  ProduccionStockMovementDto,
  ProduccionStockMovementType,
  UpdateProduccionMaterialPayload,
} from '@domain/repositories/produccion-material.repository';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isLowStock(current: number, min: number): boolean {
  return min > 0 && current < min;
}

@Injectable()
export class ProduccionMaterialPrismaRepository implements ProduccionMaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapListItem(row: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    unitCost: Prisma.Decimal;
    minStockQty: Prisma.Decimal;
    currentStock: Prisma.Decimal;
    isActive: boolean;
    updatedAt: Date;
  }) {
    const currentStock = num(row.currentStock);
    const minStockQty = num(row.minStockQty);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      unit: row.unit,
      unitCost: num(row.unitCost),
      minStockQty,
      currentStock,
      isActive: row.isActive,
      isLowStock: isLowStock(currentStock, minStockQty),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapDetail(row: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    unitCost: Prisma.Decimal;
    minStockQty: Prisma.Decimal;
    currentStock: Prisma.Decimal;
    isActive: boolean;
    notes: string | null;
    updatedAt: Date;
  }): ProduccionMaterialDetail {
    return { ...this.mapListItem(row), notes: row.notes };
  }

  private mapMovement(row: {
    id: string;
    materialId: string;
    movementType: string;
    quantity: Prisma.Decimal;
    balanceAfter: Prisma.Decimal;
    unitCost: Prisma.Decimal | null;
    reference: string | null;
    notes: string | null;
    createdAt: Date;
    material: { code: string; name: string };
  }): ProduccionStockMovementDto {
    return {
      id: row.id,
      materialId: row.materialId,
      materialCode: row.material.code,
      materialName: row.material.name,
      movementType: row.movementType as ProduccionStockMovementType,
      quantity: num(row.quantity),
      balanceAfter: num(row.balanceAfter),
      unitCost: row.unitCost != null ? num(row.unitCost) : null,
      reference: row.reference,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(filters: ListProduccionMaterialsFilters): Promise<ListProduccionMaterialsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionMaterialWhereInput[] = [{ applicationId: app.id }];
    if (filters.category?.trim()) {
      andParts.push({ category: { equals: filters.category.trim(), mode: 'insensitive' } });
    }
    if (filters.isActive !== undefined) andParts.push({ isActive: filters.isActive });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    let where: Prisma.ProduccionMaterialWhereInput = { AND: andParts };

    if (filters.lowStockOnly) {
      const all = await this.prisma.produccionMaterial.findMany({ where, orderBy: { updatedAt: 'desc' } });
      const filtered = all.filter((r) => isLowStock(num(r.currentStock), num(r.minStockQty)));
      const page = filters.page;
      const limit = filters.limit;
      const slice = filtered.slice((page - 1) * limit, page * limit);
      return {
        data: slice.map((r) => this.mapListItem(r)),
        total: filtered.length,
        page,
        limit,
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.produccionMaterial.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionMaterial.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapListItem(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getStats(applicationSlug: string): Promise<ProduccionInventoryStats> {
    const app = await this.prisma.application.findUnique({
      where: { slug: applicationSlug.trim() },
    });
    if (!app) return { totalMaterials: 0, activeMaterials: 0, lowStockCount: 0, totalStockValue: 0 };

    const rows = await this.prisma.produccionMaterial.findMany({
      where: { applicationId: app.id },
    });

    let lowStockCount = 0;
    let totalStockValue = 0;
    let activeMaterials = 0;
    for (const r of rows) {
      if (r.isActive) activeMaterials += 1;
      const stock = num(r.currentStock);
      const min = num(r.minStockQty);
      if (isLowStock(stock, min)) lowStockCount += 1;
      totalStockValue += stock * num(r.unitCost);
    }

    return {
      totalMaterials: rows.length,
      activeMaterials,
      lowStockCount,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<ProduccionMaterialDetail | null> {
    const row = await this.prisma.produccionMaterial.findUnique({
      where: { id },
      include: { application: { select: { slug: true } } },
    });
    if (!row) return null;
    if (applicationSlug?.trim() && row.application.slug !== applicationSlug.trim()) return null;
    const { application: _a, ...mat } = row;
    return this.mapDetail(mat);
  }

  async create(applicationId: string, payload: CreateProduccionMaterialPayload) {
    const dup = await this.prisma.produccionMaterial.findFirst({
      where: { applicationId, code: payload.code.trim() },
    });
    if (dup) throw new BadRequestException('Ya existe un material con ese código');

    const row = await this.prisma.produccionMaterial.create({
      data: {
        applicationId,
        code: payload.code.trim(),
        name: payload.name.trim(),
        category: payload.category.trim(),
        unit: payload.unit.trim(),
        unitCost: new Prisma.Decimal(payload.unitCost ?? 0),
        minStockQty: new Prisma.Decimal(payload.minStockQty ?? 0),
        isActive: payload.isActive ?? true,
        notes: payload.notes?.trim() || null,
      },
    });
    return this.mapDetail(row);
  }

  async update(id: string, payload: UpdateProduccionMaterialPayload) {
    const patch: Prisma.ProduccionMaterialUncheckedUpdateInput = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.category !== undefined) patch.category = payload.category.trim();
    if (payload.unit !== undefined) patch.unit = payload.unit.trim();
    if (payload.unitCost !== undefined) patch.unitCost = new Prisma.Decimal(payload.unitCost);
    if (payload.minStockQty !== undefined) patch.minStockQty = new Prisma.Decimal(payload.minStockQty);
    if (payload.isActive !== undefined) patch.isActive = payload.isActive;
    if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;

    const row = await this.prisma.produccionMaterial.update({ where: { id }, data: patch });
    return this.mapDetail(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.produccionMaterial.delete({ where: { id } });
  }

  async listMovements(
    filters: ListProduccionStockMovementsFilters,
  ): Promise<ListProduccionStockMovementsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) return { data: [], total: 0, page: filters.page, limit: filters.limit };

    const andParts: Prisma.ProduccionStockMovementWhereInput[] = [
      { material: { applicationId: app.id } },
    ];
    if (filters.materialId) andParts.push({ materialId: filters.materialId });
    if (filters.movementType) andParts.push({ movementType: filters.movementType });
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { reference: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
          { material: { code: { contains: q, mode: 'insensitive' } } },
          { material: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const where = { AND: andParts };
    const [rows, total] = await Promise.all([
      this.prisma.produccionStockMovement.findMany({
        where,
        include: { material: { select: { code: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.produccionStockMovement.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapMovement(r)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async createMovement(
    applicationSlug: string,
    payload: CreateProduccionStockMovementPayload,
  ): Promise<ProduccionStockMovementDto> {
    const type = payload.movementType;
    const qty = payload.quantity;
    if (qty < 0) throw new BadRequestException('La cantidad debe ser positiva');

    const material = await this.prisma.produccionMaterial.findFirst({
      where: {
        id: payload.materialId,
        application: { slug: applicationSlug.trim() },
      },
    });
    if (!material) throw new BadRequestException('Material no encontrado');

    const current = num(material.currentStock);
    let balanceAfter: number;
    let movementQty: number;

    if (type === 'IN') {
      movementQty = qty;
      balanceAfter = current + qty;
    } else if (type === 'OUT') {
      movementQty = qty;
      balanceAfter = current - qty;
      if (balanceAfter < 0) {
        throw new BadRequestException('Stock insuficiente para la salida');
      }
    } else if (type === 'ADJUST') {
      balanceAfter = qty;
      movementQty = Math.abs(balanceAfter - current);
    } else {
      throw new BadRequestException('Tipo de movimiento inválido');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.produccionMaterial.update({
        where: { id: material.id },
        data: { currentStock: new Prisma.Decimal(balanceAfter) },
      });
      return tx.produccionStockMovement.create({
        data: {
          materialId: material.id,
          movementType: type,
          quantity: new Prisma.Decimal(movementQty),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          unitCost:
            payload.unitCost != null ? new Prisma.Decimal(payload.unitCost) : material.unitCost,
          reference: payload.reference?.trim() || null,
          notes: payload.notes?.trim() || null,
        },
        include: { material: { select: { code: true, name: true } } },
      });
    });

    return this.mapMovement(row);
  }
}
