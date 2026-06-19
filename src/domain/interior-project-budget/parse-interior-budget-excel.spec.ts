import * as XLSX from 'xlsx';
import { parseInteriorBudgetExcel } from './parse-interior-budget-excel';

function buildWorkbookBuffer(rows: unknown[][]): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'PROYECTO HORTENSIAS');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('parseInteriorBudgetExcel', () => {
  it('detecta secciones y partidas desde hoja modelo', () => {
    const buffer = buildWorkbookBuffer([
      ['DESCRIPCIÓN', 'COSTO', 'IGV'],
      ['PRIMER NIVEL'],
      ['6 sacos de piedras blancas', 240, 0],
      ['Sala, comedor, baño'],
      ['Lámpara central del comedor', 400, 0],
    ]);

    const result = parseInteriorBudgetExcel(buffer);
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].name).toBe('PRIMER NIVEL');
    expect(result.sections[0].lineItems[0].description).toContain('piedras');
    expect(result.sections[0].lineItems[0].budgetedCost).toBe(240);
    expect(result.sections[1].lineItems[0].budgetedCost).toBe(400);
  });

  it('lanza error si no hay partidas', () => {
    const buffer = buildWorkbookBuffer([['DESCRIPCIÓN', 'COSTO'], ['TOTAL', 1000]]);
    expect(() => parseInteriorBudgetExcel(buffer)).toThrow(/No se encontraron secciones/);
  });
});
