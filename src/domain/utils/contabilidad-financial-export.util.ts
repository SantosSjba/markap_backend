import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;
import type {
  BalanceSheetDto,
  CashFlowStatementDto,
  IncomeStatementDto,
} from '@domain/repositories/contabilidad-financial.repository';
import type { TrialBalanceDto } from '@domain/repositories/contabilidad-reports.repository';

export type FinancialExportType =
  | 'balance-sheet'
  | 'income-statement'
  | 'trial-balance'
  | 'cash-flow';

export interface FinancialExportHeader {
  ruc: string;
  legalName: string;
}

type ExportData = BalanceSheetDto | IncomeStatementDto | TrialBalanceDto | CashFlowStatementDto;

const EXPORT_PREFIX: Record<FinancialExportType, string> = {
  'balance-sheet': 'balance-general',
  'income-statement': 'estado-resultados',
  'trial-balance': 'balance-comprobacion',
  'cash-flow': 'flujo-efectivo',
};

export function financialExportFileName(
  type: FinancialExportType,
  periodId: string,
  ext: 'xlsx' | 'pdf',
): string {
  return `${EXPORT_PREFIX[type]}-${periodId}.${ext}`;
}

function exportTitle(type: FinancialExportType): string {
  switch (type) {
    case 'balance-sheet':
      return 'Balance General';
    case 'income-statement':
      return 'Estado de Resultados';
    case 'trial-balance':
      return 'Balance de Comprobación';
    case 'cash-flow':
      return 'Estado de Flujo de Efectivo';
  }
}

function periodLabel(data: ExportData): string {
  if ('asOfLabel' in data) return data.asOfLabel;
  if ('month' in data && 'year' in data) return `${String(data.month).padStart(2, '0')}/${data.year}`;
  return '';
}

function addCashFlowExcel(sheet: ExcelJS.Worksheet, cf: CashFlowStatementDto) {
  sheet.addRow(['Estado de Flujo de Efectivo', `${cf.month}/${cf.year}`, 'Método indirecto']);
  sheet.addRow([]);
  const sections: [string, CashFlowStatementDto['operating']][] = [
    ['ACTIVIDADES DE OPERACIÓN', cf.operating],
    ['ACTIVIDADES DE INVERSIÓN', cf.investing],
    ['ACTIVIDADES DE FINANCIAMIENTO', cf.financing],
  ];
  for (const [title, lines] of sections) {
    sheet.addRow([title, 'Monto', 'Periodo anterior']);
    for (const line of lines) {
      sheet.addRow([line.label, line.amount, line.priorAmount ?? '']);
    }
    sheet.addRow([]);
  }
  sheet.addRow(['Variación neta de efectivo', cf.netCashChange, cf.priorNetCashChange ?? '']);
  sheet.addRow(['Ingresos tesorería', cf.treasuryInTotal, '']);
  sheet.addRow(['Egresos tesorería', cf.treasuryOutTotal, '']);
}

