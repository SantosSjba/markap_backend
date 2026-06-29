export const PRODUCCION_QUOTATION_REPOSITORY = Symbol('ProduccionQuotationRepository');
export const PRODUCCION_ORDER_REPOSITORY = Symbol('ProduccionOrderRepository');
export const PRODUCCION_DELIVERY_REPOSITORY = Symbol('ProduccionDeliveryRepository');

export type ProduccionQuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
export type ProduccionOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';
export type ProduccionDeliveryStatus = 'SCHEDULED' | 'DELIVERED' | 'CANCELLED';

export interface ProduccionQuotationLineDto {
  id: string;
  furnitureId: string;
  furnitureCode: string;
  furnitureName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

export interface ProduccionQuotationListItem {
  id: string;
  code: string;
  status: ProduccionQuotationStatus;
  clientId: string;
  clientName: string;
  validUntil: string | null;
  sentAt: string | null;
  linesCount: number;
  totalAmount: number;
  updatedAt: string;
}

export interface ProduccionQuotationDetail {
  id: string;
  code: string;
  status: ProduccionQuotationStatus;
  clientId: string;
  clientName: string;
  validUntil: string | null;
  sentAt: string | null;
  notes: string | null;
  lines: ProduccionQuotationLineDto[];
  totalAmount: number;
  orderId: string | null;
  updatedAt: string;
}

export interface CreateProduccionQuotationLinePayload {
  furnitureId: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
}

export interface CreateProduccionQuotationPayload {
  clientId: string;
  validUntil?: string | null;
  notes?: string | null;
  lines: CreateProduccionQuotationLinePayload[];
}

export interface UpdateProduccionQuotationPayload {
  clientId?: string;
  validUntil?: string | null;
  notes?: string | null;
  lines?: CreateProduccionQuotationLinePayload[];
}

export interface ListProduccionQuotationsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: ProduccionQuotationStatus;
  clientId?: string;
}

export interface ListProduccionQuotationsResult {
  data: ProduccionQuotationListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionOrderLineDto {
  id: string;
  furnitureId: string;
  furnitureCode: string;
  furnitureName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

export interface ProduccionOrderListItem {
  id: string;
  code: string;
  status: ProduccionOrderStatus;
  clientId: string;
  clientName: string;
  quotationId: string | null;
  quotationCode: string | null;
  workOrderId: string | null;
  workOrderCode: string | null;
  orderedAt: string;
  linesCount: number;
  totalAmount: number;
  updatedAt: string;
}

export interface ProduccionOrderDetail {
  id: string;
  code: string;
  status: ProduccionOrderStatus;
  clientId: string;
  clientName: string;
  quotationId: string | null;
  quotationCode: string | null;
  workOrderId: string | null;
  workOrderCode: string | null;
  orderedAt: string;
  notes: string | null;
  lines: ProduccionOrderLineDto[];
  totalAmount: number;
  updatedAt: string;
}

export interface CreateProduccionOrderPayload {
  clientId: string;
  quotationId?: string | null;
  orderedAt?: string;
  notes?: string | null;
  lines: CreateProduccionQuotationLinePayload[];
}

export interface UpdateProduccionOrderPayload {
  notes?: string | null;
}

export interface ListProduccionOrdersFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: ProduccionOrderStatus;
  clientId?: string;
}

export interface ListProduccionOrdersResult {
  data: ProduccionOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionDeliveryListItem {
  id: string;
  code: string;
  status: ProduccionDeliveryStatus;
  orderId: string;
  orderCode: string;
  clientName: string;
  scheduledAt: string | null;
  deliveredAt: string | null;
  recipientName: string | null;
  updatedAt: string;
}

export interface ProduccionDeliveryDetail {
  id: string;
  code: string;
  status: ProduccionDeliveryStatus;
  orderId: string;
  orderCode: string;
  clientId: string;
  clientName: string;
  scheduledAt: string | null;
  deliveredAt: string | null;
  address: string | null;
  recipientName: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface CreateProduccionDeliveryPayload {
  orderId: string;
  scheduledAt?: string | null;
  address?: string | null;
  recipientName?: string | null;
  notes?: string | null;
}

export interface UpdateProduccionDeliveryPayload {
  scheduledAt?: string | null;
  address?: string | null;
  recipientName?: string | null;
  notes?: string | null;
}

export interface ListProduccionDeliveriesFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  status?: ProduccionDeliveryStatus;
  orderId?: string;
}

export interface ListProduccionDeliveriesResult {
  data: ProduccionDeliveryListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProduccionQuotationRepository {
  list(filters: ListProduccionQuotationsFilters): Promise<ListProduccionQuotationsResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionQuotationDetail | null>;
  create(applicationId: string, payload: CreateProduccionQuotationPayload): Promise<ProduccionQuotationDetail>;
  update(id: string, payload: UpdateProduccionQuotationPayload): Promise<ProduccionQuotationDetail>;
  send(id: string): Promise<ProduccionQuotationDetail>;
  accept(id: string): Promise<ProduccionQuotationDetail>;
  reject(id: string): Promise<ProduccionQuotationDetail>;
  convertToOrder(id: string): Promise<ProduccionOrderDetail>;
  delete(id: string): Promise<void>;
}

export interface ProduccionOrderRepository {
  list(filters: ListProduccionOrdersFilters): Promise<ListProduccionOrdersResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionOrderDetail | null>;
  create(applicationId: string, payload: CreateProduccionOrderPayload): Promise<ProduccionOrderDetail>;
  update(id: string, payload: UpdateProduccionOrderPayload): Promise<ProduccionOrderDetail>;
  confirm(id: string): Promise<ProduccionOrderDetail>;
  linkWorkOrder(id: string, workOrderId: string): Promise<ProduccionOrderDetail>;
  markReady(id: string): Promise<ProduccionOrderDetail>;
  cancel(id: string): Promise<ProduccionOrderDetail>;
  delete(id: string): Promise<void>;
}

export interface ProduccionDeliveryRepository {
  list(filters: ListProduccionDeliveriesFilters): Promise<ListProduccionDeliveriesResult>;
  findById(id: string, applicationSlug?: string): Promise<ProduccionDeliveryDetail | null>;
  create(applicationId: string, payload: CreateProduccionDeliveryPayload): Promise<ProduccionDeliveryDetail>;
  update(id: string, payload: UpdateProduccionDeliveryPayload): Promise<ProduccionDeliveryDetail>;
  complete(id: string): Promise<ProduccionDeliveryDetail>;
  cancel(id: string): Promise<ProduccionDeliveryDetail>;
  delete(id: string): Promise<void>;
}
