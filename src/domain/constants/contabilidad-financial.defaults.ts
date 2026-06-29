import { CONTABILIDAD_ACCOUNT_TYPES } from './contabilidad-pcge.defaults';

export const CONTABILIDAD_FINANCIAL_APP_SLUG = 'contabilidad';

export type ClosingCheckStatus = 'ok' | 'warning' | 'error';

export const CLOSING_CHECK_IDS = {
  PERIOD_OPEN: 'period_open',
  NO_DRAFT_ENTRIES: 'no_draft_entries',
  NO_UNBALANCED: 'no_unbalanced',
  TRIAL_BALANCE: 'trial_balance',
  BANK_RECONCILIATION: 'bank_reconciliation',
} as const;

export function accountBalanceFromTotals(
  accountType: string,
  totalDebit: number,
  totalCredit: number,
): number {
  const d = totalDebit;
  const c = totalCredit;
  if (
    accountType === CONTABILIDAD_ACCOUNT_TYPES.ASSET ||
    accountType === CONTABILIDAD_ACCOUNT_TYPES.EXPENSE
  ) {
    return d - c;
  }
  return c - d;
}

export const CONTABILIDAD_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
};
