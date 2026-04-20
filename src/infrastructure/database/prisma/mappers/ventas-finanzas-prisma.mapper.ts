export function startOfLocalDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function deriveBuyerPaymentDisplayStatus(row: {
  status: string;
  dueDate: Date;
  paidAt: Date | null;
}): 'PENDING' | 'PAID' | 'OVERDUE' {
  if (row.status === 'PAID' || row.paidAt) return 'PAID';
  const due = new Date(row.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = startOfLocalDay();
  if (due < today) return 'OVERDUE';
  return 'PENDING';
}
