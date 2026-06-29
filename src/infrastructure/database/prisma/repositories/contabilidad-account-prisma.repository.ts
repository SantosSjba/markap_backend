import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CONTABILIDAD_PCGE_SEED } from '@domain/constants/contabilidad-pcge.defaults';
import type {
  ContabilidadAccountFlatDto,
  ContabilidadAccountRepository,
  CreateContabilidadAccountInput,
  UpdateContabilidadAccountInput,
} from '@domain/repositories/contabilidad-account.repository';
import { ContabilidadAccountPrismaMapper } from '../mappers/contabilidad-account-prisma.mapper';

@Injectable()
export class ContabilidadAccountPrismaRepository implements ContabilidadAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePcgeSeed(applicationId: string): Promise<void> {
    const count = await this.prisma.contabilidadAccount.count({ where: { applicationId } });
    if (count > 0) return;

    const idByCode = new Map<string, string>();

    for (const row of CONTABILIDAD_PCGE_SEED) {
      const parentId = row.parentCode ? idByCode.get(row.parentCode) ?? null : null;
      const created = await this.prisma.contabilidadAccount.create({
        data: {
          applicationId,
          parentId,
          code: row.code,
          name: row.name,
          level: row.level,
          accountType: row.accountType,
          isMovement: row.isMovement,
          isSystem: true,
          sortOrder: row.sortOrder,
        },
      });
      idByCode.set(row.code, created.id);
    }
  }

  async listFlat(applicationId: string, search?: string): Promise<ContabilidadAccountFlatDto[]> {
    const q = search?.trim();
    const where: Prisma.ContabilidadAccountWhereInput = { applicationId };
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.contabilidadAccount.findMany({
      where,
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
    });
    return rows.map((r) => ContabilidadAccountPrismaMapper.toFlat(r));
  }

  async findById(applicationId: string, id: string): Promise<ContabilidadAccountFlatDto | null> {
    const row = await this.prisma.contabilidadAccount.findFirst({ where: { applicationId, id } });
    return row ? ContabilidadAccountPrismaMapper.toFlat(row) : null;
  }

  async findByCode(applicationId: string, code: string): Promise<ContabilidadAccountFlatDto | null> {
    const row = await this.prisma.contabilidadAccount.findUnique({
      where: { applicationId_code: { applicationId, code } },
    });
    return row ? ContabilidadAccountPrismaMapper.toFlat(row) : null;
  }

  async hasChildren(applicationId: string, id: string): Promise<boolean> {
    const count = await this.prisma.contabilidadAccount.count({
      where: { applicationId, parentId: id },
    });
    return count > 0;
  }

  async create(applicationId: string, input: CreateContabilidadAccountInput): Promise<ContabilidadAccountFlatDto> {
    const parent = await this.prisma.contabilidadAccount.findFirst({
      where: { applicationId, id: input.parentId },
    });
    if (!parent) throw new Error('Parent not found');
    if (parent.isMovement) throw new Error('Parent is movement account');

    const row = await this.prisma.contabilidadAccount.create({
      data: {
        applicationId,
        parentId: input.parentId,
        code: input.code.trim(),
        name: input.name.trim(),
        level: parent.level + 1,
        accountType: input.accountType,
        isMovement: input.isMovement,
        isSystem: false,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return ContabilidadAccountPrismaMapper.toFlat(row);
  }

  async update(
    applicationId: string,
    id: string,
    input: UpdateContabilidadAccountInput,
  ): Promise<ContabilidadAccountFlatDto> {
    const existing = await this.prisma.contabilidadAccount.findFirst({ where: { applicationId, id } });
    if (!existing) throw new Error('Account not found');

    const data: Prisma.ContabilidadAccountUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.accountType !== undefined) data.accountType = input.accountType;
    if (input.isMovement !== undefined) data.isMovement = input.isMovement;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.code !== undefined) data.code = input.code.trim();

    const row = await this.prisma.contabilidadAccount.update({ where: { id }, data });
    return ContabilidadAccountPrismaMapper.toFlat(row);
  }

  async deactivate(applicationId: string, id: string): Promise<ContabilidadAccountFlatDto> {
    const row = await this.prisma.contabilidadAccount.update({
      where: { id },
      data: { isActive: false },
    });
    if (row.applicationId !== applicationId) throw new Error('Account not found');
    return ContabilidadAccountPrismaMapper.toFlat(row);
  }

  async markHasMovements(applicationId: string, accountIds: string[]): Promise<void> {
    const unique = [...new Set(accountIds.filter(Boolean))];
    if (!unique.length) return;
    await this.prisma.contabilidadAccount.updateMany({
      where: { applicationId, id: { in: unique } },
      data: { hasMovements: true },
    });
  }
}
