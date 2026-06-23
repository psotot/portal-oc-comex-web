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
  totalCount: number
  page: number
  pageSize: number
}

export const comprasApi = {
  listOrders: (params?: PurchaseOrderListParams) =>
    apiClient
      .get<PagedResult<PurchaseOrder>>('/compras/ordenes-compra', { params })
      .then((r) => r.data),

  getOrder: (id: string) =>
    apiClient.get<PurchaseOrder>(`/compras/ordenes-compra/${id}`).then((r) => r.data),

  createOrder: (data: Partial<PurchaseOrder>) =>
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
