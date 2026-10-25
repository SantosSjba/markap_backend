import type { FinancialExportType } from '../ports/financial-export.port';
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
