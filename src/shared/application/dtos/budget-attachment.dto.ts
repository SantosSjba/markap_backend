export type BudgetAttachmentDto = {
  id: string;
  lineItemId: string | null;
  title: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export function mapBudgetAttachment(row: {
  id: string;
  category?: string | null;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
}): BudgetAttachmentDto {
  const lineItemId =
    row.category && row.category !== 'project' ? row.category : null;
  return {
    id: row.id,
    lineItemId,
    title: row.originalFileName,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}
