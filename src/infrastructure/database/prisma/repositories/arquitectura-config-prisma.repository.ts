import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ArquitecturaConfigPrismaMapper } from '../mappers/arquitectura-config-prisma.mapper';
import {
  ARQUITECTURA_PROJECT_SERIES_KEY,
  type ArquitecturaConfigRepository,
  type ArquitecturaProjectStageInput,
} from '@domain/repositories/arquitectura-config.repository';
import type { ArquitecturaNumberingSeries, ArquitecturaProjectStage } from '@domain/entities/arquitectura-config.entity';
import {
  ARQUITECTURA_PROJECT_LEGACY_STAGE_CODES,
  ARQUITECTURA_PROJECT_LIFECYCLE_CODE_SET,
  ARQUITECTURA_PROJECT_LIFECYCLE_STAGES,
} from '@domain/constants/arquitectura-project-stages.constants';

@Injectable()
export class ArquitecturaConfigPrismaRepository implements ArquitecturaConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectStages(applicationId: string): Promise<ArquitecturaProjectStage[]> {
    const rows = await this.prisma.arquitecturaProjectStageConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ArquitecturaConfigPrismaMapper.toProjectStage(r));
  }

  async replaceProjectStages(applicationId: string, stages: ArquitecturaProjectStageInput[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.arquitecturaProjectStageConfig.deleteMany({ where: { applicationId } });
      await tx.arquitecturaProjectStageConfig.createMany({
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

  async getNumberingSeries(applicationId: string, seriesKey: string): Promise<ArquitecturaNumberingSeries | null> {
    const row = await this.prisma.arquitecturaNumberingSeries.findUnique({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
    });
    if (!row) return null;
    return ArquitecturaConfigPrismaMapper.toNumberingSeries(row);
  }

  async updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<ArquitecturaNumberingSeries> {
    const row = await this.prisma.arquitecturaNumberingSeries.update({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
      data: {
        ...(data.prefix !== undefined && { prefix: data.prefix.trim() }),
        ...(data.lastNumber !== undefined && { lastNumber: data.lastNumber }),
      },
    });
    return ArquitecturaConfigPrismaMapper.toNumberingSeries(row);
  }

  /** Alinea etapas al ciclo de 5 estados y migra proyectos con estados obsoletos. */
  async syncProjectStages(applicationId: string): Promise<void> {
    const existing = await this.prisma.arquitecturaProjectStageConfig.findMany({
      where: { applicationId },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((r) => r.code));
    const hasLegacy = ARQUITECTURA_PROJECT_LEGACY_STAGE_CODES.some((c) => existingCodes.has(c));
    const hasExactLifecycle =
      existing.length === ARQUITECTURA_PROJECT_LIFECYCLE_STAGES.length &&
      [...ARQUITECTURA_PROJECT_LIFECYCLE_CODE_SET].every((c) => existingCodes.has(c));

    if (existing.length === 0 || hasLegacy || !hasExactLifecycle) {
      await this.replaceProjectStages(applicationId, ARQUITECTURA_PROJECT_LIFECYCLE_STAGES);
    } else {
      for (const stage of ARQUITECTURA_PROJECT_LIFECYCLE_STAGES) {
        await this.prisma.arquitecturaProjectStageConfig.updateMany({
          where: { applicationId, code: stage.code },
          data: {
            label: stage.label,
            sortOrder: stage.sortOrder,
            isActive: true,
          },
        });
      }
    }

    await this.prisma.arquitecturaProject.updateMany({
      where: { applicationId, status: 'PROSPECT', deletedAt: null },
      data: { status: 'DESIGN' },
    });
  }

  async ensureDefaults(applicationId: string): Promise<void> {
    await this.syncProjectStages(applicationId);

    const nSeries = await this.prisma.arquitecturaNumberingSeries.count({
      where: { applicationId, seriesKey: ARQUITECTURA_PROJECT_SERIES_KEY },
    });
    if (nSeries === 0) {
      const projectCount = await this.prisma.arquitecturaProject.count({ where: { applicationId } });
      await this.prisma.arquitecturaNumberingSeries.create({
        data: {
          applicationId,
          seriesKey: ARQUITECTURA_PROJECT_SERIES_KEY,
          prefix: 'ARQ-PRY',
          lastNumber: projectCount,
        },
      });
    }
  }

  private formatCode(row: { prefix: string; lastNumber: number }): string {
    return `${row.prefix}-${String(row.lastNumber).padStart(4, '0')}`;
  }

  async allocateNextCode(applicationId: string, seriesKey: string): Promise<string> {
    await this.ensureDefaults(applicationId);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.arquitecturaNumberingSeries.update({
        where: { applicationId_seriesKey: { applicationId, seriesKey } },
        data: { lastNumber: { increment: 1 } },
      });
      return updated;
    });
    return this.formatCode(row);
  }
}
