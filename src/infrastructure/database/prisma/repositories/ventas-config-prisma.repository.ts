import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  VentasConfigRepository,
  VentasPipelineStageDTO,
  VentasNumberingSeriesDTO,
} from '../../../../application/repositories/ventas-config.repository';

const DEFAULT_STAGES: Omit<VentasPipelineStageDTO, never>[] = [
  { code: 'PROSPECT', label: 'Prospecto', sortOrder: 0, isActive: true },
  { code: 'VISIT', label: 'Visita', sortOrder: 1, isActive: true },
  { code: 'NEGOTIATION', label: 'Negociación', sortOrder: 2, isActive: true },
  { code: 'SEPARATION', label: 'Separación', sortOrder: 3, isActive: true },
  { code: 'CLOSING', label: 'Cierre', sortOrder: 4, isActive: true },
];

@Injectable()
export class VentasConfigPrismaRepository implements VentasConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPipelineStages(applicationId: string): Promise<VentasPipelineStageDTO[]> {
    const rows = await this.prisma.ventasPipelineStageConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ({
      code: r.code,
      label: r.label,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    }));
  }

  async replacePipelineStages(
    applicationId: string,
    stages: VentasPipelineStageDTO[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.ventasPipelineStageConfig.deleteMany({ where: { applicationId } });
      await tx.ventasPipelineStageConfig.createMany({
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

  async getNumberingSeries(
    applicationId: string,
    seriesKey: string,
  ): Promise<VentasNumberingSeriesDTO | null> {
    const row = await this.prisma.ventasNumberingSeries.findUnique({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
    });
    if (!row) return null;
    return {
      seriesKey: row.seriesKey,
      prefix: row.prefix,
      lastNumber: row.lastNumber,
    };
  }

  async updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<VentasNumberingSeriesDTO> {
    const row = await this.prisma.ventasNumberingSeries.update({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
      data: {
        ...(data.prefix !== undefined && { prefix: data.prefix.trim() }),
        ...(data.lastNumber !== undefined && { lastNumber: data.lastNumber }),
      },
    });
    return {
      seriesKey: row.seriesKey,
      prefix: row.prefix,
      lastNumber: row.lastNumber,
    };
  }

  async listActivePropertyTypes(): Promise<{ id: string; name: string; code: string }[]> {
    const rows = await this.prisma.propertyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    return rows;
  }

  async ensureDefaults(applicationId: string): Promise<void> {
    const nPipeline = await this.prisma.ventasPipelineStageConfig.count({
      where: { applicationId },
    });
    if (nPipeline === 0) {
      await this.prisma.ventasPipelineStageConfig.createMany({
        data: DEFAULT_STAGES.map((s) => ({
          applicationId,
          code: s.code,
          label: s.label,
          sortOrder: s.sortOrder,
          isActive: s.isActive,
        })),
      });
    }

    const nSeries = await this.prisma.ventasNumberingSeries.count({
      where: { applicationId, seriesKey: 'SALE_PROCESS' },
    });
    if (nSeries === 0) {
      const processCount = await this.prisma.saleProcess.count({ where: { applicationId } });
      await this.prisma.ventasNumberingSeries.create({
        data: {
          applicationId,
          seriesKey: 'SALE_PROCESS',
          prefix: 'VNT-PRC',
          lastNumber: processCount,
        },
      });
    }
  }
}
