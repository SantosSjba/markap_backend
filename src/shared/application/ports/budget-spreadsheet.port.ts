export interface ParsedBudgetLineItem {
  description: string;
  budgetedCost: number;
  hasIgv: boolean;
}

export interface ParsedBudgetSection {
  name: string;
  lineItems: ParsedBudgetLineItem[];
}

export interface ParseInteriorBudgetExcelResult {
  sheetName: string;
  sections: ParsedBudgetSection[];
}

export abstract class BudgetSpreadsheetPort {
  abstract parse(buffer: Buffer): ParseInteriorBudgetExcelResult;
}
