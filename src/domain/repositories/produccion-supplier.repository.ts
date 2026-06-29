export const PRODUCCION_SUPPLIER_REPOSITORY = Symbol('ProduccionSupplierRepository');

export interface ProduccionSupplierListItem {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  linkedMaterialsCount: number;
  updatedAt: string;
}

export interface ProduccionSupplierMaterialLinkDto {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  category: string;
  supplierSku: string | null;
  notes: string | null;
}

export interface ProduccionSupplierDetail {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  notes: string | null;
  materialLinks: ProduccionSupplierMaterialLinkDto[];
  updatedAt: string;
}

export interface CreateProduccionSupplierPayload {
  companyName: string;
  ruc: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

export interface UpdateProduccionSupplierPayload {
  companyName?: string;
  ruc?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

export interface ListProduccionSuppliersFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface ListProduccionSuppliersResult {
  data: ProduccionSupplierListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionSupplierRepository {
  list(filters: ListProduccionSuppliersFilters): Promise<ListProduccionSuppliersResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionSupplierDetail | null>;
  create(applicationId: string, payload: CreateProduccionSupplierPayload): Promise<ProduccionSupplierDetail>;
  update(id: string, payload: UpdateProduccionSupplierPayload): Promise<ProduccionSupplierDetail>;
  delete(id: string): Promise<void>;
  linkMaterial(
    supplierId: string,
    materialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ): Promise<ProduccionSupplierDetail>;
  unlinkMaterial(linkId: string): Promise<void>;
}
