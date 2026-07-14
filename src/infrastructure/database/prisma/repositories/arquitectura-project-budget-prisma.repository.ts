import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  computeEmergencyUtility,
  computeLineItemPricing,
  computeLineItemPurchase,
  computeProjectSettlement,
} from '@domain/interior-project-budget/interior-project-budget-calculations';
import { formatDateOnly } from '@domain/utils/peru-date.util';
import type {
  CreateLineItemSupplierPaymentPayload,
  CreateProjectBudgetLineItemPayload,
  CreateProjectBudgetSectionPayload,
  ArquitecturaProjectBudgetRepository,
  ListProjectBudgetSummariesFilters,
  ListProjectBudgetSummariesResult,
  ProjectBudgetSummaryListItem,
  ProjectBudgetDetailDto,
  ProjectBudgetLineItemDto,
  ProjectBudgetSectionDto,
  ProjectSettlementDto,
  UpdateProjectBudgetLineItemPayload,
  UpdateProjectBudgetSectionPayload,
} from '@domain/repositories/arquitectura-project-budget.repository';

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class ArquitecturaProjectBudgetPrismaRepository implements ArquitecturaProjectBudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProject(projectId: string, applicationSlug = 'arquitectura') {
    const app = await this.prisma.application.findUnique({ where: { slug: applicationSlug } });
    if (!app) throw new NotFoundException('Aplicación no encontrada');
    const project = await this.prisma.arquitecturaProject.findFirst({
      where: { id: projectId, applicationId: app.id, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  private mapLineItem(
    row: {
      id: string;
      sectionId: string;
      sortOrder: number;
      description: string;
      budgetedCost: Prisma.Decimal;
      hasIgv: boolean;
      actualPurchaseCost: Prisma.Decimal | null;
      supplierName: string | null;
      supplierId: string | null;
      supplierPayments: Array<{
        id: string;
        paymentNumber: number;
        amount: Prisma.Decimal;
        paidAt: Date;
      }>;
    },
    utilityPct: number,
    igvPct: number,
  ): ProjectBudgetLineItemDto {
    const pricing = computeLineItemPricing({
      budgetedCost: num(row.budgetedCost),
      hasIgv: row.hasIgv,
      utilityPct,
      igvPct,
    });
    const purchase = computeLineItemPurchase({
      actualPurchaseCost: numOrNull(row.actualPurchaseCost),
      supplierPayments: row.supplierPayments.map((p) => ({ amount: num(p.amount) })),
    });
    return {
      id: row.id,
      sectionId: row.sectionId,
      sortOrder: row.sortOrder,
      description: row.description,
      budgetedCost: num(row.budgetedCost),
      hasIgv: row.hasIgv,
      actualPurchaseCost: numOrNull(row.actualPurchaseCost),
      supplierName: row.supplierName,
      supplierId: row.supplierId,
      utilityAmount: pricing.utilityAmount,
      totalBeforeIgv: pricing.totalBeforeIgv,
      igvAmount: pricing.igvAmount,
      price: pricing.price,
      emergencyUtilityAmount: computeEmergencyUtility(
        num(row.budgetedCost),
        numOrNull(row.actualPurchaseCost),
      ),
      totalSupplierPayments: purchase.totalSupplierPayments,
      supplierBalance: purchase.supplierBalance,
      supplierPayments: row.supplierPayments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amount: num(p.amount),
        paidAt: formatDateOnly(p.paidAt),
      })),
    };
  }

  private async loadBudget(projectId: string, applicationSlug?: string): Promise<ProjectBudgetDetailDto | null> {
    const project = await this.assertProject(projectId, applicationSlug);
    const utilityPct = num(project.defaultUtilityPct);
    const igvPct = num(project.defaultIgvPct);

    const sections = await this.prisma.arquitecturaProjectSection.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
          include: { supplierPayments: { orderBy: { paymentNumber: 'asc' } } },
        },
      },
    });

    let budgetedCostTotal = 0;
    let utilityTotal = 0;
    let igvTotal = 0;
    let priceTotal = 0;
    let actualPurchaseCostTotal = 0;

    const mappedSections: ProjectBudgetSectionDto[] = sections.map((section) => {
      const lineItems = section.lineItems.map((item) =>
        this.mapLineItem(item, utilityPct, igvPct),
      );
      const sectionTotal = lineItems.reduce((sum, item) => sum + item.price, 0);
      for (const item of lineItems) {
        budgetedCostTotal += item.budgetedCost;
        utilityTotal += item.utilityAmount;
        igvTotal += item.igvAmount;
        priceTotal += item.price;
        if (item.actualPurchaseCost != null) actualPurchaseCostTotal += item.actualPurchaseCost;
      }
      return {
        id: section.id,
        name: section.name,
        sortOrder: section.sortOrder,
        lineItems,
        sectionTotal: Math.round(sectionTotal * 100) / 100,
      };
    });

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      city: project.city,
      interventionLevel: project.interventionLevel,
      executionTimeNote: project.executionTimeNote,
      currency: project.currency,
      defaultUtilityPct: utilityPct,
      defaultIgvPct: igvPct,
      sections: mappedSections,
      totals: {
        budgetedCostTotal: Math.round(budgetedCostTotal * 100) / 100,
        utilityTotal: Math.round(utilityTotal * 100) / 100,
        igvTotal: Math.round(igvTotal * 100) / 100,
        priceTotal: Math.round(priceTotal * 100) / 100,
        actualPurchaseCostTotal: Math.round(actualPurchaseCostTotal * 100) / 100,
      },
    };
  }

  async getBudget(projectId: string, applicationSlug?: string): Promise<ProjectBudgetDetailDto | null> {
    return this.loadBudget(projectId, applicationSlug);
  }

  async getSettlement(projectId: string, applicationSlug?: string): Promise<ProjectSettlementDto | null> {
    const budget = await this.loadBudget(projectId, applicationSlug);
    if (!budget) return null;

    const payments = await this.prisma.arquitecturaProjectPayment.findMany({
      where: { projectId },
      orderBy: { paidAt: 'asc' },
    });

    const lineItemPrices = budget.sections.flatMap((s) => s.lineItems.map((i) => i.price));
    const lineItemActualCosts = budget.sections.flatMap((s) =>
      s.lineItems.map((i) => i.actualPurchaseCost),
    );

    const settlement = computeProjectSettlement({
      lineItemPrices,
      lineItemActualCosts,
      clientPayments: payments.map((p) => ({
        amount: num(p.amount),
        paymentType: p.paymentType,
        status: p.status,
      })),
    });

    const totalSupplierPayments = budget.sections
      .flatMap((s) => s.lineItems)
      .reduce((sum, item) => sum + item.totalSupplierPayments, 0);

    return {
      ...settlement,
      igvTotal: budget.totals.igvTotal,
      totalSupplierPayments: Math.round(totalSupplierPayments * 100) / 100,
    };
  }

  async createSection(
    projectId: string,
    payload: CreateProjectBudgetSectionPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetSectionDto> {
    await this.assertProject(projectId, applicationSlug);
    const maxOrder = await this.prisma.arquitecturaProjectSection.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
    const section = await this.prisma.arquitecturaProjectSection.create({
      data: {
        projectId,
        name: payload.name.trim(),
        sortOrder: payload.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: {
        lineItems: { include: { supplierPayments: true } },
      },
    });
    return {
      id: section.id,
      name: section.name,
      sortOrder: section.sortOrder,
      lineItems: [],
      sectionTotal: 0,
    };
  }

  async updateSection(
    projectId: string,
    sectionId: string,
    payload: UpdateProjectBudgetSectionPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetSectionDto> {
    const project = await this.assertProject(projectId, applicationSlug);
    const section = await this.prisma.arquitecturaProjectSection.findFirst({
      where: { id: sectionId, projectId },
      include: {
        lineItems: { include: { supplierPayments: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!section) throw new NotFoundException('Sección no encontrada');

    const updated = await this.prisma.arquitecturaProjectSection.update({
      where: { id: sectionId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
        ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
      },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
          include: { supplierPayments: { orderBy: { paymentNumber: 'asc' } } },
        },
      },
    });

    const utilityPct = num(project.defaultUtilityPct);
    const igvPct = num(project.defaultIgvPct);
    const lineItems = updated.lineItems.map((item) => this.mapLineItem(item, utilityPct, igvPct));
    return {
      id: updated.id,
      name: updated.name,
      sortOrder: updated.sortOrder,
      lineItems,
      sectionTotal: Math.round(lineItems.reduce((s, i) => s + i.price, 0) * 100) / 100,
    };
  }

  async deleteSection(projectId: string, sectionId: string, applicationSlug?: string): Promise<void> {
    await this.assertProject(projectId, applicationSlug);
    const section = await this.prisma.arquitecturaProjectSection.findFirst({
      where: { id: sectionId, projectId },
    });
    if (!section) throw new NotFoundException('Sección no encontrada');
    await this.prisma.arquitecturaProjectSection.delete({ where: { id: sectionId } });
  }

  async createLineItem(
    projectId: string,
    payload: CreateProjectBudgetLineItemPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetLineItemDto> {
    const project = await this.assertProject(projectId, applicationSlug);
    const section = await this.prisma.arquitecturaProjectSection.findFirst({
      where: { id: payload.sectionId, projectId },
    });
    if (!section) throw new NotFoundException('Sección no encontrada');

    const maxOrder = await this.prisma.arquitecturaProjectLineItem.aggregate({
      where: { sectionId: payload.sectionId },
      _max: { sortOrder: true },
    });

    const row = await this.prisma.arquitecturaProjectLineItem.create({
      data: {
        sectionId: payload.sectionId,
        sortOrder: payload.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        description: payload.description.trim(),
        budgetedCost: new Prisma.Decimal(payload.budgetedCost),
        hasIgv: payload.hasIgv ?? false,
        actualPurchaseCost:
          payload.actualPurchaseCost != null
            ? new Prisma.Decimal(payload.actualPurchaseCost)
            : null,
        supplierName: payload.supplierName?.trim() || null,
        supplierId: payload.supplierId ?? null,
      },
      include: { supplierPayments: { orderBy: { paymentNumber: 'asc' } } },
    });

    return this.mapLineItem(row, num(project.defaultUtilityPct), num(project.defaultIgvPct));
  }

  async updateLineItem(
    projectId: string,
    lineItemId: string,
    payload: UpdateProjectBudgetLineItemPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetLineItemDto> {
    const project = await this.assertProject(projectId, applicationSlug);
    const existing = await this.prisma.arquitecturaProjectLineItem.findFirst({
      where: { id: lineItemId, section: { projectId } },
    });
    if (!existing) throw new NotFoundException('Partida no encontrada');

    let resolvedSupplierName: string | null | undefined;
    if (payload.supplierId !== undefined) {
      if (payload.supplierId === null) {
        resolvedSupplierName =
          payload.supplierName !== undefined ? payload.supplierName?.trim() || null : undefined;
      } else {
        const supplier = await this.prisma.arquitecturaMaterialSupplier.findUnique({
          where: { id: payload.supplierId },
        });
        if (!supplier) throw new NotFoundException('Proveedor no encontrado');
        resolvedSupplierName = supplier.companyName;
      }
    } else if (payload.supplierName !== undefined) {
      resolvedSupplierName = payload.supplierName?.trim() || null;
    }

    const row = await this.prisma.arquitecturaProjectLineItem.update({
      where: { id: lineItemId },
      data: {
        ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
        ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
        ...(payload.budgetedCost !== undefined
          ? { budgetedCost: new Prisma.Decimal(payload.budgetedCost) }
          : {}),
        ...(payload.hasIgv !== undefined ? { hasIgv: payload.hasIgv } : {}),
        ...(payload.actualPurchaseCost !== undefined
          ? {
              actualPurchaseCost:
                payload.actualPurchaseCost == null
                  ? null
                  : new Prisma.Decimal(payload.actualPurchaseCost),
            }
          : {}),
        ...(resolvedSupplierName !== undefined
          ? { supplierName: resolvedSupplierName }
          : payload.supplierName !== undefined
            ? { supplierName: payload.supplierName?.trim() || null }
            : {}),
        ...(payload.supplierId !== undefined ? { supplierId: payload.supplierId } : {}),
      },
      include: { supplierPayments: { orderBy: { paymentNumber: 'asc' } } },
    });

    return this.mapLineItem(row, num(project.defaultUtilityPct), num(project.defaultIgvPct));
  }

  async deleteLineItem(
    projectId: string,
    lineItemId: string,
    applicationSlug?: string,
  ): Promise<void> {
    await this.assertProject(projectId, applicationSlug);
    const existing = await this.prisma.arquitecturaProjectLineItem.findFirst({
      where: { id: lineItemId, section: { projectId } },
    });
    if (!existing) throw new NotFoundException('Partida no encontrada');
    await this.prisma.arquitecturaProjectLineItem.delete({ where: { id: lineItemId } });
  }

  async createSupplierPayment(
    projectId: string,
    payload: CreateLineItemSupplierPaymentPayload,
    applicationSlug?: string,
  ): Promise<ProjectBudgetLineItemDto> {
    const project = await this.assertProject(projectId, applicationSlug);
    const lineItem = await this.prisma.arquitecturaProjectLineItem.findFirst({
      where: { id: payload.lineItemId, section: { projectId } },
    });
    if (!lineItem) throw new NotFoundException('Partida no encontrada');

    await this.prisma.arquitecturaLineItemSupplierPayment.upsert({
      where: {
        lineItemId_paymentNumber: {
          lineItemId: payload.lineItemId,
          paymentNumber: payload.paymentNumber,
        },
      },
      create: {
        lineItemId: payload.lineItemId,
        paymentNumber: payload.paymentNumber,
        amount: new Prisma.Decimal(payload.amount),
        paidAt: payload.paidAt,
      },
      update: {
        amount: new Prisma.Decimal(payload.amount),
        paidAt: payload.paidAt,
      },
    });

    const row = await this.prisma.arquitecturaProjectLineItem.findUniqueOrThrow({
      where: { id: payload.lineItemId },
      include: { supplierPayments: { orderBy: { paymentNumber: 'asc' } } },
    });
    return this.mapLineItem(row, num(project.defaultUtilityPct), num(project.defaultIgvPct));
  }

  async deleteSupplierPayment(
    projectId: string,
    paymentId: string,
    applicationSlug?: string,
  ): Promise<void> {
    await this.assertProject(projectId, applicationSlug);
    const payment = await this.prisma.arquitecturaLineItemSupplierPayment.findFirst({
      where: { id: paymentId, lineItem: { section: { projectId } } },
    });
    if (!payment) throw new NotFoundException('Abono no encontrado');
    await this.prisma.arquitecturaLineItemSupplierPayment.delete({ where: { id: paymentId } });
  }

  async duplicateBudgetSnapshot(projectId: string, applicationSlug?: string) {
    await this.assertProject(projectId, applicationSlug);

    const sections = await this.prisma.arquitecturaProjectSection.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
    if (sections.length === 0) {
      throw new BadRequestException('No hay secciones para duplicar');
    }

    const maxOrder = await this.prisma.arquitecturaProjectSection.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    let lineItemsCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const section of sections) {
        const created = await tx.arquitecturaProjectSection.create({
          data: {
            projectId,
            name: `${section.name} — copia ${stamp}`,
            sortOrder: nextOrder++,
          },
        });

        for (const item of section.lineItems) {
          await tx.arquitecturaProjectLineItem.create({
            data: {
              sectionId: created.id,
              sortOrder: item.sortOrder,
              description: item.description,
              budgetedCost: item.budgetedCost,
              hasIgv: item.hasIgv,
            },
          });
          lineItemsCreated++;
        }
      }
    });

    const budget = await this.loadBudget(projectId, applicationSlug);
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    return {
      sectionsCreated: sections.length,
      lineItemsCreated,
      budget,
    };
  }

  async syncActualCostsFromExecution(projectId: string, applicationSlug?: string) {
    await this.assertProject(projectId, applicationSlug);

    const costs = await this.prisma.arquitecturaExecutionActualCost.findMany({
      where: {
        projectId,
        costCategory: { in: ['MATERIAL', 'EXPENSE', 'TRANSPORT'] },
      },
    });

    const amountByConcept = new Map<string, number>();
    const displayByConcept = new Map<string, string>();
    for (const cost of costs) {
      const key = cost.concept.trim().toLowerCase();
      if (!key) continue;
      amountByConcept.set(key, (amountByConcept.get(key) ?? 0) + num(cost.amount));
      if (!displayByConcept.has(key)) displayByConcept.set(key, cost.concept.trim());
    }

    const lineItems = await this.prisma.arquitecturaProjectLineItem.findMany({
      where: { section: { projectId } },
    });

    const matchedKeys = new Set<string>();
    let updatedLineItems = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const key = item.description.trim().toLowerCase();
        const amount = amountByConcept.get(key);
        if (amount == null) continue;

        await tx.arquitecturaProjectLineItem.update({
          where: { id: item.id },
          data: { actualPurchaseCost: new Prisma.Decimal(amount) },
        });
        matchedKeys.add(key);
        updatedLineItems++;
      }
    });

    const unmatchedConcepts = [...amountByConcept.keys()]
      .filter((key) => !matchedKeys.has(key))
      .map((key) => displayByConcept.get(key) ?? key);

    const budget = await this.loadBudget(projectId, applicationSlug);
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    return { updatedLineItems, unmatchedConcepts, budget };
  }

  async assertProjectExists(projectId: string, applicationSlug?: string): Promise<void> {
    await this.assertProject(projectId, applicationSlug);
  }

  async assertLineItemBelongsToProject(
    projectId: string,
    lineItemId: string,
    applicationSlug?: string,
  ): Promise<void> {
    await this.assertProject(projectId, applicationSlug);
    const lineItem = await this.prisma.arquitecturaProjectLineItem.findFirst({
      where: { id: lineItemId, section: { projectId } },
    });
    if (!lineItem) throw new NotFoundException('Partida no encontrada');
  }

  async importBudgetSections(
    projectId: string,
    sections: Array<{
      name: string;
      lineItems: Array<{ description: string; budgetedCost: number; hasIgv?: boolean }>;
    }>,
    replace: boolean,
    applicationSlug?: string,
  ) {
    await this.assertProject(projectId, applicationSlug);

    if (replace) {
      await this.prisma.arquitecturaProjectSection.deleteMany({ where: { projectId } });
    }

    const maxOrder = await this.prisma.arquitecturaProjectSection.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
    let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    let sectionsCreated = 0;
    let lineItemsCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const section of sections) {
        const created = await tx.arquitecturaProjectSection.create({
          data: {
            projectId,
            name: section.name.trim(),
            sortOrder: nextOrder++,
          },
        });
        sectionsCreated++;

        let itemOrder = 0;
        for (const item of section.lineItems) {
          await tx.arquitecturaProjectLineItem.create({
            data: {
              sectionId: created.id,
              sortOrder: itemOrder++,
              description: item.description.trim(),
              budgetedCost: new Prisma.Decimal(item.budgetedCost),
              hasIgv: item.hasIgv ?? false,
            },
          });
          lineItemsCreated++;
        }
      }
    });

    const budget = await this.loadBudget(projectId, applicationSlug);
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    return { sectionsCreated, lineItemsCreated, budget };
  }

  async listBudgetSummaries(
    filters: ListProjectBudgetSummariesFilters,
  ): Promise<ListProjectBudgetSummariesResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.ArquitecturaProjectWhereInput[] = [
      { applicationId: app.id, deletedAt: null },
    ];

    if (filters.clientId?.trim()) {
      andParts.push({ clientId: filters.clientId.trim() });
    }
    if (filters.status?.trim()) {
      andParts.push({ status: filters.status.trim() });
    }
    if (filters.onlyWithBudget) {
      andParts.push({ budgetSections: { some: {} } });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { client: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.ArquitecturaProjectWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.arquitecturaProject.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, documentNumber: true } },
          budgetSections: {
            select: {
              updatedAt: true,
              lineItems: {
                select: {
                  budgetedCost: true,
                  hasIgv: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.arquitecturaProject.count({ where }),
    ]);

    const data: ProjectBudgetSummaryListItem[] = rows.map((row) => {
      const utilityPct = num(row.defaultUtilityPct);
      const igvPct = num(row.defaultIgvPct);
      let lineItemCount = 0;
      let priceTotal = 0;
      let budgetUpdatedAt: Date | null = null;

      for (const section of row.budgetSections) {
        if (!budgetUpdatedAt || section.updatedAt > budgetUpdatedAt) {
          budgetUpdatedAt = section.updatedAt;
        }
        for (const item of section.lineItems) {
          lineItemCount++;
          if (!budgetUpdatedAt || item.updatedAt > budgetUpdatedAt) {
            budgetUpdatedAt = item.updatedAt;
          }
          const pricing = computeLineItemPricing({
            budgetedCost: num(item.budgetedCost),
            hasIgv: item.hasIgv,
            utilityPct,
            igvPct,
          });
          priceTotal += pricing.price;
        }
      }

      const sectionCount = row.budgetSections.length;

      return {
        projectId: row.id,
        projectCode: row.code,
        projectName: row.name,
        projectStatus: row.status,
        projectType: row.projectType,
        client: {
          id: row.client.id,
          fullName: row.client.fullName,
          documentNumber: row.client.documentNumber,
        },
        currency: row.currency,
        sectionCount,
        lineItemCount,
        priceTotal: Math.round(priceTotal * 100) / 100,
        hasBudget: sectionCount > 0,
        budgetUpdatedAt: budgetUpdatedAt ? budgetUpdatedAt.toISOString() : null,
      };
    });

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }
}
