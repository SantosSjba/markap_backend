export const CONTABILIDAD_JOURNAL_STATUS = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  REVERSED: 'REVERSED',
} as const;

export type ContabilidadJournalStatus =
  (typeof CONTABILIDAD_JOURNAL_STATUS)[keyof typeof CONTABILIDAD_JOURNAL_STATUS];

export const CONTABILIDAD_JOURNAL_STATUS_LABELS: Record<ContabilidadJournalStatus, string> = {
  DRAFT: 'Borrador',
  POSTED: 'Publicado',
  REVERSED: 'Reversado',
};
