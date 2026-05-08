import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InteriorismoConfigPrismaMapper } from '../mappers/interiorismo-config-prisma.mapper';
import {
  INTERIOR_PROJECT_SERIES_KEY,
  type InteriorismoConfigRepository,
  type InteriorismoProjectStageInput,
} from '@domain/repositories/interiorismo-config.repository';
import type { InteriorismoNumberingSeries, InteriorismoProjectStage } from '@domain/entities/interiorismo-config.entity';

const DEFAULT_STAGES: InteriorismoProjectStageInput[] = [
  { code: 'PROSPECT', label: 'Prospecto', sortOrder: 0, isActive: true },
  { code: 'DESIGN', label: 'Diseño', sortOrder: 1, isActive: true },
  { code: 'QUOTE', label: 'Cotización', sortOrder: 2, isActive: true },
  { code: 'APPROVED', label: 'Aprobado', sortOrder: 3, isActive: true },
  { code: 'IN_PROGRESS', label: 'En ejecución', sortOrder: 4, isActive: true },
  { code: 'FINISHED', label: 'Finalizado', sortOrder: 5, isActive: true },
  { code: 'CANCELLED', label: 'Cancelado', sortOrder: 6, isActive: true },
];

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

  async ensureDefaults(applicationId: string): Promise<void> {
    const nStages = await this.prisma.interiorismoProjectStageConfig.count({
      where: { applicationId },
    });
    if (nStages === 0) {
      await this.prisma.interiorismoProjectStageConfig.createMany({
        data: DEFAULT_STAGES.map((s) => ({
          applicationId,
          code: s.code,
          label: s.label,
          sortOrder: s.sortOrder,
          isActive: s.isActive,
        })),
      });
    }

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
