import { apiClient } from './client'
import type { PagedResult } from './compras'

export interface Rol {
  id: string
  nombre: string
  descripcion?: string
  active: boolean
  version: number
}

export const rolesApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<Rol>>('/acceso/roles', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Rol>(`/acceso/roles/${id}`).then(r => r.data),

  create: (data: { nombre: string; descripcion?: string }) =>
    apiClient.post<Rol>('/acceso/roles', data).then(r => r.data),

  update: (id: string, data: { descripcion?: string; version: number }) =>
    apiClient.put<Rol>(`/acceso/roles/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/acceso/roles/${id}`),

  activate: (id: string) =>
    apiClient.patch(`/acceso/roles/${id}/activate`),
}
