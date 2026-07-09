export const ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY = Symbol('ArquitecturaMaterialSupplierRepository');

export interface ArquitecturaSupplierListItem {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  linkedMaterialsCount: number;
  updatedAt: string;
}

export interface ArquitecturaSupplierCatalogLinkDto {
  id: string;
  catalogMaterialId: string;
  materialCode: string;
  materialName: string;
  category: string;
  supplierSku: string | null;
  notes: string | null;
}

export interface ArquitecturaMaterialPurchaseDto {
  id: string;
  catalogMaterialId: string | null;
  materialCode: string | null;
  materialName: string | null;
  purchasedAt: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  invoiceRef: string | null;
  notes: string | null;
}

export interface ArquitecturaSupplierDetail {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  catalogLinks: ArquitecturaSupplierCatalogLinkDto[];
  purchases: ArquitecturaMaterialPurchaseDto[];
  updatedAt: string;
}

export interface CreateArquitecturaMaterialSupplierPayload {
  companyName: string;
  ruc: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateArquitecturaMaterialSupplierPayload {
  companyName?: string;
  ruc?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface RecordArquitecturaMaterialPurchasePayload {
  catalogMaterialId?: string | null;
  purchasedAt: Date;
  quantity: number;
  unitPrice: number;
  invoiceRef?: string | null;
  notes?: string | null;
}

export interface ListArquitecturaMaterialSuppliersFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
}

export interface ListArquitecturaMaterialSuppliersResult {
  data: ArquitecturaSupplierListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ArquitecturaMaterialSupplierRepository {
  list(filters: ListArquitecturaMaterialSuppliersFilters): Promise<ListArquitecturaMaterialSuppliersResult>;
  findById(id: string, applicationSlug?: string): Promise<ArquitecturaSupplierDetail | null>;
  create(
    applicationId: string,
    payload: CreateArquitecturaMaterialSupplierPayload,
  ): Promise<ArquitecturaSupplierDetail>;
  update(id: string, payload: UpdateArquitecturaMaterialSupplierPayload): Promise<ArquitecturaSupplierDetail>;
  delete(id: string): Promise<void>;
  linkCatalogMaterial(
    supplierId: string,
    catalogMaterialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ): Promise<ArquitecturaSupplierDetail>;
  unlinkCatalogMaterial(linkId: string): Promise<void>;
  recordPurchase(
    supplierId: string,
    payload: RecordArquitecturaMaterialPurchasePayload,
  ): Promise<ArquitecturaSupplierDetail>;
}
