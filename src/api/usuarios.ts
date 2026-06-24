import { apiClient } from './client'
import type { PagedResult } from './compras'

export interface Usuario {
  id: string
  email: string
  nombreCompleto: string
  active: boolean
  createdAt: string
  version: number
}

export interface UsuarioRol {
  id: string
  usuarioId: string
  rolId: string
  nivel: string
  createdAt: string
}

export interface AccesoPerfil {
  usuarioId: string
  email: string
  roles: UsuarioRol[]
  empresaIds: string[]
}

export const usuariosApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<PagedResult<Usuario>>('/acceso/usuarios', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Usuario>(`/acceso/usuarios/${id}`).then(r => r.data),

  create: (data: { email: string; nombreCompleto: string }) =>
    apiClient.post<Usuario>('/acceso/usuarios', data).then(r => r.data),

  update: (id: string, data: { nombreCompleto: string; version: number }) =>
    apiClient.put<Usuario>(`/acceso/usuarios/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/acceso/usuarios/${id}`),

  activate: (id: string) =>
    apiClient.patch(`/acceso/usuarios/${id}/activate`),

  getAcceso: (id: string) =>
    apiClient.get<AccesoPerfil>(`/acceso/usuarios/${id}/acceso`).then(r => r.data),

  assignRol: (id: string, data: { rolId: string; nivel: string }) =>
    apiClient.post<UsuarioRol>(`/acceso/usuarios/${id}/roles`, data).then(r => r.data),

  removeRol: (id: string, asignacionId: string) =>
    apiClient.delete(`/acceso/usuarios/${id}/roles/${asignacionId}`),

  assignEmpresa: (id: string, empresaId: string) =>
    apiClient.post(`/acceso/usuarios/${id}/empresas`, { empresaId }).then(r => r.data),

  removeEmpresa: (id: string, empresaId: string) =>
    apiClient.delete(`/acceso/usuarios/${id}/empresas/${empresaId}`),
}
