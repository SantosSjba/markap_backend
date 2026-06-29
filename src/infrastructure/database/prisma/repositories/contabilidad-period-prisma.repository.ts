import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CONTABILIDAD_DEFAULT_COST_CENTERS,
  CONTABILIDAD_PERIOD_STATUS,
} from '@domain/constants/contabilidad-period.defaults';
import type {
  ContabilidadPeriodDto,
  ContabilidadCostCenterDto,
  ContabilidadPeriodRepository,
  CreateContabilidadCostCenterInput,
  UpdateContabilidadCostCenterInput,
} from '@domain/repositories/contabilidad-period.repository';
import { ContabilidadPeriodPrismaMapper } from '../mappers/contabilidad-period-prisma.mapper';

@Injectable()
export class ContabilidadPeriodPrismaRepository implements ContabilidadPeriodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureYearPeriods(
    applicationId: string,
    legalEntityId: string,
    year: number,
  ): Promise<ContabilidadPeriodDto[]> {
    for (let month = 1; month <= 12; month++) {
      await this.prisma.contabilidadPeriod.upsert({
        where: { legalEntityId_year_month: { legalEntityId, year, month } },
        create: { applicationId, legalEntityId, year, month, status: CONTABILIDAD_PERIOD_STATUS.OPEN },
        update: {},
      });
    }
    return this.listPeriods(applicationId, legalEntityId, year);
  }

  async listPeriods(applicationId: string, legalEntityId: string, year: number): Promise<ContabilidadPeriodDto[]> {
    const rows = await this.prisma.contabilidadPeriod.findMany({
      where: { applicationId, legalEntityId, year },
      orderBy: { month: 'asc' },
    });
    return rows.map((r) => ContabilidadPeriodPrismaMapper.toPeriod(r));
  }

  async findPeriodById(applicationId: string, id: string): Promise<ContabilidadPeriodDto | null> {
    const row = await this.prisma.contabilidadPeriod.findFirst({ where: { applicationId, id } });
    return row ? ContabilidadPeriodPrismaMapper.toPeriod(row) : null;
  }

  async setPeriodStatus(applicationId: string, id: string, status: string): Promise<ContabilidadPeriodDto> {
    const row = await this.prisma.contabilidadPeriod.update({
      where: { id },
      data: { status },
    });
    if (row.applicationId !== applicationId) throw new Error('Period not found');
    return ContabilidadPeriodPrismaMapper.toPeriod(row);
  }

  async ensureDefaultCostCenters(applicationId: string): Promise<void> {
    const count = await this.prisma.contabilidadCostCenter.count({ where: { applicationId } });
    if (count > 0) return;
    await this.prisma.contabilidadCostCenter.createMany({
      data: CONTABILIDAD_DEFAULT_COST_CENTERS.map((c) => ({
        applicationId,
        code: c.code,
        name: c.name,
        isActive: true,
      })),
    });
  }

  async listCostCenters(applicationId: string, search?: string): Promise<ContabilidadCostCenterDto[]> {
    const q = search?.trim();
    const where: Prisma.ContabilidadCostCenterWhereInput = { applicationId };
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.contabilidadCostCenter.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });
    return rows.map((r) => ContabilidadPeriodPrismaMapper.toCostCenter(r));
  }

  async findCostCenterById(applicationId: string, id: string): Promise<ContabilidadCostCenterDto | null> {
    const row = await this.prisma.contabilidadCostCenter.findFirst({ where: { applicationId, id } });
    return row ? ContabilidadPeriodPrismaMapper.toCostCenter(row) : null;
  }

  async findCostCenterByCode(applicationId: string, code: string): Promise<ContabilidadCostCenterDto | null> {
    const row = await this.prisma.contabilidadCostCenter.findUnique({
      where: { applicationId_code: { applicationId, code } },
    });
    return row ? ContabilidadPeriodPrismaMapper.toCostCenter(row) : null;
  }

  async createCostCenter(
    applicationId: string,
    input: CreateContabilidadCostCenterInput,
  ): Promise<ContabilidadCostCenterDto> {
    const row = await this.prisma.contabilidadCostCenter.create({
      data: {
        applicationId,
        code: input.code.trim(),
        name: input.name.trim(),
        parentId: input.parentId ?? null,
      },
    });
    return ContabilidadPeriodPrismaMapper.toCostCenter(row);
  }

  async updateCostCenter(
    applicationId: string,
    id: string,
    input: UpdateContabilidadCostCenterInput,
  ): Promise<ContabilidadCostCenterDto> {
    const data: Prisma.ContabilidadCostCenterUpdateInput = {};
    if (input.code !== undefined) data.code = input.code.trim();
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.parentId !== undefined) data.parent = input.parentId ? { connect: { id: input.parentId } } : { disconnect: true };
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const row = await this.prisma.contabilidadCostCenter.update({ where: { id }, data });
    if (row.applicationId !== applicationId) throw new Error('Cost center not found');
    return ContabilidadPeriodPrismaMapper.toCostCenter(row);
  }

  async deactivateCostCenter(applicationId: string, id: string): Promise<ContabilidadCostCenterDto> {
    const row = await this.prisma.contabilidadCostCenter.update({
      where: { id },
      data: { isActive: false },
    });
    if (row.applicationId !== applicationId) throw new Error('Cost center not found');
    return ContabilidadPeriodPrismaMapper.toCostCenter(row);
  }

  async hasCostCenterChildren(applicationId: string, id: string): Promise<boolean> {
    const count = await this.prisma.contabilidadCostCenter.count({
      where: { applicationId, parentId: id },
    });
    return count > 0;
  }
}
