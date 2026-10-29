export const INTERIOR_MATERIAL_SUPPLIER_REPOSITORY = Symbol(
  'InteriorMaterialSupplierRepository',
);

export interface InteriorSupplierListItem {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  linkedMaterialsCount: number;
  /** Partidas de presupuestos activos asignadas a este proveedor */
  projectItemsCount: number;
  lastPurchaseAt: string | null;
  updatedAt: string;
}

export interface InteriorSupplierCatalogLinkDto {
  id: string;
  catalogMaterialId: string;
  materialCode: string;
  materialName: string;
  category: string;
  supplierSku: string | null;
  notes: string | null;
}

export interface InteriorMaterialPurchaseDto {
  id: string;
  catalogMaterialId: string | null;
  materialCode: string | null;
  materialName: string | null;
  purchasedAt: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  invoiceRef: string | null;
  notes: string | null;
}

/** Partida de un presupuesto de proyecto comprada a este proveedor */
export interface InteriorSupplierProjectItemDto {
  rowId: string;
  description: string;
  status: string;
  cost: number | null;
  actualCost: number | null;
  paid: number;
  currency: string;
  project: { id: string; code: string; name: string };
}

export interface InteriorSupplierStats {
  total: number;
  withMaterials: number;
  withProjects: number;
  /** Compras de catálogo del mes actual, por moneda */
  purchasedThisMonth: { currency: string; amount: number }[];
}

export interface InteriorSupplierDetail {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  catalogLinks: InteriorSupplierCatalogLinkDto[];
  purchases: InteriorMaterialPurchaseDto[];
  projectItems: InteriorSupplierProjectItemDto[];
  updatedAt: string;
}

export interface CreateInteriorMaterialSupplierPayload {
  companyName: string;
  ruc: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateInteriorMaterialSupplierPayload {
  companyName?: string;
  ruc?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface RecordInteriorMaterialPurchasePayload {
  catalogMaterialId?: string | null;
  purchasedAt: Date;
  quantity: number;
  unitPrice: number;
  currency?: string;
  invoiceRef?: string | null;
  notes?: string | null;
}

export interface ListInteriorMaterialSuppliersFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
}

export interface ListInteriorMaterialSuppliersResult {
  data: InteriorSupplierListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InteriorMaterialSupplierRepository {
  list(
    filters: ListInteriorMaterialSuppliersFilters,
  ): Promise<ListInteriorMaterialSuppliersResult>;
  findById(
    id: string,
    applicationSlug?: string,
  ): Promise<InteriorSupplierDetail | null>;
  create(
    applicationId: string,
    payload: CreateInteriorMaterialSupplierPayload,
  ): Promise<InteriorSupplierDetail>;
  update(
    id: string,
    payload: UpdateInteriorMaterialSupplierPayload,
  ): Promise<InteriorSupplierDetail>;
  delete(id: string): Promise<void>;
  linkCatalogMaterial(
    supplierId: string,
    catalogMaterialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ): Promise<InteriorSupplierDetail>;
  unlinkCatalogMaterial(linkId: string): Promise<void>;
  recordPurchase(
    supplierId: string,
    payload: RecordInteriorMaterialPurchasePayload,
  ): Promise<InteriorSupplierDetail>;
  stats(applicationSlug: string): Promise<InteriorSupplierStats>;
}
