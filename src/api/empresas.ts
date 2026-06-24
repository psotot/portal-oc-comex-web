import { apiClient } from './client'
import type { PagedResult } from './compras'

export interface Empresa {
  id: string
  companyCode: string
  companyName: string
  rut: string
  active: boolean
}

export type EmpresaInput = Omit<Empresa, 'id'>

export const empresasApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<Empresa>>('/maestros/empresas', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Empresa>(`/maestros/empresas/${id}`).then(r => r.data),

  create: (data: EmpresaInput) =>
    apiClient.post<Empresa>('/maestros/empresas', data).then(r => r.data),

  update: (id: string, data: Partial<EmpresaInput>) =>
    apiClient.put<Empresa>(`/maestros/empresas/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/maestros/empresas/${id}`),
}
