import { apiClient } from './client'

export interface PurchaseOrder {
  id: string
  documentStatus: string
  cardCode: string
  cardName: string
  docDate: string
  docCurrency: string
  companyId: string
}

export interface PurchaseOrderListParams {
  page?: number
  pageSize?: number
  cardCode?: string
  status?: string
  docDateFrom?: string
  docDateTo?: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface CreateOrderLine {
  lineNum: number
  itemCode: string
  itemDescription: string
  quantity: number
  price: number
  currency: string
  discountPercent: number
  warehouseCode: string
  lineStatus: 'bost_Open' | 'bost_Close'
  barCode?: string | null
  uomCode?: string | null
  containerCode?: string | null
  containerSize?: string | null
  productType?: string | null
  netWeight?: number | null
  grossWeight?: number | null
  productCategory?: string | null
}

export interface CreateOrderPayload {
  cardCode: string
  cardName: string
  docDate: string
  docDueDate: string
  docCurrency: string
  docRate: number
  series: number
  documentStatus: string
  partialSupply: boolean
  confirmed: boolean
  lines: CreateOrderLine[]
  comments?: string | null
  reference1?: string | null
  numAtCard?: string | null
  incoterm?: string | null
  comexAnalyst?: string | null
  forwarderName?: string | null
  departurePortCode?: string | null
  arrivalPortCode?: string | null
  recipientCountryCode?: string | null
  cargoReadyDate?: string | null
  estimatedArrivalDate?: string | null
  warehouseArrivalDate?: string | null
  bookingNumber?: string | null
  vesselName?: string | null
  billOfLadingNumber?: string | null
  originDepartureDate?: string | null
  actualDepartureDate?: string | null
}

export const comprasApi = {
  listOrders: (params?: PurchaseOrderListParams) =>
    apiClient
      .get<PagedResult<PurchaseOrder>>('/compras/ordenes-compra', { params })
      .then((r) => r.data),

  getOrder: (id: string) =>
    apiClient.get<PurchaseOrder>(`/compras/ordenes-compra/${id}`).then((r) => r.data),

  createOrder: (data: CreateOrderPayload) =>
    apiClient.post<PurchaseOrder>('/compras/ordenes-compra', data).then((r) => r.data),

  updateOrder: (id: string, data: Partial<PurchaseOrder>) =>
    apiClient.patch<PurchaseOrder>(`/compras/ordenes-compra/${id}`, data).then((r) => r.data),

  submitOrder: (id: string) =>
    apiClient.post(`/compras/ordenes-compra/${id}/submit`).then((r) => r.data),

  approveOrder: (id: string) =>
    apiClient.post(`/compras/ordenes-compra/${id}/approve`).then((r) => r.data),

  rejectOrder: (id: string, comment: string) =>
    apiClient.post(`/compras/ordenes-compra/${id}/reject`, { comment }).then((r) => r.data),

  getApprovalQueue: (params?: { page?: number; pageSize?: number }) =>
    apiClient
      .get<PagedResult<PurchaseOrder>>('/compras/approval-queue', { params })
      .then((r) => r.data),
}
