import { apiClient } from './client'
import type { PagedResult } from './compras'

export interface Proveedor {
  id: string
  cardCode: string
  cardName: string
  rut: string
  email: string
  phone: string
  currency: string
  active: boolean
}

export type ProveedorInput = Omit<Proveedor, 'id'>

export const proveedoresApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<Proveedor>>('/maestros/suppliers', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Proveedor>(`/maestros/suppliers/${id}`).then(r => r.data),

  create: (data: ProveedorInput) =>
    apiClient.post<Proveedor>('/maestros/suppliers', data).then(r => r.data),

  update: (id: string, data: Partial<ProveedorInput>) =>
    apiClient.put<Proveedor>(`/maestros/suppliers/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/maestros/suppliers/${id}`),
}
