import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CONTABILIDAD_DEFAULT_COMPANY,
  CONTABILIDAD_DEFAULT_DOCUMENT_SERIES,
} from '@domain/constants/contabilidad-config.defaults';
import type {
  ContabilidadCompanyProfileDto,
  ContabilidadConfigRepository,
} from '@domain/repositories/contabilidad-config.repository';
import { ContabilidadConfigPrismaMapper } from '../mappers/contabilidad-config-prisma.mapper';

@Injectable()
export class ContabilidadConfigPrismaRepository implements ContabilidadConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaults(applicationId: string): Promise<void> {
    const profileCount = await this.prisma.contabilidadCompanyProfile.count({ where: { applicationId } });
    if (profileCount === 0) {
      await this.prisma.contabilidadCompanyProfile.create({
        data: {
          applicationId,
          ...CONTABILIDAD_DEFAULT_COMPANY,
        },
      });
    }

    const settingsCount = await this.prisma.contabilidadAppSettings.count({ where: { applicationId } });
    if (settingsCount === 0) {
      await this.prisma.contabilidadAppSettings.create({
        data: { applicationId },
      });
    }

    for (const def of CONTABILIDAD_DEFAULT_DOCUMENT_SERIES) {
      const exists = await this.prisma.contabilidadDocumentSeries.count({
        where: { applicationId, seriesKey: def.seriesKey },
      });
      if (exists > 0) continue;
      await this.prisma.contabilidadDocumentSeries.create({
        data: {
          applicationId,
          seriesKey: def.seriesKey,
          sunatSeries: def.sunatSeries,
          lastNumber: 0,
          padLength: 8,
          isActive: true,
        },
      });
    }
  }

  async getCompanyProfile(applicationId: string) {
    const row = await this.prisma.contabilidadCompanyProfile.findUniqueOrThrow({
      where: { applicationId },
    });
    return ContabilidadConfigPrismaMapper.toCompanyProfile(row);
  }

  async updateCompanyProfile(applicationId: string, data: Partial<ContabilidadCompanyProfileDto>) {
    const update: Prisma.ContabilidadCompanyProfileUpdateInput = {};
    if (data.ruc !== undefined) update.ruc = data.ruc;
    if (data.legalName !== undefined) update.legalName = data.legalName;
    if (data.tradeName !== undefined) update.tradeName = data.tradeName;
    if (data.fiscalAddress !== undefined) update.fiscalAddress = data.fiscalAddress;
    if (data.district !== undefined) update.district = data.district;
    if (data.province !== undefined) update.province = data.province;
    if (data.department !== undefined) update.department = data.department;
    if (data.ubigeoCode !== undefined) update.ubigeoCode = data.ubigeoCode;

    const row = await this.prisma.contabilidadCompanyProfile.update({
      where: { applicationId },
      data: update,
    });
    return ContabilidadConfigPrismaMapper.toCompanyProfile(row);
  }

  async getSettings(applicationId: string) {
    const row = await this.prisma.contabilidadAppSettings.findUniqueOrThrow({
      where: { applicationId },
    });
    return ContabilidadConfigPrismaMapper.toSettings(row);
  }

  async updateSettings(applicationId: string, data: Partial<ReturnType<typeof ContabilidadConfigPrismaMapper.toSettings>>) {
    const update: Prisma.ContabilidadAppSettingsUpdateInput = {};
    if (data.taxRegime !== undefined) update.taxRegime = data.taxRegime;
    if (data.isDetractionAgent !== undefined) update.isDetractionAgent = data.isDetractionAgent;
    if (data.isRetentionAgent !== undefined) update.isRetentionAgent = data.isRetentionAgent;
    if (data.isPerceptionAgent !== undefined) update.isPerceptionAgent = data.isPerceptionAgent;
    if (data.igvPercent !== undefined) update.igvPercent = data.igvPercent;
    if (data.currencyCode !== undefined) update.currencyCode = data.currencyCode;
    if (data.fiscalYearStartMonth !== undefined) update.fiscalYearStartMonth = data.fiscalYearStartMonth;
    if (data.amountDecimals !== undefined) update.amountDecimals = data.amountDecimals;

    const row = await this.prisma.contabilidadAppSettings.update({
      where: { applicationId },
      data: update,
    });
    return ContabilidadConfigPrismaMapper.toSettings(row);
  }

  async listDocumentSeries(applicationId: string) {
    const rows = await this.prisma.contabilidadDocumentSeries.findMany({
      where: { applicationId },
      orderBy: { seriesKey: 'asc' },
    });
    return rows.map((r) => ContabilidadConfigPrismaMapper.toDocumentSeries(r));
  }

  async updateDocumentSeries(
    applicationId: string,
    seriesKey: string,
    data: { sunatSeries?: string; lastNumber?: number; padLength?: number; isActive?: boolean },
  ) {
    const row = await this.prisma.contabilidadDocumentSeries.update({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
      data: {
        sunatSeries: data.sunatSeries,
        lastNumber: data.lastNumber,
        padLength: data.padLength,
        isActive: data.isActive,
      },
    });
    return ContabilidadConfigPrismaMapper.toDocumentSeries(row);
  }

  async previewNextDocumentNumber(applicationId: string, seriesKey: string) {
    const row = await this.prisma.contabilidadDocumentSeries.findUniqueOrThrow({
      where: { applicationId_seriesKey: { applicationId, seriesKey } },
    });
    return ContabilidadConfigPrismaMapper.toDocumentSeries(row).nextPreview;
  }
}
