import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InteriorismoConfigPrismaMapper } from '../mappers/interiorismo-config-prisma.mapper';
import {
  INTERIOR_PROJECT_SERIES_KEY,
  type InteriorismoConfigRepository,
  type InteriorismoProjectStageInput,
} from '@domain/repositories/interiorismo-config.repository';
import type { InteriorismoNumberingSeries, InteriorismoProjectStage } from '@domain/entities/interiorismo-config.entity';
import {
  INTERIOR_PROJECT_LEGACY_STAGE_CODES,
  INTERIOR_PROJECT_LIFECYCLE_CODE_SET,
  INTERIOR_PROJECT_LIFECYCLE_STAGES,
} from '@domain/constants/interior-project-stages.constants';

@Injectable()
export class InteriorismoConfigPrismaRepository implements InteriorismoConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectStages(applicationId: string): Promise<InteriorismoProjectStage[]> {
    const rows = await this.prisma.interiorismoProjectStageConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => InteriorismoConfigPrismaMapper.toProjectStage(r));
  }

  async replaceProjectStages(applicationId: string, stages: InteriorismoProjectStageInput[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.interiorismoProjectStageConfig.deleteMany({ where: { applicationId } });
      await tx.interiorismoProjectStageConfig.createMany({
        data: stages.map((s) => ({
          applicationId,
          code: s.code,
          label: s.label.trim(),
          sortOrder: s.sortOrder,
          isActive: s.isActive,
        })),
      });
    });
  }

  async getNumberingSeries(applicationId: string, seriesKey: string): Promise<InteriorismoNumberingSeries | null> {
    const row = await this.prisma.interiorismoNumberingSeries.findUnique({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
    });
    if (!row) return null;
    return InteriorismoConfigPrismaMapper.toNumberingSeries(row);
  }

  async updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<InteriorismoNumberingSeries> {
    const row = await this.prisma.interiorismoNumberingSeries.update({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
      data: {
        ...(data.prefix !== undefined && { prefix: data.prefix.trim() }),
        ...(data.lastNumber !== undefined && { lastNumber: data.lastNumber }),
      },
    });
    return InteriorismoConfigPrismaMapper.toNumberingSeries(row);
  }

  /** Alinea etapas al ciclo de 5 estados y migra proyectos con estados obsoletos. */
  async syncProjectStages(applicationId: string): Promise<void> {
    const existing = await this.prisma.interiorismoProjectStageConfig.findMany({
      where: { applicationId },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((r) => r.code));
    const hasLegacy = INTERIOR_PROJECT_LEGACY_STAGE_CODES.some((c) => existingCodes.has(c));
    const hasExactLifecycle =
      existing.length === INTERIOR_PROJECT_LIFECYCLE_STAGES.length &&
      [...INTERIOR_PROJECT_LIFECYCLE_CODE_SET].every((c) => existingCodes.has(c));

    if (existing.length === 0 || hasLegacy || !hasExactLifecycle) {
      await this.replaceProjectStages(applicationId, INTERIOR_PROJECT_LIFECYCLE_STAGES);
    } else {
      for (const stage of INTERIOR_PROJECT_LIFECYCLE_STAGES) {
        await this.prisma.interiorismoProjectStageConfig.updateMany({
          where: { applicationId, code: stage.code },
          data: {
            label: stage.label,
            sortOrder: stage.sortOrder,
            isActive: true,
          },
        });
      }
    }

    await this.prisma.interiorProject.updateMany({
      where: { applicationId, status: 'PROSPECT', deletedAt: null },
      data: { status: 'DESIGN' },
    });
  }

  async ensureDefaults(applicationId: string): Promise<void> {
    await this.syncProjectStages(applicationId);

    const nSeries = await this.prisma.interiorismoNumberingSeries.count({
      where: { applicationId, seriesKey: INTERIOR_PROJECT_SERIES_KEY },
    });
    if (nSeries === 0) {
      const projectCount = await this.prisma.interiorProject.count({ where: { applicationId } });
      await this.prisma.interiorismoNumberingSeries.create({
        data: {
          applicationId,
          seriesKey: INTERIOR_PROJECT_SERIES_KEY,
          prefix: 'INT-PRY',
          lastNumber: projectCount,
        },
      });
    }
  }
}
