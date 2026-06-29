import { Injectable } from '@nestjs/common';
import type {
  ContabilidadSolCredentialsDto,
  ContabilidadSolRepository,
  ContabilidadSunatDeclarationLogDto,
  ListSunatDeclarationsFilters,
  UpsertSolCredentialsInput,
} from '@domain/repositories/contabilidad-sol.repository';
import { PrismaService } from '../prisma.service';

function maskPassword(value: string): string {
  const t = value.trim();
  if (t.length <= 2) return '****';
  return `****${t.slice(-2)}`;
}

function encodePassword(value: string): string {
  return Buffer.from(value.trim(), 'utf8').toString('base64');
}

function mapCredentials(row: {
  id: string;
  legalEntityId: string;
  solUser: string;
  solPasswordHint: string | null;
  solPasswordEnc: string | null;
  useSandbox: boolean;
  isActive: boolean;
  updatedAt: Date;
  legalEntity: { code: string; ruc: string };
}): ContabilidadSolCredentialsDto {
  return {
    id: row.id,
    legalEntityId: row.legalEntityId,
    legalEntityCode: row.legalEntity.code,
    legalEntityRuc: row.legalEntity.ruc,
    solUser: row.solUser,
    solPasswordHint: row.solPasswordHint,
    hasSolPassword: Boolean(row.solPasswordEnc),
    useSandbox: row.useSandbox,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapLog(row: {
  id: string;
  legalEntityId: string;
  periodId: string;
  declarationType: string;
  status: string;
  sunatResponseCode: string | null;
  sunatResponseMessage: string | null;
  packageHash: string | null;
  submittedAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  legalEntity: { code: string; ruc: string };
  period: { year: number; month: number };
}): ContabilidadSunatDeclarationLogDto {
  return {
    id: row.id,
    legalEntityId: row.legalEntityId,
    legalEntityCode: row.legalEntity.code,
    legalEntityRuc: row.legalEntity.ruc,
    periodId: row.periodId,
    periodYear: row.period.year,
    periodMonth: row.period.month,
    declarationType: row.declarationType,
    status: row.status,
    sunatResponseCode: row.sunatResponseCode,
    sunatResponseMessage: row.sunatResponseMessage,
    packageHash: row.packageHash,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const logInclude = {
  legalEntity: { select: { code: true, ruc: true } },
  period: { select: { year: true, month: true } },
} as const;

@Injectable()
export class ContabilidadSolPrismaRepository implements ContabilidadSolRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCredentials(
    applicationId: string,
    legalEntityId: string,
  ): Promise<ContabilidadSolCredentialsDto | null> {
    const row = await this.prisma.contabilidadSolCredentials.findFirst({
      where: { applicationId, legalEntityId },
      include: { legalEntity: { select: { code: true, ruc: true } } },
    });
    return row ? mapCredentials(row) : null;
  }

  async upsertCredentials(
    applicationId: string,
    legalEntityId: string,
    input: UpsertSolCredentialsInput,
  ): Promise<ContabilidadSolCredentialsDto> {
    const existing = await this.prisma.contabilidadSolCredentials.findFirst({
      where: { applicationId, legalEntityId },
    });

    const passwordData =
      input.solPassword !== undefined
        ? input.solPassword?.trim()
          ? {
              solPasswordHint: maskPassword(input.solPassword),
              solPasswordEnc: encodePassword(input.solPassword),
            }
          : { solPasswordHint: null, solPasswordEnc: null }
        : {};

    const row = existing
      ? await this.prisma.contabilidadSolCredentials.update({
          where: { id: existing.id },
          data: {
            solUser: input.solUser?.trim() ?? existing.solUser,
            useSandbox: input.useSandbox ?? undefined,
            isActive: input.isActive ?? undefined,
            ...passwordData,
          },
          include: { legalEntity: { select: { code: true, ruc: true } } },
        })
      : await this.prisma.contabilidadSolCredentials.create({
          data: {
            applicationId,
            legalEntityId,
            solUser: input.solUser.trim(),
            useSandbox: input.useSandbox ?? true,
            isActive: input.isActive ?? true,
            ...passwordData,
          },
          include: { legalEntity: { select: { code: true, ruc: true } } },
        });

    return mapCredentials(row);
  }

  async listDeclarations(
    applicationId: string,
    legalEntityId: string,
    filters: ListSunatDeclarationsFilters,
  ): Promise<ContabilidadSunatDeclarationLogDto[]> {
    const rows = await this.prisma.contabilidadSunatDeclarationLog.findMany({
      where: {
        applicationId,
        legalEntityId,
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.declarationType ? { declarationType: filters.declarationType } : {}),
      },
      include: logInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: filters.limit ?? 50,
    });
    return rows.map(mapLog);
  }

  async findLatestDeclaration(
    applicationId: string,
    legalEntityId: string,
    periodId: string,
    declarationType: string,
  ): Promise<ContabilidadSunatDeclarationLogDto | null> {
    const row = await this.prisma.contabilidadSunatDeclarationLog.findFirst({
      where: { applicationId, legalEntityId, periodId, declarationType },
      include: logInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
    return row ? mapLog(row) : null;
  }

  async saveDeclaration(input: {
    applicationId: string;
    legalEntityId: string;
    periodId: string;
    declarationType: string;
    status: string;
    packageJson: string;
    packageHash: string;
    sunatResponseCode?: string | null;
    sunatResponseMessage?: string | null;
    submittedAt?: Date | null;
    acceptedAt?: Date | null;
    createdBy?: string | null;
    existingLogId?: string | null;
  }): Promise<ContabilidadSunatDeclarationLogDto> {
    const data = {
      applicationId: input.applicationId,
      legalEntityId: input.legalEntityId,
      periodId: input.periodId,
      declarationType: input.declarationType,
      status: input.status,
      packageJson: input.packageJson,
      packageHash: input.packageHash,
      sunatResponseCode: input.sunatResponseCode ?? null,
      sunatResponseMessage: input.sunatResponseMessage ?? null,
      submittedAt: input.submittedAt ?? null,
      acceptedAt: input.acceptedAt ?? null,
      createdBy: input.createdBy ?? null,
    };

    const row = input.existingLogId
      ? await this.prisma.contabilidadSunatDeclarationLog.update({
          where: { id: input.existingLogId },
          data,
          include: logInclude,
        })
      : await this.prisma.contabilidadSunatDeclarationLog.create({
          data,
          include: logInclude,
        });

    return mapLog(row);
  }

  async getPeriodLegalEntity(applicationId: string, periodId: string) {
    const row = await this.prisma.contabilidadPeriod.findFirst({
      where: { applicationId, id: periodId },
      include: {
        legalEntity: { select: { id: true, ruc: true, legalName: true, code: true } },
      },
    });
    if (!row) return null;
    return {
      legalEntityId: row.legalEntityId,
      ruc: row.legalEntity.ruc,
      legalName: row.legalEntity.legalName,
      code: row.legalEntity.code,
      year: row.year,
      month: row.month,
    };
  }

  async getPackageContent(applicationId: string, logId: string): Promise<string | null> {
    const row = await this.prisma.contabilidadSunatDeclarationLog.findFirst({
      where: { applicationId, id: logId },
      select: { packageJson: true },
    });
    return row?.packageJson ?? null;
  }

  async findDeclarationById(
    applicationId: string,
    logId: string,
  ): Promise<ContabilidadSunatDeclarationLogDto | null> {
    const row = await this.prisma.contabilidadSunatDeclarationLog.findFirst({
      where: { applicationId, id: logId },
      include: logInclude,
    });
    return row ? mapLog(row) : null;
  }
}
