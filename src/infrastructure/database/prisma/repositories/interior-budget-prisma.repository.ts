import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { computeInteriorBudgetLine } from '@domain/interior-budget/interior-budget-calculations';
import { PrismaService } from '../prisma.service';
import type {
  CreateInteriorBudgetPayload,
  InteriorBudgetAttachmentDto,
  InteriorBudgetCommentDto,
  InteriorBudgetDetail,
  InteriorBudgetHistoryDto,
  InteriorBudgetLevelInput,
  InteriorBudgetRepository,
  ListInteriorBudgetsFilters,
  ListInteriorBudgetsResult,
  UpdateInteriorBudgetPayload,
} from '@domain/repositories/interior-budget.repository';

const DEFAULT_LEVELS: InteriorBudgetLevelInput[] = [
  {
    sortOrder: 0,
    name: 'Primer nivel',
    environments: [
      {
        sortOrder: 0,
        name: 'Ambiente general',
        categories: [
          {
            sortOrder: 0,
            name: 'Partidas',
            items: [],
          },
        ],
      },
    ],
  },
];

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(it: any) {
  return {
    id: it.id,
    sortOrder: it.sortOrder,
    description: it.description,
    unit: it.unit,
    quantity: num(it.quantity) ?? 0,
    unitPrice: num(it.unitPrice) ?? 0,
    utilityPct: num(it.utilityPct) ?? 0,
    igvPct: num(it.igvPct) ?? 0,
    baseAmount: num(it.baseAmount) ?? 0,
    utilityAmount: num(it.utilityAmount) ?? 0,
    amountBeforeIgv: num(it.amountBeforeIgv) ?? 0,
    igvAmount: num(it.igvAmount) ?? 0,
    lineTotal: num(it.lineTotal) ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(c: any) {
  return {
    id: c.id,
    sortOrder: c.sortOrder,
    name: c.name,
    items: (c.items ?? []).map(mapItem),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEnvironment(e: any) {
  return {
    id: e.id,
    sortOrder: e.sortOrder,
    name: e.name,
    categories: (e.categories ?? []).map(mapCategory),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLevel(l: any) {
  return {
    id: l.id,
    sortOrder: l.sortOrder,
    name: l.name,
    environments: (l.environments ?? []).map(mapEnvironment),
  };
}

@Injectable()
export class InteriorBudgetPrismaRepository implements InteriorBudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  private treeInclude(): Prisma.InteriorBudgetInclude {
    return {
      project: {
        include: {
          client: { select: { id: true, fullName: true, documentNumber: true } },
          application: { select: { slug: true } },
        },
      },
      levels: {
        orderBy: { sortOrder: 'asc' },
        include: {
          environments: {
            orderBy: { sortOrder: 'asc' },
            include: {
              categories: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  items: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      },
      attachments: { orderBy: { createdAt: 'desc' } },
      comments: { orderBy: { createdAt: 'desc' } },
      history: { orderBy: { createdAt: 'desc' } },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapDetail(row: any): InteriorBudgetDetail {
    const p = row.project;
    return {
      id: row.id,
      projectId: row.projectId,
      code: row.code,
      version: row.version,
      status: row.status,
      title: row.title,
      defaultIgvPct: num(row.defaultIgvPct) ?? 18,
      taxableTotal: num(row.taxableTotal) ?? 0,
      igvTotal: num(row.igvTotal) ?? 0,
      grandTotal: num(row.grandTotal) ?? 0,
      duplicatedFromId: row.duplicatedFromId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      project: {
        id: p.id,
        code: p.code,
        name: p.name,
        client: {
          id: p.client.id,
          fullName: p.client.fullName,
          documentNumber: p.client.documentNumber,
        },
      },
      levels: row.levels.map(mapLevel),
      attachments: row.attachments.map((a) => ({
        id: a.id,
        title: a.title,
        fileUrl: a.fileUrl,
        createdAt: a.createdAt.toISOString(),
      })),
      comments: row.comments.map((c) => ({
        id: c.id,
        authorUserId: c.authorUserId,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
      })),
      history: row.history.map(
        (h): InteriorBudgetHistoryDto => ({
          id: h.id,
          eventType: h.eventType,
          summary: h.summary,
          metadata:
            h.metadataJson === null || h.metadataJson === undefined
              ? null
              : (h.metadataJson as Record<string, unknown>),
          actorUserId: h.actorUserId,
          createdAt: h.createdAt.toISOString(),
        }),
      ),
    };
  }

  private levelsToNestedCreate(
    levels: InteriorBudgetLevelInput[],
    defaultIgvPct: number,
  ): {
    create: Prisma.InteriorBudgetLevelCreateWithoutBudgetInput[];
    taxableTotal: Prisma.Decimal;
    igvTotal: Prisma.Decimal;
    grandTotal: Prisma.Decimal;
  } {
    let taxableTotal = new Prisma.Decimal(0);
    let igvTotal = new Prisma.Decimal(0);
    let grandTotal = new Prisma.Decimal(0);

    const create = levels.map((lvl) => ({
      sortOrder: lvl.sortOrder,
      name: lvl.name.trim(),
      environments: {
        create: lvl.environments.map((env) => ({
          sortOrder: env.sortOrder,
          name: env.name.trim(),
          categories: {
            create: env.categories.map((cat) => ({
              sortOrder: cat.sortOrder,
              name: cat.name.trim(),
              items: {
                create: cat.items.map((it) => {
                  const igvPct = it.igvPct ?? defaultIgvPct;
                  const z = computeInteriorBudgetLine(
                    it.quantity,
                    it.unitPrice,
                    it.utilityPct,
                    igvPct,
                  );
                  taxableTotal = taxableTotal.add(z.amountBeforeIgv);
                  igvTotal = igvTotal.add(z.igvAmount);
                  grandTotal = grandTotal.add(z.lineTotal);
                  return {
                    sortOrder: it.sortOrder,
                    description: it.description.trim(),
                    unit: it.unit.trim(),
                    quantity: z.quantity,
                    unitPrice: z.unitPrice,
                    utilityPct: new Prisma.Decimal(it.utilityPct),
                    igvPct: new Prisma.Decimal(igvPct),
                    baseAmount: z.baseAmount,
                    utilityAmount: z.utilityAmount,
                    amountBeforeIgv: z.amountBeforeIgv,
                    igvAmount: z.igvAmount,
                    lineTotal: z.lineTotal,
                  };
                }),
              },
            })),
          },
        })),
      },
    }));

    return { create, taxableTotal, igvTotal, grandTotal };
  }

  private resolveLevels(levels?: InteriorBudgetLevelInput[]): InteriorBudgetLevelInput[] {
    if (levels && levels.length > 0) return levels;
    return DEFAULT_LEVELS;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractLevelsFromDbTree(row: any): InteriorBudgetLevelInput[] {
    return (row.levels ?? []).map((lvl: any) => ({
      sortOrder: lvl.sortOrder,
      name: lvl.name,
      environments: (lvl.environments ?? []).map((env: any) => ({
        sortOrder: env.sortOrder,
        name: env.name,
        categories: (env.categories ?? []).map((cat: any) => ({
          sortOrder: cat.sortOrder,
          name: cat.name,
          items: (cat.items ?? []).map((it: any) => ({
            sortOrder: it.sortOrder,
            description: it.description,
            unit: it.unit,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            utilityPct: Number(it.utilityPct),
            igvPct: Number(it.igvPct),
          })),
        })),
      })),
    }));
  }

  async list(filters: ListInteriorBudgetsFilters): Promise<ListInteriorBudgetsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug.trim() },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const projectWhere: Prisma.InteriorProjectWhereInput = {
      applicationId: app.id,
      deletedAt: null,
    };
    if (filters.projectId?.trim()) {
      projectWhere.id = filters.projectId.trim();
    }
    if (filters.clientId?.trim()) {
      projectWhere.clientId = filters.clientId.trim();
    }

    const andParts: Prisma.InteriorBudgetWhereInput[] = [{ project: projectWhere }];
    if (filters.status?.trim()) {
      andParts.push({ status: filters.status.trim() });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { project: { code: { contains: q, mode: 'insensitive' } } },
          { project: { name: { contains: q, mode: 'insensitive' } } },
          { project: { client: { fullName: { contains: q, mode: 'insensitive' } } } },
          { project: { client: { documentNumber: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    const where: Prisma.InteriorBudgetWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.interiorBudget.findMany({
        where,
        include: {
          project: {
            select: {
              code: true,
              name: true,
              client: { select: { fullName: true, documentNumber: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.interiorBudget.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        code: r.code,
        version: r.version,
        title: r.title,
        status: r.status,
        taxableTotal: num(r.taxableTotal) ?? 0,
        igvTotal: num(r.igvTotal) ?? 0,
        grandTotal: num(r.grandTotal) ?? 0,
        projectCode: r.project.code,
        projectName: r.project.name,
        clientFullName: r.project.client.fullName,
        clientDocumentNumber: r.project.client.documentNumber,
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string, applicationSlug?: string): Promise<InteriorBudgetDetail | null> {
    const row = await this.prisma.interiorBudget.findUnique({
      where: { id },
      include: this.treeInclude(),
    });
    if (!row) return null;
    if (applicationSlug?.trim()) {
      const slug = applicationSlug.trim();
      const ps = (row.project as { application?: { slug: string } }).application?.slug;
      if (!ps || ps !== slug) return null;
    }
    return this.mapDetail(row);
  }

  async create(
    payload: CreateInteriorBudgetPayload,
    actorUserId?: string | null,
  ): Promise<InteriorBudgetDetail> {
    const levels = this.resolveLevels(payload.levels);
    const defaultIgv = payload.defaultIgvPct ?? 18;
    const { create: levelsCreate, taxableTotal, igvTotal, grandTotal } =
      this.levelsToNestedCreate(levels, defaultIgv);

    const row = await this.prisma.interiorBudget.create({
      data: {
        projectId: payload.projectId,
        code: payload.code.trim(),
        version: payload.version ?? 1,
        status: payload.status.trim(),
        title: payload.title?.trim() || null,
        defaultIgvPct: new Prisma.Decimal(defaultIgv),
        taxableTotal,
        igvTotal,
        grandTotal,
        history: {
          create: {
            eventType: 'CREATED',
            summary: `Presupuesto ${payload.code.trim()} v${payload.version ?? 1} creado`,
            actorUserId: actorUserId ?? null,
          },
        },
        levels: { create: levelsCreate },
      },
      include: this.treeInclude(),
    });

    return this.mapDetail(row);
  }

  async update(
    id: string,
    payload: UpdateInteriorBudgetPayload,
    actorUserId?: string | null,
  ): Promise<InteriorBudgetDetail> {
    const existing = await this.prisma.interiorBudget.findUnique({ where: { id } });
    if (!existing) throw new Error('InteriorBudget not found');

    const patch: Prisma.InteriorBudgetUncheckedUpdateInput = {};
    if (payload.title !== undefined) patch.title = payload.title?.trim() || null;
    if (payload.status !== undefined) patch.status = payload.status.trim();
    if (payload.defaultIgvPct !== undefined) {
      patch.defaultIgvPct = new Prisma.Decimal(payload.defaultIgvPct);
    }

    if (payload.levels !== undefined) {
      await this.prisma.$transaction(async (tx) => {
        await tx.interiorBudgetLevel.deleteMany({ where: { budgetId: id } });
        const lv = this.resolveLevels(payload.levels);
        const defaultIgv = payload.defaultIgvPct ?? Number(existing.defaultIgvPct);
        const built = this.levelsToNestedCreate(lv, defaultIgv);
        await tx.interiorBudget.update({
          where: { id },
          data: {
            ...patch,
            taxableTotal: built.taxableTotal,
            igvTotal: built.igvTotal,
            grandTotal: built.grandTotal,
            levels: { create: built.create },
            history: {
              create: {
                eventType: 'UPDATED',
                summary: 'Presupuesto actualizado (estructura y/o cabecera)',
                actorUserId: actorUserId ?? null,
              },
            },
          },
        });
      });
    } else if (Object.keys(patch).length > 0) {
      await this.prisma.interiorBudget.update({
        where: { id },
        data: {
          ...patch,
          history: {
            create: {
              eventType: 'UPDATED',
              summary: 'Cabecera del presupuesto actualizada',
              actorUserId: actorUserId ?? null,
            },
          },
        },
      });
    }

    const detail = await this.findById(id);
    if (!detail) throw new Error('InteriorBudget update: detail not found');
    return detail;
  }

  async duplicateFrom(id: string, actorUserId?: string | null): Promise<InteriorBudgetDetail> {
    const src = await this.prisma.interiorBudget.findUnique({
      where: { id },
      include: this.treeInclude(),
    });
    if (!src) throw new Error('InteriorBudget source not found');

    const agg = await this.prisma.interiorBudget.aggregate({
      where: { projectId: src.projectId, code: src.code },
      _max: { version: true },
    });
    const nextVersion = (agg._max.version ?? 0) + 1;

    const levelsInput = this.extractLevelsFromDbTree(src);
    const defaultIgv = Number(src.defaultIgvPct);
    const { create: levelsCreate, taxableTotal, igvTotal, grandTotal } =
      this.levelsToNestedCreate(levelsInput, defaultIgv);

    const row = await this.prisma.interiorBudget.create({
      data: {
        projectId: src.projectId,
        code: src.code,
        version: nextVersion,
        status: 'DRAFT',
        title: src.title,
        defaultIgvPct: src.defaultIgvPct,
        taxableTotal,
        igvTotal,
        grandTotal,
        duplicatedFromId: src.id,
        history: {
          create: {
            eventType: 'DUPLICATED',
            summary: `Nueva versión ${nextVersion} desde v${src.version}`,
            metadataJson: { sourceBudgetId: src.id, sourceVersion: src.version },
            actorUserId: actorUserId ?? null,
          },
        },
        levels: { create: levelsCreate },
      },
      include: this.treeInclude(),
    });

    await this.prisma.interiorBudgetHistoryEntry.create({
      data: {
        budgetId: src.id,
        eventType: 'VERSIONED',
        summary: `Duplicado como versión ${nextVersion}`,
        metadataJson: { newBudgetId: row.id },
        actorUserId: actorUserId ?? null,
      },
    });

    return this.mapDetail(row);
  }

  async addComment(
    budgetId: string,
    body: string,
    authorUserId?: string | null,
  ): Promise<InteriorBudgetCommentDto> {
    const c = await this.prisma.interiorBudgetComment.create({
      data: {
        budgetId,
        authorUserId: authorUserId ?? null,
        body: body.trim(),
      },
    });

    await this.prisma.interiorBudgetHistoryEntry.create({
      data: {
        budgetId,
        eventType: 'COMMENT_ADDED',
        summary: 'Comentario agregado',
        actorUserId: authorUserId ?? null,
      },
    });

    return {
      id: c.id,
      authorUserId: c.authorUserId,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async addAttachment(
    budgetId: string,
    title: string,
    fileUrl: string,
    actorUserId?: string | null,
  ): Promise<InteriorBudgetAttachmentDto> {
    const a = await this.prisma.interiorBudgetAttachment.create({
      data: {
        budgetId,
        title: title.trim(),
        fileUrl: fileUrl.trim(),
      },
    });

    await this.prisma.interiorBudgetHistoryEntry.create({
      data: {
        budgetId,
        eventType: 'ATTACHMENT_ADDED',
        summary: `Adjunto: ${title.trim()}`,
        actorUserId: actorUserId ?? null,
      },
    });

    return {
      id: a.id,
      title: a.title,
      fileUrl: a.fileUrl,
      createdAt: a.createdAt.toISOString(),
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.interiorBudget.delete({ where: { id } });
  }
}
