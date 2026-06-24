import { apiClient } from './client'
import type { PagedResult } from './compras'

export interface Articulo {
  id: string
  itemCode: string
  itemName: string
  itemType: string
  unitOfMeasure: string
  active: boolean
}

export type ArticuloInput = Omit<Articulo, 'id'>

export const articulosApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<Articulo>>('/maestros/items', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Articulo>(`/maestros/items/${id}`).then(r => r.data),

  create: (data: ArticuloInput) =>
    apiClient.post<Articulo>('/maestros/items', data).then(r => r.data),

  update: (id: string, data: Partial<ArticuloInput>) =>
    apiClient.put<Articulo>(`/maestros/items/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/maestros/items/${id}`),
}
