import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  InteriorBudgetSpreadsheetPort,
  type ParsedInteriorBudgetWorkbook,
} from '../../application/ports/interior-budget-spreadsheet.port';
import type { BudgetSheetDto } from '../../domain/repositories/interior-project-budget.repository';
import { pickBestSheet } from './interior-budget-excel.parser';

const MONEY = '#,##0.00';
const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: 'US$',
  EUR: '€',
};

@Injectable()
export class InteriorBudgetSpreadsheetAdapter extends InteriorBudgetSpreadsheetPort {
  parse(buffer: Buffer): ParsedInteriorBudgetWorkbook {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('El archivo no es un Excel válido');
    }
    const parsed = pickBestSheet(
      workbook.SheetNames.map((name) => ({
        name,
        rows: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
          header: 1,
          raw: true,
          defval: null,
        }),
      })),
    );
    if (!parsed) {
      throw new BadRequestException(
        'No se encontraron partidas: el Excel debe tener una fila de encabezado con «Descripción»',
      );
    }
    return parsed;
  }

  /** Excel del presupuesto: misma estructura de la hoja (sangría por nivel) y totales al pie */
  async build(sheet: BudgetSheetDto): Promise<Buffer> {
    const { budget, totals, project } = sheet;
    const perLine = budget.marginMode === 'PER_LINE';
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Presupuesto', {
      views: [{ state: 'frozen', ySplit: 5 }],
    });
    ws.columns = [
      { key: 'code', width: 10 },
      { key: 'description', width: 60 },
      { key: 'unit', width: 8 },
      { key: 'quantity', width: 10 },
      { key: 'unitPrice', width: 12 },
      { key: 'cost', width: 14 },
      { key: 'actualCost', width: 14 },
      { key: 'utility', width: 12 },
      { key: 'igv', width: 12 },
      { key: 'price', width: 14 },
    ];
    ws.addRow([
      `Presupuesto${budget.number ? ` N° ${budget.number}` : ''} — ${project.name}`,
    ]).font = { bold: true, size: 13 };
    ws.addRow([
      `${project.code} · versión ${budget.version}${budget.executionTerm ? ` · Plazo: ${budget.executionTerm}` : ''}`,
    ]);
    ws.addRow([
      `Moneda: ${budget.currency}${budget.exchangeRate ? ` · TC ${budget.exchangeRate}` : ''}`,
    ]);
    ws.addRow([]);
    const head = ws.addRow([
      'Ítem',
      'Descripción',
      'Und',
      'Metrado',
      'P.U.',
      'Costo',
      'Costo real',
      'Utilidad',
      'IGV',
      perLine ? 'Precio' : 'Parcial',
    ]);
    head.font = { bold: true };
    head.eachCell((c) => (c.border = { bottom: { style: 'thin' } }));

    for (const r of sheet.rows) {
      const row = ws.addRow({
        code: r.code,
        description: r.description,
        unit: r.kind === 'ITEM' ? r.unit : null,
        quantity: r.kind === 'ITEM' ? r.quantity : null,
        unitPrice: r.kind === 'ITEM' ? r.unitPrice : null,
        cost: r.kind === 'NOTE' ? null : r.cost,
        actualCost: r.kind === 'ITEM' ? r.actualCost : null,
        utility: r.kind === 'NOTE' || !perLine ? null : r.utility,
        igv: r.kind === 'NOTE' || !r.igv ? null : r.igv,
        price: r.kind === 'NOTE' ? null : perLine ? r.price : r.cost,
      });
      row.getCell('description').alignment = {
        indent: r.depth * 2,
        wrapText: true,
      };
      if (r.kind === 'GROUP') row.font = { bold: true };
      if (r.kind === 'NOTE')
        row.font = { italic: true, color: { argb: 'FF666666' } };
      for (const key of [
        'unitPrice',
        'cost',
        'actualCost',
        'utility',
        'igv',
        'price',
      ]) {
        row.getCell(key).numFmt = MONEY;
      }
    }

    ws.addRow([]);
    const symbol = CURRENCY_SYMBOLS[budget.currency] ?? budget.currency;
    const lines: [string, number][] = [
      ['Costo directo', totals.directCost],
      [perLine ? 'Utilidad' : `Utilidad ${budget.utilityPct}%`, totals.utility],
      ...(totals.overhead
        ? [
            [`Gastos generales ${budget.overheadPct}%`, totals.overhead] as [
              string,
              number,
            ],
          ]
        : []),
      ['Subtotal', totals.subtotal],
      ...(budget.igvMode === 'NONE'
        ? []
        : [['IGV', totals.igv] as [string, number]]),
      [`Total ${symbol}`, totals.total],
      ...(totals.equivalent
        ? [
            [
              `Equivalente ${CURRENCY_SYMBOLS[totals.equivalent.currency] ?? totals.equivalent.currency}`,
              totals.equivalent.amount,
            ] as [string, number],
          ]
        : []),
    ];
    for (const [label, value] of lines) {
      const row = ws.addRow({ description: label, price: value });
      row.getCell('description').alignment = { horizontal: 'right' };
      row.getCell('price').numFmt = MONEY;
      if (label.startsWith('Total')) row.font = { bold: true };
    }
    if (budget.igvMode === 'NONE')
      ws.addRow({ description: 'Los montos no incluyen IGV.' });

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
