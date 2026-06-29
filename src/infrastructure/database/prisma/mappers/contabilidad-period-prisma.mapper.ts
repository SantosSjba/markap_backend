import { CONTABILIDAD_MONTH_LABELS } from '@domain/constants/contabilidad-period.defaults';
import type { ContabilidadCostCenterDto, ContabilidadPeriodDto } from '@domain/repositories/contabilidad-period.repository';

export const ContabilidadPeriodPrismaMapper = {
  toPeriod(row: { id: string; legalEntityId: string; year: number; month: number; status: string }): ContabilidadPeriodDto {
    const monthLabel = CONTABILIDAD_MONTH_LABELS[row.month] ?? String(row.month);
    return {
      id: row.id,
      legalEntityId: row.legalEntityId,
      year: row.year,
      month: row.month,
      status: row.status,
      label: `${monthLabel} ${row.year}`,
    };
  },

  toCostCenter(row: {
    id: string;
    parentId: string | null;
    code: string;
    name: string;
    isActive: boolean;
  }): ContabilidadCostCenterDto {
    return {
      id: row.id,
      parentId: row.parentId,
      code: row.code,
      name: row.name,
      isActive: row.isActive,
    };
  },
};
