import type {
  BalanceSheetDto,
  CashFlowStatementDto,
  IncomeStatementDto,
} from '../../domain/repositories/contabilidad-financial.repository';
import type { TrialBalanceDto } from '../../domain/repositories/contabilidad-reports.repository';
export type FinancialExportType =
  | 'balance-sheet'
  | 'income-statement'
  | 'trial-balance'
  | 'cash-flow';

export interface FinancialExportHeader {
  ruc: string;
  legalName: string;
}

export type FinancialExportData =
  | BalanceSheetDto
  | IncomeStatementDto
  | TrialBalanceDto
  | CashFlowStatementDto;

export abstract class FinancialExportPort {
  abstract excel(
    type: FinancialExportType,
    data: FinancialExportData,
  ): Promise<Buffer>;
  abstract pdf(
    type: FinancialExportType,
    data: FinancialExportData,
    header: FinancialExportHeader,
  ): Promise<Buffer>;
}
