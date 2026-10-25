import { Injectable } from '@nestjs/common';
import { BudgetSpreadsheetPort } from '../../application/ports/budget-spreadsheet.port';
import { parseInteriorBudgetExcel } from './parse-interior-budget-excel';
@Injectable()
export class BudgetSpreadsheetAdapter extends BudgetSpreadsheetPort {
  parse(buffer: Buffer) {
    return parseInteriorBudgetExcel(buffer);
  }
}
