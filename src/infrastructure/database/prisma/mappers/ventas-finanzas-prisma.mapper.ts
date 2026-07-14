import { startOfDayLima, startOfTodayLima } from '@domain/utils/peru-date.util';

export function deriveBuyerPaymentDisplayStatus(row: {
  status: string;
  dueDate: Date;
  paidAt: Date | null;
}): 'PENDING' | 'PAID' | 'OVERDUE' {
  if (row.status === 'PAID' || row.paidAt) return 'PAID';
  const due = startOfDayLima(row.dueDate);
  const today = startOfTodayLima();
  if (due < today) return 'OVERDUE';
  return 'PENDING';
}
