export const INTERIOR_DOCUMENT_TYPES = [
  'CONTRATO',
  'PDF',
  'RENDERIZADO',
  'PLANO',
  'FACTURA',
  'ACTA',
] as const;

export type InteriorDocumentType = (typeof INTERIOR_DOCUMENT_TYPES)[number];

export interface InteriorProjectDocumentListItem {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  docType: string;
  title: string;
  fileUrl: string | null;
  createdAt: string;
}

export interface ListInteriorProjectDocumentsFilters {
  applicationSlug: string;
  docType: InteriorDocumentType;
  page: number;
  limit: number;
  search?: string;
  projectId?: string;
}

export interface ListInteriorProjectDocumentsResult {
  data: InteriorProjectDocumentListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateInteriorProjectDocumentData {
  applicationSlug: string;
  projectId: string;
  docType: InteriorDocumentType;
  title: string;
  fileUrl?: string | null;
}

export interface UpdateInteriorProjectDocumentData {
  title?: string;
  fileUrl?: string | null;
  docType?: InteriorDocumentType;
}

export interface InteriorProjectDocumentRepository {
  findMany(filters: ListInteriorProjectDocumentsFilters): Promise<ListInteriorProjectDocumentsResult>;
  create(data: CreateInteriorProjectDocumentData): Promise<InteriorProjectDocumentListItem | null>;
  update(
    id: string,
    applicationSlug: string,
    data: UpdateInteriorProjectDocumentData,
  ): Promise<InteriorProjectDocumentListItem | null>;
  delete(id: string, applicationSlug: string): Promise<boolean>;
}

export const INTERIOR_PROJECT_DOCUMENT_REPOSITORY = Symbol('InteriorProjectDocumentRepository');
