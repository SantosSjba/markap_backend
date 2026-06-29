import { Injectable } from '@nestjs/common';
import { CONTABILIDAD_DEMO_LEGAL_ENTITIES } from '@domain/constants/contabilidad-legal-entity.defaults';
import type {
  ContabilidadLegalEntityDto,
  ContabilidadLegalEntityRepository,
} from '@domain/repositories/contabilidad-legal-entity.repository';
import { PrismaService } from '../prisma.service';

function mapEntity(row: {
  id: string;
  code: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  fiscalAddress: string;
  district: string;
  province: string;
  department: string;
  ubigeoCode: string;
  isDefault: boolean;
  isActive: boolean;
}): ContabilidadLegalEntityDto {
  return {
    id: row.id,
    code: row.code,
    ruc: row.ruc,
    legalName: row.legalName,
    tradeName: row.tradeName,
    fiscalAddress: row.fiscalAddress,
    district: row.district,
    province: row.province,
    department: row.department,
    ubigeoCode: row.ubigeoCode,
    isDefault: row.isDefault,
    isActive: row.isActive,
  };
}

@Injectable()
export class ContabilidadLegalEntityPrismaRepository implements ContabilidadLegalEntityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaults(applicationId: string): Promise<void> {
    const count = await this.prisma.contabilidadLegalEntity.count({ where: { applicationId } });
    if (count > 0) return;

    for (const def of CONTABILIDAD_DEMO_LEGAL_ENTITIES) {
      await this.prisma.contabilidadLegalEntity.create({
        data: {
          applicationId,
          code: def.code,
          ruc: def.ruc,
          legalName: def.legalName,
          tradeName: def.tradeName ?? null,
          fiscalAddress: def.fiscalAddress,
          district: def.district,
          province: def.province,
          department: def.department,
          ubigeoCode: def.ubigeoCode,
          isDefault: def.isDefault,
          isActive: true,
        },
      });
    }
  }

  async list(applicationId: string): Promise<ContabilidadLegalEntityDto[]> {
    const rows = await this.prisma.contabilidadLegalEntity.findMany({
      where: { applicationId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
    return rows.map(mapEntity);
  }

  async getDefault(applicationId: string): Promise<ContabilidadLegalEntityDto | null> {
    const row = await this.prisma.contabilidadLegalEntity.findFirst({
      where: { applicationId, isActive: true, isDefault: true },
    });
    if (row) return mapEntity(row);
    const fallback = await this.prisma.contabilidadLegalEntity.findFirst({
      where: { applicationId, isActive: true },
      orderBy: { code: 'asc' },
    });
    return fallback ? mapEntity(fallback) : null;
  }

  async findById(applicationId: string, id: string): Promise<ContabilidadLegalEntityDto | null> {
    const row = await this.prisma.contabilidadLegalEntity.findFirst({
      where: { applicationId, id, isActive: true },
    });
    return row ? mapEntity(row) : null;
  }
}
