import type {
  BudgetSheetDto,
  ImportedBudget,
} from '../../domain/repositories/interior-project-budget.repository';

export interface ParsedInteriorBudgetWorkbook {
  sheetName: string;
  /** `MARKAP_SPACES` (costo + utilidad por línea) | `PRIZE` (metrado × P.U.) */
  format: 'MARKAP_SPACES' | 'PRIZE';
  budget: ImportedBudget;
  /** Observaciones para el usuario (ej. parciales vacíos en el Excel) */
  warnings: string[];
}

/** Lee los Excel de presupuesto de la clienta y arma el Excel de exportación. */
export abstract class InteriorBudgetSpreadsheetPort {
  abstract parse(buffer: Buffer): ParsedInteriorBudgetWorkbook;
  abstract build(sheet: BudgetSheetDto): Promise<Buffer>;
}
