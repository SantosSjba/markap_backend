import type { ContabilidadAccountFlatDto } from '@domain/repositories/contabilidad-account.repository';

export const ContabilidadAccountPrismaMapper = {
  toFlat(row: {
    id: string;
    parentId: string | null;
    code: string;
    name: string;
    level: number;
    accountType: string;
    isMovement: boolean;
    isActive: boolean;
    isSystem: boolean;
    sortOrder: number;
    hasMovements: boolean;
  }): ContabilidadAccountFlatDto {
    return {
      id: row.id,
      parentId: row.parentId,
      code: row.code,
      name: row.name,
      level: row.level,
      accountType: row.accountType,
      isMovement: row.isMovement,
      isActive: row.isActive,
      isSystem: row.isSystem,
      sortOrder: row.sortOrder,
      hasMovements: row.hasMovements,
    };
  },
};
