export const ARQUITECTURA_DOCUMENT_TYPES = [
  'CONTRATO',
  'PLANO',
  'RENDER',
  'MEMORIA_DESCRIPTIVA',
  'FACTURA',
  'ACTA',
] as const;

export type ArquitecturaDocumentType = (typeof ARQUITECTURA_DOCUMENT_TYPES)[number];

export interface ArquitecturaProjectDocumentListItem {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  docType: string;
  title: string;
  fileUrl: string | null;
  archivoId: string | null;
  downloadUrl?: string | null;
  createdAt: string;
}

export interface ListArquitecturaProjectDocumentsFilters {
  applicationSlug: string;
  docType: ArquitecturaDocumentType;
  page: number;
  limit: number;
  search?: string;
  projectId?: string;
}

export interface ListArquitecturaProjectDocumentsResult {
  data: ArquitecturaProjectDocumentListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateArquitecturaProjectDocumentData {
  applicationSlug: string;
  projectId: string;
  docType: ArquitecturaDocumentType;
  title: string;
  fileUrl?: string | null;
  archivoId?: string | null;
}

export interface UpdateArquitecturaProjectDocumentData {
  title?: string;
  fileUrl?: string | null;
  archivoId?: string | null;
  docType?: ArquitecturaDocumentType;
}

export interface ArquitecturaProjectDocumentRepository {
  findMany(
    filters: ListArquitecturaProjectDocumentsFilters,
  ): Promise<ListArquitecturaProjectDocumentsResult>;
  create(
    data: CreateArquitecturaProjectDocumentData,
  ): Promise<ArquitecturaProjectDocumentListItem | null>;
  update(
    id: string,
    applicationSlug: string,
    data: UpdateArquitecturaProjectDocumentData,
  ): Promise<ArquitecturaProjectDocumentListItem | null>;
  delete(id: string, applicationSlug: string): Promise<boolean>;
}

export const ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY = Symbol('ArquitecturaProjectDocumentRepository');
