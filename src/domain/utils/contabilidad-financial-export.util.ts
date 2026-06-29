import ExcelJS from 'exceljs';
import type { BalanceSheetDto, IncomeStatementDto } from '@domain/repositories/contabilidad-financial.repository';
import type { TrialBalanceDto } from '@domain/repositories/contabilidad-reports.repository';

export type FinancialExportType = 'balance-sheet' | 'income-statement' | 'trial-balance';

export async function buildFinancialStatementExcel(
  type: FinancialExportType,
  data: BalanceSheetDto | IncomeStatementDto | TrialBalanceDto,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Reporte');

  if (type === 'balance-sheet') {
    const bs = data as BalanceSheetDto;
    sheet.addRow(['Balance General', bs.asOfLabel]);
    sheet.addRow([]);
    sheet.addRow(['ACTIVO', 'Monto', 'Periodo anterior']);
    for (const line of bs.assets.lines) {
      sheet.addRow([`${line.accountCode} ${line.accountName}`, line.amount, line.priorAmount ?? '']);
    }
    sheet.addRow(['Total activo', bs.assets.total, '']);
    sheet.addRow([]);
    sheet.addRow(['PASIVO', 'Monto', 'Periodo anterior']);
    for (const line of bs.liabilities.lines) {
      sheet.addRow([`${line.accountCode} ${line.accountName}`, line.amount, line.priorAmount ?? '']);
    }
    sheet.addRow(['Total pasivo', bs.liabilities.total, '']);
    sheet.addRow([]);
    sheet.addRow(['PATRIMONIO', 'Monto', 'Periodo anterior']);
    for (const line of bs.equity.lines) {
      sheet.addRow([`${line.accountCode} ${line.accountName}`, line.amount, line.priorAmount ?? '']);
    }
    sheet.addRow(['Total patrimonio + resultado', bs.equity.total, '']);
    sheet.addRow(['Pasivo + patrimonio', bs.totalLiabilitiesAndEquity, '']);
  } else if (type === 'income-statement') {
    const is = data as IncomeStatementDto;
    sheet.addRow(['Estado de Resultados', `${is.month}/${is.year}`]);
    sheet.addRow([]);
    sheet.addRow(['INGRESOS', 'Monto', 'Periodo anterior']);
    for (const line of is.income.lines) {
      sheet.addRow([`${line.accountCode} ${line.accountName}`, line.amount, line.priorAmount ?? '']);
    }
    sheet.addRow(['Total ingresos', is.income.total, '']);
    sheet.addRow([]);
    sheet.addRow(['GASTOS', 'Monto', 'Periodo anterior']);
    for (const line of is.expenses.lines) {
      sheet.addRow([`${line.accountCode} ${line.accountName}`, line.amount, line.priorAmount ?? '']);
    }
    sheet.addRow(['Total gastos', is.expenses.total, '']);
    sheet.addRow([]);
    sheet.addRow(['Utilidad neta', is.netIncome, is.priorNetIncome ?? '']);
  } else {
    const tb = data as TrialBalanceDto;
    sheet.addRow(['Balance de Comprobación', `${tb.month}/${tb.year}`]);
    sheet.addRow([]);
    sheet.addRow(['Código', 'Cuenta', 'Tipo', 'Debe', 'Haber', 'Saldo']);
    for (const line of tb.lines) {
      sheet.addRow([
        line.accountCode,
        line.accountName,
        line.accountType,
        line.totalDebit,
        line.totalCredit,
        line.balance,
      ]);
    }
    sheet.addRow([]);
    sheet.addRow(['Totales', '', '', tb.totalDebit, tb.totalCredit, '']);
  }

  sheet.columns.forEach((col) => {
    col.width = 22;
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function financialExportFileName(type: FinancialExportType, periodId: string): string {
  const prefix =
    type === 'balance-sheet'
      ? 'balance-general'
      : type === 'income-statement'
        ? 'estado-resultados'
        : 'balance-comprobacion';
  return `${prefix}-${periodId}.xlsx`;
}
