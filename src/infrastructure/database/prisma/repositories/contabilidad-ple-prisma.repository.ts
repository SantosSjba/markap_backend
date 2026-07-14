import { Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_PLE_BOOKS,
  CONTABILIDAD_PLE_BOOK_CODE,
  CONTABILIDAD_PLE_MANDATORY_BY_TAX_REGIME,
  CONTABILIDAD_SUNAT_DOC_TYPE,
  isValidPleBookCode,
} from '@domain/constants/contabilidad-ple.defaults';
import { CONTABILIDAD_TAX_REGIMES } from '@domain/constants/contabilidad-config.defaults';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import { CONTABILIDAD_ACCOUNT_TYPES } from '@domain/constants/contabilidad-pcge.defaults';
import { accountBalanceFromTotals } from '@domain/constants/contabilidad-financial.defaults';
import {
  CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS,
  CONTABILIDAD_PURCHASE_DEBIT_NOTE_STATUS,
  CONTABILIDAD_PURCHASE_STATUS,
  CONTABILIDAD_PURCHASE_TAX_AFFECTATION,
} from '@domain/constants/contabilidad-purchases.defaults';
import {
  CONTABILIDAD_SALES_CREDIT_NOTE_STATUS,
  CONTABILIDAD_SALES_DEBIT_NOTE_STATUS,
  CONTABILIDAD_SALES_STATUS,
  CONTABILIDAD_SALES_TAX_AFFECTATION,
} from '@domain/constants/contabilidad-sales.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type {
  ContabilidadLibroMayorAccountSummaryDto,
  ContabilidadPleExportLogDto,
  ContabilidadPleGeneratedFile,
  ContabilidadPleGenerateResult,
  ContabilidadPleMandatoryProfileDto,
  ContabilidadPleRepository,
  ContabilidadPleValidationIssue,
} from '@domain/repositories/contabilidad-ple.repository';
import {
  pleFileName,
  pleFormatAmount,
  pleFormatDate,
  pleHeaderLine,
  pleJoin,
} from '@domain/utils/contabilidad-ple-format.util';
import {
  pleValidateCorrelativo,
  pleValidateFieldLength,
  pleValidateIsoDate,
  pleValidateRuc,
  pushIssue,
  PLE_FIELD_LIMITS,
} from '@domain/utils/contabilidad-ple-validator.util';
import { buildPleZipBuffer } from '@domain/utils/contabilidad-ple-zip.util';
import { roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { formatDateOnly } from '@domain/utils/peru-date.util';
import { PrismaService } from '../prisma.service';

interface PeriodCtx {
  applicationId: string;
  periodId: string;
  year: number;
  month: number;
  ruc: string;
  legalName: string;
}

@Injectable()
export class ContabilidadPlePrismaRepository implements ContabilidadPleRepository {
  constructor(private readonly prisma: PrismaService) {}

  listBooks() {
    return { books: CONTABILIDAD_PLE_BOOKS };
  }

  getMandatoryProfile(applicationId: string, taxRegime: string): ContabilidadPleMandatoryProfileDto {
    void applicationId;
    const regime = taxRegime?.trim() || 'GENERAL';
    const mandatoryBookCodes =
      CONTABILIDAD_PLE_MANDATORY_BY_TAX_REGIME[regime] ??
      CONTABILIDAD_PLE_MANDATORY_BY_TAX_REGIME.GENERAL;
    const mandatorySet = new Set(mandatoryBookCodes);
    const regimeLabel =
      CONTABILIDAD_TAX_REGIMES.find((r) => r.code === regime)?.label ?? 'Régimen general';

    return {
      taxRegime: regime,
      taxRegimeLabel: regimeLabel,
      mandatoryBookCodes: [...mandatoryBookCodes],
      optionalBookCodes: CONTABILIDAD_PLE_BOOKS.map((b) => b.code).filter((c) => !mandatorySet.has(c)),
      books: CONTABILIDAD_PLE_BOOKS.map((b) => ({
        code: b.code,
        name: b.name,
        mandatory: mandatorySet.has(b.code),
      })),
    };
  }

  async buildZipBuffer(files: ContabilidadPleGeneratedFile[]) {
    return buildPleZipBuffer(files);
  }

  async listExportLogs(
    applicationId: string,
    periodId?: string,
    limit = 20,
  ): Promise<ContabilidadPleExportLogDto[]> {
    const rows = await this.prisma.contabilidadPleExportLog.findMany({
      where: {
        applicationId,
        ...(periodId ? { periodId } : {}),
      },
      include: { period: { select: { year: true, month: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return rows.map((row) => ({
      id: row.id,
      periodId: row.periodId,
      year: row.period.year,
      month: row.period.month,
      userId: row.userId,
      bookCodes: row.bookCodes,
      fileCount: row.fileCount,
      zipHash: row.zipHash,
      errorCount: row.errorCount,
      warningCount: row.warningCount,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async generateBook(
    applicationId: string,
    periodId: string,
    bookCode: string,
    company: { ruc: string; legalName: string },
  ): Promise<ContabilidadPleGeneratedFile> {
    const ctx = await this.resolvePeriodCtx(applicationId, periodId, company);
    if (!isValidPleBookCode(bookCode)) {
      throw new Error(`Código de libro PLE inválido: ${bookCode}`);
    }
    return this.buildBook(ctx, bookCode);
  }

  async generateBooks(
    applicationId: string,
    periodId: string,
    bookCodes: string[],
    company: { ruc: string; legalName: string },
    options?: { userId?: string | null; persistLog?: boolean },
  ): Promise<ContabilidadPleGenerateResult> {
    const ctx = await this.resolvePeriodCtx(applicationId, periodId, company);
    const files: ContabilidadPleGeneratedFile[] = [];
    const errors: ContabilidadPleValidationIssue[] = [];
    const warnings: ContabilidadPleValidationIssue[] = [];

    pushIssue(errors, pleValidateRuc(ctx.ruc, '*', 'RUC empresa'));

    const periodIssues = await this.validatePeriod(ctx);
    errors.push(...periodIssues.filter((i) => i.severity === 'error'));
    warnings.push(...periodIssues.filter((i) => i.severity === 'warning'));

    const uniqueCodes = [...new Set(bookCodes)];
    for (const code of uniqueCodes) {
      if (!isValidPleBookCode(code)) {
        errors.push({
          severity: 'error',
          bookCode: code,
          code: 'INVALID_BOOK',
          message: `Código de libro no soportado: ${code}`,
        });
        continue;
      }
      try {
        const file = await this.buildBook(ctx, code);
        files.push(file);
        errors.push(...file.issues.filter((i) => i.severity === 'error'));
        warnings.push(...file.issues.filter((i) => i.severity === 'warning'));
      } catch (e) {
        errors.push({
          severity: 'error',
          bookCode: code,
          code: 'GENERATION_FAILED',
          message: e instanceof Error ? e.message : 'Error al generar libro',
        });
      }
    }

    const blocked = errors.length > 0;
    const generatedAt = new Date().toISOString();
    let exportLogId: string | undefined;

    if (options?.persistLog !== false) {
      const { hash } = files.length ? await buildPleZipBuffer(files) : await buildPleZipBuffer([]);

      const log = await this.prisma.contabilidadPleExportLog.create({
        data: {
          applicationId,
          periodId,
          userId: options?.userId ?? null,
          bookCodes: uniqueCodes,
          fileCount: files.length,
          zipHash: hash,
          errorCount: errors.length,
          warningCount: warnings.length,
          issuesJson: JSON.stringify({ errors, warnings }),
          status: blocked ? 'BLOCKED' : warnings.length ? 'WITH_WARNINGS' : 'SUCCESS',
        },
      });
      exportLogId = log.id;
    }

    return {
      periodId,
      year: ctx.year,
      month: ctx.month,
      ruc: ctx.ruc,
      legalName: ctx.legalName,
      files,
      errors,
      warnings,
      generatedAt,
      blocked,
      exportLogId,
    };
  }

  async getLibroMayor(
    applicationId: string,
    periodId: string,
    accountId?: string,
  ): Promise<ContabilidadLibroMayorAccountSummaryDto[]> {
    const lines = await this.prisma.contabilidadJournalEntryLine.findMany({
      where: {
        journalEntry: {
          applicationId,
          periodId,
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
        ...(accountId ? { accountId } : {}),
      },
      include: {
        account: { select: { id: true, code: true, name: true } },
        journalEntry: { select: { entryDate: true, entryNumber: true, description: true } },
      },
      orderBy: [
        { account: { code: 'asc' } },
        { journalEntry: { entryDate: 'asc' } },
        { journalEntry: { entryNumber: 'asc' } },
        { lineNumber: 'asc' },
      ],
    });

    const byAccount = new Map<string, ContabilidadLibroMayorAccountSummaryDto>();

    for (const line of lines) {
      const accId = line.account.id;
      if (!byAccount.has(accId)) {
        byAccount.set(accId, {
          accountId: accId,
          accountCode: line.account.code,
          accountName: line.account.name,
          totalDebit: '0.00',
          totalCredit: '0.00',
          balance: '0.00',
          lines: [],
        });
      }
      const summary = byAccount.get(accId)!;
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      const prevBalance = Number(summary.balance);
      const running = roundPenAmount(prevBalance + debit - credit);

      summary.lines.push({
        accountId: accId,
        accountCode: line.account.code,
        accountName: line.account.name,
        entryDate: formatDateOnly(line.journalEntry.entryDate),
        entryNumber: line.journalEntry.entryNumber,
        description: line.description ?? line.journalEntry.description,
        debit: pleFormatAmount(debit),
        credit: pleFormatAmount(credit),
        runningBalance: running.toFixed(2),
      });

      const totalD = roundPenAmount(Number(summary.totalDebit) + debit);
      const totalC = roundPenAmount(Number(summary.totalCredit) + credit);
      summary.totalDebit = totalD.toFixed(2);
      summary.totalCredit = totalC.toFixed(2);
      summary.balance = roundPenAmount(totalD - totalC).toFixed(2);
    }

    return [...byAccount.values()].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  private async resolvePeriodCtx(
    applicationId: string,
    periodId: string,
    company: { ruc: string; legalName: string },
  ): Promise<PeriodCtx> {
    const period = await this.prisma.contabilidadPeriod.findFirst({
      where: { id: periodId, applicationId },
    });
    if (!period) throw new Error('Periodo no encontrado');
    if (!company.ruc?.trim()) throw new Error('RUC de empresa no configurado');
    return {
      applicationId,
      periodId,
      year: period.year,
      month: period.month,
      ruc: company.ruc.trim(),
      legalName: company.legalName.trim(),
    };
  }

  private async validatePeriod(ctx: PeriodCtx): Promise<ContabilidadPleValidationIssue[]> {
    const issues: ContabilidadPleValidationIssue[] = [];
    const unbalanced = await this.prisma.contabilidadJournalEntry.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
      },
      select: { id: true, entryNumber: true, totalDebit: true, totalCredit: true },
    });
    for (const entry of unbalanced) {
      if (roundPenAmount(Number(entry.totalDebit)) !== roundPenAmount(Number(entry.totalCredit))) {
        issues.push({
          severity: 'error',
          bookCode: '*',
          code: 'UNBALANCED_ENTRY',
          message: `Asiento ${entry.entryNumber} no cuadra (debe ≠ haber)`,
          context: entry.id,
        });
      }
    }
    const drafts = await this.prisma.contabilidadJournalEntry.count({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.DRAFT,
      },
    });
    if (drafts > 0) {
      issues.push({
        severity: 'warning',
        bookCode: '*',
        code: 'DRAFT_ENTRIES',
        message: `Hay ${drafts} asiento(s) en borrador que no se incluirán en el PLE`,
      });
    }
    return issues;
  }

  private async buildBook(ctx: PeriodCtx, bookCode: string): Promise<ContabilidadPleGeneratedFile> {
    const def = CONTABILIDAD_PLE_BOOKS.find((b) => b.code === bookCode)!;
    const issues: ContabilidadPleValidationIssue[] = [];

    let dataLines: string[] = [];
    switch (bookCode) {
      case CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO:
        dataLines = await this.buildLibroDiario(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO_SIMPLIFICADO:
        dataLines = await this.buildLibroDiarioSimplificado(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.DETALLE_LIBRO_DIARIO:
        dataLines = await this.buildDetalleLibroDiario(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.PLAN_CUENTAS:
        dataLines = await this.buildPlanCuentas(ctx);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.LIBRO_MAYOR:
        dataLines = await this.buildLibroMayorPle(ctx);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS:
        dataLines = await this.buildRegistroCompras(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_NO_DOMIC:
        dataLines = await this.buildRegistroComprasNoDomic(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_COMPLEMENTARIO:
        dataLines = await this.buildRegistroComprasNcNd(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_NO_GRAVADAS:
        dataLines = await this.buildRegistroComprasNoGravadas(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.INVENTARIOS_BALANCES:
        dataLines = await this.buildInventariosBalances(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS:
        dataLines = await this.buildRegistroVentas(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS_COMPLEMENTARIO:
        dataLines = await this.buildRegistroVentasNcNd(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.CAJA_BANCOS:
        dataLines = await this.buildCajaBancos(ctx);
        break;
      default:
        throw new Error(`Libro no implementado: ${bookCode}`);
    }

    const fileName = pleFileName(ctx.ruc, ctx.year, ctx.month, bookCode);
    const header = pleHeaderLine(ctx.ruc, ctx.legalName, ctx.year, ctx.month, bookCode, dataLines.length);
    const content = [header, ...dataLines].join('\n');

    if (dataLines.length === 0) {
      issues.push({
        severity: 'warning',
        bookCode,
        code: 'EMPTY_BOOK',
        message: 'El libro no tiene registros para el periodo',
      });
    }

    return {
      bookCode,
      bookName: def.name,
      fileName,
      lineCount: dataLines.length,
      content,
      issues,
    };
  }

  private async buildLibroDiario(ctx: PeriodCtx, issues: ContabilidadPleValidationIssue[]): Promise<string[]> {
    const entries = await this.prisma.contabilidadJournalEntry.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
      },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
          include: { account: { select: { code: true } } },
        },
      },
      orderBy: [{ entryDate: 'asc' }, { entryNumber: 'asc' }],
    });

    const lines: string[] = [];
    for (const entry of entries) {
      for (const line of entry.lines) {
        if (!line.account.code) {
          issues.push({
            severity: 'error',
            bookCode: CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO,
            code: 'MISSING_ACCOUNT',
            message: `Línea sin cuenta en asiento ${entry.entryNumber}`,
          });
        }
        lines.push(
          pleJoin([
            'M',
            entry.entryNumber,
            pleFormatDate(formatDateOnly(entry.entryDate)),
            line.account.code,
            line.auxiliaryRuc ?? '',
            pleFormatAmount(line.debit),
            pleFormatAmount(line.credit),
            line.description ?? entry.description,
          ]),
        );
      }
    }
    return lines;
  }

  private async buildPlanCuentas(ctx: PeriodCtx): Promise<string[]> {
    const accounts = await this.prisma.contabilidadAccount.findMany({
      where: { applicationId: ctx.applicationId, isMovement: true, isActive: true },
      orderBy: { code: 'asc' },
    });
    return accounts.map((acc) =>
      pleJoin(['M', acc.code, acc.name, acc.level, acc.accountType]),
    );
  }

  private async buildLibroMayorPle(ctx: PeriodCtx): Promise<string[]> {
    const mayor = await this.getLibroMayor(ctx.applicationId, ctx.periodId);
    const lines: string[] = [];
    for (const acc of mayor) {
      for (const line of acc.lines) {
        lines.push(
          pleJoin([
            'M',
            line.accountCode,
            pleFormatDate(line.entryDate),
            line.entryNumber,
            line.debit,
            line.credit,
            line.runningBalance,
            line.description,
          ]),
        );
      }
    }
    return lines;
  }

  private async buildRegistroCompras(ctx: PeriodCtx, issues: ContabilidadPleValidationIssue[]): Promise<string[]> {
    const rows = await this.collectPurchaseRegistroRows(ctx);
    const lines: string[] = [];
    let lineNumber = 2;

    for (const row of rows) {
      const linePreview = pleJoin([
        'M',
        pleFormatDate(row.issueDate),
        row.documentType,
        row.series,
        row.number,
        row.counterpartyRuc,
      ]);
      const ctxLabel = `${row.documentType} ${row.series}-${row.number}`;
      pushIssue(issues, pleValidateIsoDate(row.issueDate, CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS, ctxLabel, lineNumber, linePreview));
      issues.push(
        ...pleValidateCorrelativo(
          row.series,
          row.number,
          CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
          ctxLabel,
          lineNumber,
          linePreview,
        ),
      );
      pushIssue(
        issues,
        pleValidateRuc(
          row.counterpartyRuc,
          CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
          ctxLabel,
          lineNumber,
          linePreview,
        ),
      );
      pushIssue(
        issues,
        pleValidateFieldLength(
          row.counterpartyName,
          PLE_FIELD_LIMITS.BUSINESS_NAME,
          'Razón social proveedor',
          CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
          ctxLabel,
          lineNumber,
          linePreview,
        ),
      );

      lines.push(
        pleJoin([
          'M',
          pleFormatDate(row.issueDate),
          row.documentType,
          row.series,
          row.number,
          row.counterpartyRuc,
          row.counterpartyName,
          row.taxAffectation,
          pleFormatAmount(row.taxableBase),
          pleFormatAmount(row.igvAmount),
          pleFormatAmount(row.totalAmount),
          pleFormatAmount(row.detraccionAmount),
          row.modifiedDocRef ?? '',
          row.status,
        ]),
      );
      lineNumber += 1;
    }
    return lines;
  }

  private async buildRegistroComprasNoDomic(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const invoices = await this.prisma.contabilidadPurchaseInvoice.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: { not: CONTABILIDAD_PURCHASE_STATUS.CANCELLED },
        supplier: {
          OR: [{ isNonDomiciled: true }, { countryCode: { not: 'PE' } }],
        },
      },
      include: { supplier: { select: { ruc: true, businessName: true, countryCode: true } } },
      orderBy: [{ issueDate: 'asc' }, { series: 'asc' }, { number: 'asc' }],
    });

    return invoices.map((inv) => {
      if (!inv.supplier.ruc) {
        issues.push({
          severity: 'error',
          bookCode: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_NO_DOMIC,
          code: 'MISSING_RUC',
          message: `Factura ${inv.series}-${inv.number} sin RUC proveedor`,
        });
      }
      return pleJoin([
        'M',
        pleFormatDate(formatDateOnly(inv.issueDate)),
        inv.documentType,
        inv.series,
        inv.number,
        inv.supplier.ruc,
        inv.supplier.businessName,
        inv.supplier.countryCode,
        inv.taxAffectation,
        pleFormatAmount(inv.taxableBase),
        pleFormatAmount(inv.igvAmount),
        pleFormatAmount(inv.totalAmount),
        inv.status,
      ]);
    });
  }

  private async buildInventariosBalances(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const periodIds = await this.prisma.contabilidadPeriod.findMany({
      where: {
        applicationId: ctx.applicationId,
        OR: [{ year: { lt: ctx.year } }, { year: ctx.year, month: { lte: ctx.month } }],
      },
      select: { id: true },
    });

    const grouped = await this.prisma.contabilidadJournalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          applicationId: ctx.applicationId,
          periodId: { in: periodIds.map((p) => p.id) },
          status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
        },
      },
      _sum: { debit: true, credit: true },
    });

    const inventoryItems = await this.prisma.contabilidadInventoryItem.findMany({
      where: { applicationId: ctx.applicationId },
      include: { account: { select: { id: true, code: true, name: true, accountType: true } } },
    });

    if (!grouped.length && inventoryItems.length === 0) return [];

    const accountIds = [
      ...new Set([
        ...grouped.map((g) => g.accountId),
        ...inventoryItems.map((i) => i.accountId),
      ]),
    ];
    const accounts = await this.prisma.contabilidadAccount.findMany({
      where: {
        applicationId: ctx.applicationId,
        id: { in: accountIds.length ? accountIds : ['__none__'] },
        accountType: {
          in: [
            CONTABILIDAD_ACCOUNT_TYPES.ASSET,
            CONTABILIDAD_ACCOUNT_TYPES.LIABILITY,
            CONTABILIDAD_ACCOUNT_TYPES.EQUITY,
          ],
        },
        isMovement: true,
      },
      select: { id: true, code: true, name: true, accountType: true },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const inventoryBalanceByAccount = new Map<string, number>();
    for (const item of inventoryItems) {
      const valued = roundPenAmount(Number(item.quantityOnHand) * Number(item.avgUnitCost));
      if (Math.abs(valued) < 0.005) continue;
      inventoryBalanceByAccount.set(
        item.accountId,
        roundPenAmount((inventoryBalanceByAccount.get(item.accountId) ?? 0) + valued),
      );
    }

    const balanceByAccount = new Map<string, number>();
    for (const g of grouped) {
      const acc = accountMap.get(g.accountId);
      if (!acc) continue;
      const balance = accountBalanceFromTotals(
        acc.accountType,
        Number(g._sum.debit ?? 0),
        Number(g._sum.credit ?? 0),
      );
      balanceByAccount.set(g.accountId, roundPenAmount(balance));
    }

    for (const [accountId, invBalance] of inventoryBalanceByAccount) {
      balanceByAccount.set(accountId, invBalance);
      if (!accountMap.has(accountId)) {
        const acc = inventoryItems.find((i) => i.accountId === accountId)?.account;
        if (acc) accountMap.set(accountId, acc);
      }
    }

    const snapshotRows: {
      applicationId: string;
      periodId: string;
      accountId: string;
      accountCode: string;
      accountName: string;
      balance: number;
    }[] = [];

    const lines: string[] = [];
    for (const [accountId, balance] of balanceByAccount) {
      const acc = accountMap.get(accountId);
      if (!acc) continue;
      if (Math.abs(balance) < 0.005) continue;

      snapshotRows.push({
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        balance: roundPenAmount(balance),
      });

      lines.push(
        pleJoin([
          'M',
          acc.code,
          acc.name,
          acc.accountType,
          pleFormatAmount(balance),
        ]),
      );
    }

    lines.sort((a, b) => a.localeCompare(b));

    if (snapshotRows.length > 0) {
      await this.prisma.contabilidadInventoryBalanceSnapshot.deleteMany({
        where: { applicationId: ctx.applicationId, periodId: ctx.periodId },
      });
      await this.prisma.contabilidadInventoryBalanceSnapshot.createMany({
        data: snapshotRows.map((row) => ({
          applicationId: row.applicationId,
          periodId: row.periodId,
          accountId: row.accountId,
          accountCode: row.accountCode,
          accountName: row.accountName,
          balance: row.balance,
        })),
      });
    } else {
      issues.push({
        severity: 'warning',
        bookCode: CONTABILIDAD_PLE_BOOK_CODE.INVENTARIOS_BALANCES,
        code: 'NO_BALANCES',
        message: 'No hay saldos de activo, pasivo o patrimonio para el periodo',
      });
    }

    return lines;
  }

  private async buildRegistroVentas(ctx: PeriodCtx, issues: ContabilidadPleValidationIssue[]): Promise<string[]> {
    const rows = await this.collectSalesRegistroRows(ctx);
    const lines: string[] = [];
    let lineNumber = 2;

    for (const row of rows) {
      const linePreview = pleJoin([
        'M',
        pleFormatDate(row.issueDate),
        row.documentType,
        row.series,
        row.number,
        row.counterpartyRuc,
      ]);
      const ctxLabel = `${row.documentType} ${row.series}-${row.number}`;
      pushIssue(issues, pleValidateIsoDate(row.issueDate, CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS, ctxLabel, lineNumber, linePreview));
      issues.push(
        ...pleValidateCorrelativo(
          row.series,
          row.number,
          CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
          ctxLabel,
          lineNumber,
          linePreview,
        ),
      );
      pushIssue(
        issues,
        pleValidateRuc(
          row.counterpartyRuc,
          CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
          ctxLabel,
          lineNumber,
          linePreview,
        ),
      );
      pushIssue(
        issues,
        pleValidateFieldLength(
          row.counterpartyName,
          PLE_FIELD_LIMITS.BUSINESS_NAME,
          'Razón social cliente',
          CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
          ctxLabel,
          lineNumber,
          linePreview,
        ),
      );

      lines.push(
        pleJoin([
          'M',
          pleFormatDate(row.issueDate),
          row.documentType,
          row.series,
          row.number,
          row.counterpartyRuc,
          row.counterpartyName,
          row.taxAffectation,
          pleFormatAmount(row.taxableBase),
          pleFormatAmount(row.igvAmount),
          pleFormatAmount(row.totalAmount),
          row.modifiedDocRef ?? '',
          row.status,
        ]),
      );
      lineNumber += 1;
    }
    return lines;
  }

  private async buildCajaBancos(ctx: PeriodCtx): Promise<string[]> {
    const movements = await this.prisma.contabilidadTreasuryMovement.findMany({
      where: { applicationId: ctx.applicationId, periodId: ctx.periodId },
      include: {
        cashBox: { select: { code: true } },
        bankAccount: { select: { code: true, bankName: true } },
        offsetAccount: { select: { code: true } },
      },
      orderBy: [{ movementDate: 'asc' }, { createdAt: 'asc' }],
    });

    return movements.map((mov) =>
      pleJoin([
        'M',
        pleFormatDate(formatDateOnly(mov.movementDate)),
        mov.movementType === CONTABILIDAD_TREASURY_MOVEMENT_TYPE.IN ? 'INGRESO' : 'EGRESO',
        mov.sourceType,
        mov.cashBox?.code ?? '',
        mov.bankAccount?.code ?? '',
        mov.bankAccount?.bankName ?? '',
        mov.offsetAccount?.code ?? '',
        pleFormatAmount(mov.amount),
        mov.description,
      ]),
    );
  }

  private async buildLibroDiarioSimplificado(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const entries = await this.prisma.contabilidadJournalEntry.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
      },
      orderBy: [{ entryDate: 'asc' }, { entryNumber: 'asc' }],
    });

    return entries.map((entry, idx) => {
      const lineNumber = idx + 2;
      const linePreview = pleJoin(['M', entry.entryNumber, pleFormatDate(formatDateOnly(entry.entryDate))]);
      if (roundPenAmount(Number(entry.totalDebit)) !== roundPenAmount(Number(entry.totalCredit))) {
        issues.push({
          severity: 'error',
          bookCode: CONTABILIDAD_PLE_BOOK_CODE.LIBRO_DIARIO_SIMPLIFICADO,
          code: 'UNBALANCED_ENTRY',
          message: `Asiento ${entry.entryNumber} no cuadra`,
          lineNumber,
          linePreview,
        });
      }
      return pleJoin([
        'M',
        entry.entryNumber,
        pleFormatDate(formatDateOnly(entry.entryDate)),
        pleFormatAmount(entry.totalDebit),
        pleFormatAmount(entry.totalCredit),
        entry.description,
      ]);
    });
  }

  private async buildDetalleLibroDiario(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const entries = await this.prisma.contabilidadJournalEntry.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: CONTABILIDAD_JOURNAL_STATUS.POSTED,
      },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
          include: { account: { select: { code: true } } },
        },
      },
      orderBy: [{ entryDate: 'asc' }, { entryNumber: 'asc' }],
    });

    const lines: string[] = [];
    let lineNumber = 2;
    for (const entry of entries) {
      for (const line of entry.lines) {
        const linePreview = pleJoin([
          'M',
          entry.entryNumber,
          line.lineNumber,
          line.account.code,
        ]);
        if (!line.account.code) {
          issues.push({
            severity: 'error',
            bookCode: CONTABILIDAD_PLE_BOOK_CODE.DETALLE_LIBRO_DIARIO,
            code: 'MISSING_ACCOUNT',
            message: `Línea sin cuenta en asiento ${entry.entryNumber}`,
            lineNumber,
            linePreview,
          });
        }
        lines.push(
          pleJoin([
            'M',
            entry.entryNumber,
            pleFormatDate(formatDateOnly(entry.entryDate)),
            line.lineNumber,
            line.account.code,
            line.auxiliaryRuc ?? '',
            pleFormatAmount(line.debit),
            pleFormatAmount(line.credit),
            line.description ?? entry.description,
          ]),
        );
        lineNumber += 1;
      }
    }
    return lines;
  }

  private async buildRegistroComprasNcNd(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const rows = (await this.collectPurchaseRegistroRows(ctx)).filter(
      (r) =>
        r.documentType === CONTABILIDAD_SUNAT_DOC_TYPE.CREDIT_NOTE ||
        r.documentType === CONTABILIDAD_SUNAT_DOC_TYPE.DEBIT_NOTE,
    );
    return this.mapPurchaseRegistroLines(rows, CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_COMPLEMENTARIO, issues);
  }

  private async buildRegistroComprasNoGravadas(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const rows = (await this.collectPurchaseRegistroRows(ctx)).filter(
      (r) =>
        r.taxAffectation === CONTABILIDAD_PURCHASE_TAX_AFFECTATION.EXEMPT ||
        r.taxAffectation === CONTABILIDAD_PURCHASE_TAX_AFFECTATION.NON_TAXABLE,
    );
    return this.mapPurchaseRegistroLines(rows, CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS_NO_GRAVADAS, issues);
  }

  private async buildRegistroVentasNcNd(
    ctx: PeriodCtx,
    issues: ContabilidadPleValidationIssue[],
  ): Promise<string[]> {
    const rows = (await this.collectSalesRegistroRows(ctx)).filter(
      (r) =>
        r.documentType === CONTABILIDAD_SUNAT_DOC_TYPE.CREDIT_NOTE ||
        r.documentType === CONTABILIDAD_SUNAT_DOC_TYPE.DEBIT_NOTE,
    );
    return this.mapSalesRegistroLines(rows, CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS_COMPLEMENTARIO, issues);
  }

  private mapPurchaseRegistroLines(
    rows: PurchaseRegistroRow[],
    bookCode: string,
    issues: ContabilidadPleValidationIssue[],
  ): string[] {
    const lines: string[] = [];
    let lineNumber = 2;
    for (const row of rows) {
      const ctxLabel = `${row.documentType} ${row.series}-${row.number}`;
      const linePreview = pleJoin(['M', pleFormatDate(row.issueDate), row.series, row.number]);
      pushIssue(issues, pleValidateRuc(row.counterpartyRuc, bookCode, ctxLabel, lineNumber, linePreview));
      lines.push(
        pleJoin([
          'M',
          pleFormatDate(row.issueDate),
          row.documentType,
          row.series,
          row.number,
          row.counterpartyRuc,
          row.counterpartyName,
          row.taxAffectation,
          pleFormatAmount(row.taxableBase),
          pleFormatAmount(row.igvAmount),
          pleFormatAmount(row.totalAmount),
          row.modifiedDocRef ?? '',
          row.status,
        ]),
      );
      lineNumber += 1;
    }
    return lines;
  }

  private mapSalesRegistroLines(
    rows: SalesRegistroRow[],
    bookCode: string,
    issues: ContabilidadPleValidationIssue[],
  ): string[] {
    const lines: string[] = [];
    let lineNumber = 2;
    for (const row of rows) {
      const ctxLabel = `${row.documentType} ${row.series}-${row.number}`;
      const linePreview = pleJoin(['M', pleFormatDate(row.issueDate), row.series, row.number]);
      pushIssue(issues, pleValidateRuc(row.counterpartyRuc, bookCode, ctxLabel, lineNumber, linePreview));
      lines.push(
        pleJoin([
          'M',
          pleFormatDate(row.issueDate),
          row.documentType,
          row.series,
          row.number,
          row.counterpartyRuc,
          row.counterpartyName,
          row.taxAffectation,
          pleFormatAmount(row.taxableBase),
          pleFormatAmount(row.igvAmount),
          pleFormatAmount(row.totalAmount),
          row.modifiedDocRef ?? '',
          row.status,
        ]),
      );
      lineNumber += 1;
    }
    return lines;
  }

  private async collectPurchaseRegistroRows(ctx: PeriodCtx): Promise<PurchaseRegistroRow[]> {
    const [invoices, creditNotes, debitNotes] = await Promise.all([
      this.prisma.contabilidadPurchaseInvoice.findMany({
        where: {
          applicationId: ctx.applicationId,
          periodId: ctx.periodId,
          status: { not: CONTABILIDAD_PURCHASE_STATUS.CANCELLED },
        },
        include: { supplier: { select: { ruc: true, businessName: true } } },
      }),
      this.prisma.contabilidadPurchaseCreditNote.findMany({
        where: {
          applicationId: ctx.applicationId,
          periodId: ctx.periodId,
          status: { not: CONTABILIDAD_PURCHASE_CREDIT_NOTE_STATUS.CANCELLED },
        },
        include: {
          supplier: { select: { ruc: true, businessName: true } },
          invoice: { select: { documentType: true, series: true, number: true } },
        },
      }),
      this.prisma.contabilidadPurchaseDebitNote.findMany({
        where: {
          applicationId: ctx.applicationId,
          periodId: ctx.periodId,
          status: { not: CONTABILIDAD_PURCHASE_DEBIT_NOTE_STATUS.CANCELLED },
        },
        include: {
          supplier: { select: { ruc: true, businessName: true } },
          invoice: { select: { documentType: true, series: true, number: true } },
        },
      }),
    ]);

    const rows: PurchaseRegistroRow[] = [
      ...invoices.map((inv) => ({
        issueDate: formatDateOnly(inv.issueDate),
        documentType: this.mapPurchaseDocumentType(inv.documentType),
        series: inv.series,
        number: inv.number,
        counterpartyRuc: inv.supplier.ruc,
        counterpartyName: inv.supplier.businessName,
        taxAffectation: inv.taxAffectation,
        taxableBase: Number(inv.taxableBase),
        igvAmount: Number(inv.igvAmount),
        totalAmount: Number(inv.totalAmount),
        detraccionAmount: Number(inv.detraccionAmount),
        modifiedDocRef: '',
        status: inv.status,
        sortKey: `${formatDateOnly(inv.issueDate)}|${inv.series}|${inv.number}`,
      })),
      ...creditNotes.map((nc) => ({
        issueDate: formatDateOnly(nc.issueDate),
        documentType: CONTABILIDAD_SUNAT_DOC_TYPE.CREDIT_NOTE,
        series: nc.series,
        number: nc.number,
        counterpartyRuc: nc.supplier.ruc,
        counterpartyName: nc.supplier.businessName,
        taxAffectation: CONTABILIDAD_PURCHASE_TAX_AFFECTATION.TAXABLE,
        taxableBase: Number(nc.taxableBase),
        igvAmount: Number(nc.igvAmount),
        totalAmount: Number(nc.totalAmount),
        detraccionAmount: 0,
        modifiedDocRef: nc.invoice ? `${nc.invoice.series}-${nc.invoice.number}` : '',
        status: nc.status,
        sortKey: `${formatDateOnly(nc.issueDate)}|${nc.series}|${nc.number}`,
      })),
      ...debitNotes.map((nd) => ({
        issueDate: formatDateOnly(nd.issueDate),
        documentType: CONTABILIDAD_SUNAT_DOC_TYPE.DEBIT_NOTE,
        series: nd.series,
        number: nd.number,
        counterpartyRuc: nd.supplier.ruc,
        counterpartyName: nd.supplier.businessName,
        taxAffectation: CONTABILIDAD_PURCHASE_TAX_AFFECTATION.TAXABLE,
        taxableBase: Number(nd.taxableBase),
        igvAmount: Number(nd.igvAmount),
        totalAmount: Number(nd.totalAmount),
        detraccionAmount: 0,
        modifiedDocRef: nd.invoice ? `${nd.invoice.series}-${nd.invoice.number}` : '',
        status: nd.status,
        sortKey: `${formatDateOnly(nd.issueDate)}|${nd.series}|${nd.number}`,
      })),
    ];

    return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  private async collectSalesRegistroRows(ctx: PeriodCtx): Promise<SalesRegistroRow[]> {
    const [invoices, creditNotes, debitNotes] = await Promise.all([
      this.prisma.contabilidadSalesInvoice.findMany({
        where: {
          applicationId: ctx.applicationId,
          periodId: ctx.periodId,
          status: { not: CONTABILIDAD_SALES_STATUS.CANCELLED },
        },
        include: { customer: { select: { ruc: true, businessName: true } } },
      }),
      this.prisma.contabilidadSalesCreditNote.findMany({
        where: {
          applicationId: ctx.applicationId,
          periodId: ctx.periodId,
          status: { not: CONTABILIDAD_SALES_CREDIT_NOTE_STATUS.CANCELLED },
        },
        include: {
          customer: { select: { ruc: true, businessName: true } },
          invoice: { select: { documentType: true, series: true, number: true } },
        },
      }),
      this.prisma.contabilidadSalesDebitNote.findMany({
        where: {
          applicationId: ctx.applicationId,
          periodId: ctx.periodId,
          status: { not: CONTABILIDAD_SALES_DEBIT_NOTE_STATUS.CANCELLED },
        },
        include: {
          customer: { select: { ruc: true, businessName: true } },
          invoice: { select: { documentType: true, series: true, number: true } },
        },
      }),
    ]);

    const rows: SalesRegistroRow[] = [
      ...invoices.map((inv) => ({
        issueDate: formatDateOnly(inv.issueDate),
        documentType: this.mapSalesDocumentType(inv.documentType),
        series: inv.series,
        number: inv.number,
        counterpartyRuc: inv.customer.ruc,
        counterpartyName: inv.customer.businessName,
        taxAffectation: inv.taxAffectation,
        taxableBase: Number(inv.taxableBase),
        igvAmount: Number(inv.igvAmount),
        totalAmount: Number(inv.totalAmount),
        modifiedDocRef: '',
        status: inv.status,
        sortKey: `${formatDateOnly(inv.issueDate)}|${inv.series}|${inv.number}`,
      })),
      ...creditNotes.map((nc) => ({
        issueDate: formatDateOnly(nc.issueDate),
        documentType: CONTABILIDAD_SUNAT_DOC_TYPE.CREDIT_NOTE,
        series: nc.series,
        number: nc.number,
        counterpartyRuc: nc.customer.ruc,
        counterpartyName: nc.customer.businessName,
        taxAffectation: CONTABILIDAD_SALES_TAX_AFFECTATION.TAXABLE,
        taxableBase: Number(nc.taxableBase),
        igvAmount: Number(nc.igvAmount),
        totalAmount: Number(nc.totalAmount),
        modifiedDocRef: nc.invoice ? `${nc.invoice.series}-${nc.invoice.number}` : '',
        status: nc.status,
        sortKey: `${formatDateOnly(nc.issueDate)}|${nc.series}|${nc.number}`,
      })),
      ...debitNotes.map((nd) => ({
        issueDate: formatDateOnly(nd.issueDate),
        documentType: CONTABILIDAD_SUNAT_DOC_TYPE.DEBIT_NOTE,
        series: nd.series,
        number: nd.number,
        counterpartyRuc: nd.customer.ruc,
        counterpartyName: nd.customer.businessName,
        taxAffectation: CONTABILIDAD_SALES_TAX_AFFECTATION.TAXABLE,
        taxableBase: Number(nd.taxableBase),
        igvAmount: Number(nd.igvAmount),
        totalAmount: Number(nd.totalAmount),
        modifiedDocRef: nd.invoice ? `${nd.invoice.series}-${nd.invoice.number}` : '',
        status: nd.status,
        sortKey: `${formatDateOnly(nd.issueDate)}|${nd.series}|${nd.number}`,
      })),
    ];

    return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  private mapPurchaseDocumentType(documentType: string): string {
    const upper = documentType.toUpperCase();
    if (upper.includes('CREDIT') || upper === 'NC') return CONTABILIDAD_SUNAT_DOC_TYPE.CREDIT_NOTE;
    if (upper.includes('DEBIT') || upper === 'ND') return CONTABILIDAD_SUNAT_DOC_TYPE.DEBIT_NOTE;
    return CONTABILIDAD_SUNAT_DOC_TYPE.FACTURA;
  }

  private mapSalesDocumentType(documentType: string): string {
    const upper = documentType.toUpperCase();
    if (upper.includes('CREDIT') || upper === 'NC') return CONTABILIDAD_SUNAT_DOC_TYPE.CREDIT_NOTE;
    if (upper.includes('DEBIT') || upper === 'ND') return CONTABILIDAD_SUNAT_DOC_TYPE.DEBIT_NOTE;
    if (upper.includes('BOLETA') || upper === '03') return '03';
    return CONTABILIDAD_SUNAT_DOC_TYPE.FACTURA;
  }
}

interface PurchaseRegistroRow {
  issueDate: string;
  documentType: string;
  series: string;
  number: string;
  counterpartyRuc: string;
  counterpartyName: string;
  taxAffectation: string;
  taxableBase: number;
  igvAmount: number;
  totalAmount: number;
  detraccionAmount: number;
  modifiedDocRef: string;
  status: string;
  sortKey: string;
}

interface SalesRegistroRow {
  issueDate: string;
  documentType: string;
  series: string;
  number: string;
  counterpartyRuc: string;
  counterpartyName: string;
  taxAffectation: string;
  taxableBase: number;
  igvAmount: number;
  totalAmount: number;
  modifiedDocRef: string;
  status: string;
  sortKey: string;
}
