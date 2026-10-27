import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import type {
  VentasNumberingSeries,
  VentasPipelineStage,
} from '../../../domain/entities/ventas-config.entity';
import { VentasPropertyTypeCatalogItem } from '../../../domain/entities/ventas-config.entity';
import type {
  VentasConfigRepository,
  VentasPipelineStageInput,
} from '../../../domain/repositories/ventas-config.repository';
import { VentasConfigPrismaMapper } from '../mappers/ventas-config-prisma.mapper';

const DEFAULT_STAGES: VentasPipelineStageInput[] = [
  { code: 'SEPARATION', label: 'Separación', sortOrder: 0, isActive: true },
  { code: 'ARRAS', label: 'Contrato de arras', sortOrder: 1, isActive: true },
  { code: 'MINUTA', label: 'Minuta', sortOrder: 2, isActive: true },
  {
    code: 'PUBLIC_DEED',
    label: 'Escritura pública',
    sortOrder: 3,
    isActive: true,
  },
];

@Injectable()
export class VentasConfigPrismaRepository implements VentasConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPipelineStages(
    applicationId: string,
  ): Promise<VentasPipelineStage[]> {
    const rows = await this.prisma.ventasPipelineStageConfig.findMany({
      where: { applicationId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => VentasConfigPrismaMapper.toPipelineStage(r));
  }

  async replacePipelineStages(
    applicationId: string,
    stages: VentasPipelineStageInput[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.ventasPipelineStageConfig.deleteMany({
        where: { applicationId },
      });
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
  ): Promise<VentasNumberingSeries | null> {
    const row = await this.prisma.ventasNumberingSeries.findUnique({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
    });
    if (!row) return null;
    return VentasConfigPrismaMapper.toNumberingSeries(row);
  }

  async updateNumberingSeries(
    applicationId: string,
    seriesKey: string,
    data: { prefix?: string; lastNumber?: number },
  ): Promise<VentasNumberingSeries> {
    const row = await this.prisma.ventasNumberingSeries.update({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
      data: {
        ...(data.prefix !== undefined && { prefix: data.prefix.trim() }),
        ...(data.lastNumber !== undefined && { lastNumber: data.lastNumber }),
      },
    });
    return VentasConfigPrismaMapper.toNumberingSeries(row);
  }

  async listActivePropertyTypes(): Promise<VentasPropertyTypeCatalogItem[]> {
    const rows = await this.prisma.propertyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    return rows.map(
      (r) => new VentasPropertyTypeCatalogItem(r.id, r.name, r.code),
    );
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
      const processCount = await this.prisma.saleProcess.count({
        where: { applicationId },
      });
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

  async listFinancingChannels() {
    const rows = await this.prisma.saleFinancingChannel.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        category: true,
        code: true,
        name: true,
        sortOrder: true,
        isActive: true,
        _count: { select: { saleProcesses: true } },
      },
    });
    return rows.map(({ _count, ...r }) => ({
      ...r,
      usage: _count.saleProcesses,
    }));
  }

  async findFinancingChannelCodes(prefix: string) {
    const rows = await this.prisma.saleFinancingChannel.findMany({
      where: { code: { startsWith: prefix } },
      select: { code: true },
    });
    return rows.map((r) => r.code);
  }

  async createFinancingChannel(data: {
    category: string;
    code: string;
    name: string;
    sortOrder: number;
  }) {
    const row = await this.prisma.saleFinancingChannel.create({
      data: { ...data, isActive: true },
    });
    return { ...row, usage: 0 };
  }

  async updateFinancingChannel(
    id: string,
    data: {
      category?: string;
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const exists = await this.prisma.saleFinancingChannel.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return null;
    const row = await this.prisma.saleFinancingChannel.update({
      where: { id },
      data,
      include: { _count: { select: { saleProcesses: true } } },
    });
    const { _count, ...rest } = row;
    return { ...rest, usage: _count.saleProcesses };
  }
}
