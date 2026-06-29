import { Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_PLE_BOOKS,
  CONTABILIDAD_PLE_BOOK_CODE,
  isValidPleBookCode,
} from '@domain/constants/contabilidad-ple.defaults';
import { CONTABILIDAD_JOURNAL_STATUS } from '@domain/constants/contabilidad-journal.defaults';
import { CONTABILIDAD_PURCHASE_STATUS } from '@domain/constants/contabilidad-purchases.defaults';
import { CONTABILIDAD_SALES_STATUS } from '@domain/constants/contabilidad-sales.defaults';
import { CONTABILIDAD_TREASURY_MOVEMENT_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type {
  ContabilidadLibroMayorAccountSummaryDto,
  ContabilidadPleGeneratedFile,
  ContabilidadPleGenerateResult,
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
import { roundPenAmount } from '@domain/utils/contabilidad-journal-amounts';
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
  ): Promise<ContabilidadPleGenerateResult> {
    const ctx = await this.resolvePeriodCtx(applicationId, periodId, company);
    const files: ContabilidadPleGeneratedFile[] = [];
    const errors: ContabilidadPleValidationIssue[] = [];
    const warnings: ContabilidadPleValidationIssue[] = [];

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

    return {
      periodId,
      year: ctx.year,
      month: ctx.month,
      ruc: ctx.ruc,
      legalName: ctx.legalName,
      files,
      errors,
      warnings,
      generatedAt: new Date().toISOString(),
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
        entryDate: line.journalEntry.entryDate.toISOString().slice(0, 10),
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
      case CONTABILIDAD_PLE_BOOK_CODE.PLAN_CUENTAS:
        dataLines = await this.buildPlanCuentas(ctx);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.LIBRO_MAYOR:
        dataLines = await this.buildLibroMayorPle(ctx);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS:
        dataLines = await this.buildRegistroCompras(ctx, issues);
        break;
      case CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS:
        dataLines = await this.buildRegistroVentas(ctx, issues);
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
            pleFormatDate(entry.entryDate.toISOString().slice(0, 10)),
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
    const invoices = await this.prisma.contabilidadPurchaseInvoice.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: { not: CONTABILIDAD_PURCHASE_STATUS.CANCELLED },
      },
      include: { supplier: { select: { ruc: true, businessName: true } } },
      orderBy: [{ issueDate: 'asc' }, { series: 'asc' }, { number: 'asc' }],
    });

    return invoices.map((inv) => {
      if (!inv.supplier.ruc) {
        issues.push({
          severity: 'error',
          bookCode: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_COMPRAS,
          code: 'MISSING_RUC',
          message: `Factura ${inv.series}-${inv.number} sin RUC proveedor`,
        });
      }
      return pleJoin([
        'M',
        pleFormatDate(inv.issueDate.toISOString().slice(0, 10)),
        inv.documentType,
        inv.series,
        inv.number,
        inv.supplier.ruc,
        inv.supplier.businessName,
        inv.taxAffectation,
        pleFormatAmount(inv.taxableBase),
        pleFormatAmount(inv.igvAmount),
        pleFormatAmount(inv.totalAmount),
        pleFormatAmount(inv.detraccionAmount),
        inv.status,
      ]);
    });
  }

  private async buildRegistroVentas(ctx: PeriodCtx, issues: ContabilidadPleValidationIssue[]): Promise<string[]> {
    const invoices = await this.prisma.contabilidadSalesInvoice.findMany({
      where: {
        applicationId: ctx.applicationId,
        periodId: ctx.periodId,
        status: { not: CONTABILIDAD_SALES_STATUS.CANCELLED },
      },
      include: { customer: { select: { ruc: true, businessName: true } } },
      orderBy: [{ issueDate: 'asc' }, { series: 'asc' }, { number: 'asc' }],
    });

    return invoices.map((inv) => {
      if (!inv.customer.ruc) {
        issues.push({
          severity: 'error',
          bookCode: CONTABILIDAD_PLE_BOOK_CODE.REGISTRO_VENTAS,
          code: 'MISSING_RUC',
          message: `Comprobante ${inv.series}-${inv.number} sin RUC cliente`,
        });
      }
      return pleJoin([
        'M',
        pleFormatDate(inv.issueDate.toISOString().slice(0, 10)),
        inv.documentType,
        inv.series,
        inv.number,
        inv.customer.ruc,
        inv.customer.businessName,
        inv.taxAffectation,
        pleFormatAmount(inv.taxableBase),
        pleFormatAmount(inv.igvAmount),
        pleFormatAmount(inv.totalAmount),
        inv.status,
      ]);
    });
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
        pleFormatDate(mov.movementDate.toISOString().slice(0, 10)),
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
}
