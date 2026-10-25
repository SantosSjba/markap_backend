import { Injectable } from '@nestjs/common';
import {
  FinancialExportPort,
  type FinancialExportData,
  type FinancialExportHeader,
  type FinancialExportType,
} from '../../application/ports/financial-export.port';
import {
  buildFinancialStatementExcel,
  buildFinancialStatementPdf,
} from './contabilidad-financial-export.util';
@Injectable()
export class FinancialExportAdapter extends FinancialExportPort {
  excel(type: FinancialExportType, data: FinancialExportData) {
    return buildFinancialStatementExcel(type, data);
  }
  pdf(
    type: FinancialExportType,
    data: FinancialExportData,
    header: FinancialExportHeader,
  ) {
    return buildFinancialStatementPdf(type, data, header);
  }
}