export async function buildFinancialStatementExcel(
  type: FinancialExportType,
  data: ExportData,
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
  } else if (type === 'cash-flow') {
    addCashFlowExcel(sheet, data as CashFlowStatementDto);
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

function ensurePdfSpace(doc: PdfDoc, minBottom = 60) {
  if (doc.y > doc.page.height - minBottom) doc.addPage();
}

function writePdfHeader(doc: PdfDoc, header: FinancialExportHeader, type: FinancialExportType, subtitle: string) {
  doc.fontSize(16).font('Helvetica-Bold').text(header.legalName, { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(`RUC: ${header.ruc}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(13).font('Helvetica-Bold').text(exportTitle(type), { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(subtitle, { align: 'center' });
  doc.moveDown(1);
}

function writePdfSectionTitle(doc: PdfDoc, title: string) {
  ensurePdfSpace(doc, 80);
  doc.fontSize(11).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);
}

function writePdfAccountLines(
  doc: PdfDoc,
  lines: { accountCode: string; accountName: string; amount: string; priorAmount?: string | null }[],
  totalLabel: string,
  total: string,
) {
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Cuenta', 50, doc.y, { continued: true, width: 260 });
  doc.text('Monto', 320, doc.y, { continued: true, width: 90, align: 'right' });
  doc.text('Anterior', 420, doc.y, { width: 90, align: 'right' });
  doc.moveDown(0.4);

  doc.font('Helvetica');
  for (const line of lines) {
    ensurePdfSpace(doc);
    const label = `${line.accountCode} ${line.accountName}`;
    doc.text(label, 50, doc.y, { continued: true, width: 260 });
    doc.text(line.amount, 320, doc.y, { continued: true, width: 90, align: 'right' });
    doc.text(line.priorAmount ?? '—', 420, doc.y, { width: 90, align: 'right' });
    doc.moveDown(0.2);
  }
  ensurePdfSpace(doc);
  doc.font('Helvetica-Bold');
  doc.text(totalLabel, 50, doc.y, { continued: true, width: 260 });
  doc.text(total, 320, doc.y, { width: 90, align: 'right' });
  doc.moveDown(0.8);
}

function writePdfCashFlowSection(doc: PdfDoc, title: string, lines: CashFlowStatementDto['operating']) {
  writePdfSectionTitle(doc, title);
  doc.fontSize(9).font('Helvetica');
  for (const line of lines) {
    ensurePdfSpace(doc);
    doc.text(line.label, 50, doc.y, { continued: true, width: 300 });
    doc.text(line.amount, 360, doc.y, { continued: true, width: 80, align: 'right' });
    doc.text(line.priorAmount ?? '—', 450, doc.y, { width: 80, align: 'right' });
    doc.moveDown(0.2);
  }
  doc.moveDown(0.5);
}

export function buildFinancialStatementPdf(
  type: FinancialExportType,
  data: ExportData,
  header: FinancialExportHeader,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    writePdfHeader(doc, header, type, periodLabel(data));

    if (type === 'balance-sheet') {
      const bs = data as BalanceSheetDto;
      writePdfSectionTitle(doc, 'ACTIVO');
      writePdfAccountLines(doc, bs.assets.lines, 'Total activo', bs.assets.total);
      writePdfSectionTitle(doc, 'PASIVO');
      writePdfAccountLines(doc, bs.liabilities.lines, 'Total pasivo', bs.liabilities.total);
      writePdfSectionTitle(doc, 'PATRIMONIO');
      writePdfAccountLines(doc, bs.equity.lines, 'Total patrimonio', bs.equity.total);
      ensurePdfSpace(doc);
      doc.font('Helvetica-Bold').text(`Pasivo + patrimonio: ${bs.totalLiabilitiesAndEquity}`);
    } else if (type === 'income-statement') {
      const is = data as IncomeStatementDto;
      writePdfSectionTitle(doc, 'INGRESOS');
      writePdfAccountLines(doc, is.income.lines, 'Total ingresos', is.income.total);
      writePdfSectionTitle(doc, 'GASTOS');
      writePdfAccountLines(doc, is.expenses.lines, 'Total gastos', is.expenses.total);
      ensurePdfSpace(doc);
      doc.font('Helvetica-Bold').text(`Utilidad neta: ${is.netIncome}`);
      if (is.priorNetIncome) doc.font('Helvetica').text(`Periodo anterior: ${is.priorNetIncome}`);
    } else if (type === 'cash-flow') {
      const cf = data as CashFlowStatementDto;
      writePdfCashFlowSection(doc, 'Actividades de operación', cf.operating);
      writePdfCashFlowSection(doc, 'Actividades de inversión', cf.investing);
      writePdfCashFlowSection(doc, 'Actividades de financiamiento', cf.financing);
      ensurePdfSpace(doc);
      doc.font('Helvetica-Bold').text(`Variación neta de efectivo: ${cf.netCashChange}`);
    } else {
      const tb = data as TrialBalanceDto;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Código', 50, doc.y, { continued: true, width: 55 });
      doc.text('Cuenta', 110, doc.y, { continued: true, width: 150 });
      doc.text('Debe', 270, doc.y, { continued: true, width: 70, align: 'right' });
      doc.text('Haber', 345, doc.y, { continued: true, width: 70, align: 'right' });
      doc.text('Saldo', 420, doc.y, { width: 70, align: 'right' });
      doc.moveDown(0.4);
      doc.font('Helvetica');
      for (const line of tb.lines) {
        ensurePdfSpace(doc);
        doc.text(line.accountCode, 50, doc.y, { continued: true, width: 55 });
        doc.text(line.accountName, 110, doc.y, { continued: true, width: 150 });
        doc.text(line.totalDebit, 270, doc.y, { continued: true, width: 70, align: 'right' });
        doc.text(line.totalCredit, 345, doc.y, { continued: true, width: 70, align: 'right' });
        doc.text(line.balance, 420, doc.y, { width: 70, align: 'right' });
        doc.moveDown(0.15);
      }
      ensurePdfSpace(doc);
      doc.font('Helvetica-Bold');
      doc.text('Totales', 50, doc.y, { continued: true, width: 210 });
      doc.text(tb.totalDebit, 270, doc.y, { continued: true, width: 70, align: 'right' });
      doc.text(tb.totalCredit, 345, doc.y, { width: 70, align: 'right' });
    }

    doc.end();
  });
}
