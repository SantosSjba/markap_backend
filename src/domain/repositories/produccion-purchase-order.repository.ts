export const PRODUCCION_PURCHASE_ORDER_REPOSITORY = Symbol('ProduccionPurchaseOrderRepository');

export type ProduccionPurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface ProduccionPurchaseOrderLineDto {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProduccionPurchaseOrderListItem {
  id: string;
  code: string;
  status: ProduccionPurchaseOrderStatus;
  supplierId: string;
  supplierName: string;
  orderedAt: string;
  expectedAt: string | null;
  linesCount: number;
  totalAmount: number;
  updatedAt: string;
}

export interface ProduccionPurchaseOrderDetail {
  id: string;
  code: string;
  status: ProduccionPurchaseOrderStatus;
  supplierId: string;
  supplierName: string;
  supplierRuc: string;
  orderedAt: string;
  expectedAt: string | null;
  notes: string | null;
  lines: ProduccionPurchaseOrderLineDto[];
  totalAmount: number;
  updatedAt: string;
}

export interface CreateProduccionPurchaseOrderLinePayload {
  materialId: string;
  quantityOrdered: number;
  unitPrice: number;
}

export interface CreateProduccionPurchaseOrderPayload {
  supplierId: string;
  orderedAt?: string;
  expectedAt?: string | null;
  notes?: string | null;
  lines: CreateProduccionPurchaseOrderLinePayload[];
}

export interface UpdateProduccionPurchaseOrderPayload {
  supplierId?: string;
  orderedAt?: string;
  expectedAt?: string | null;
  notes?: string | null;
  lines?: CreateProduccionPurchaseOrderLinePayload[];
}

export interface ReceiveProduccionPurchaseOrderLinePayload {
  lineId: string;
  quantity: number;
}

export interface ReceiveProduccionPurchaseOrderPayload {
  lines: ReceiveProduccionPurchaseOrderLinePayload[];
  notes?: string | null;
}

export interface ListProduccionPurchaseOrdersFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: ProduccionPurchaseOrderStatus;
  supplierId?: string;
}

export interface ListProduccionPurchaseOrdersResult {
  data: ProduccionPurchaseOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionPurchaseOrderRepository {
  list(filters: ListProduccionPurchaseOrdersFilters): Promise<ListProduccionPurchaseOrdersResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionPurchaseOrderDetail | null>;
  create(applicationId: string, payload: CreateProduccionPurchaseOrderPayload): Promise<ProduccionPurchaseOrderDetail>;
  update(id: string, payload: UpdateProduccionPurchaseOrderPayload): Promise<ProduccionPurchaseOrderDetail>;
  send(id: string): Promise<ProduccionPurchaseOrderDetail>;
  receive(id: string, payload: ReceiveProduccionPurchaseOrderPayload): Promise<ProduccionPurchaseOrderDetail>;
  cancel(id: string): Promise<ProduccionPurchaseOrderDetail>;
  delete(id: string): Promise<void>;
}
