import { apiClient } from './client'
import type { PagedResult } from './compras'

export type ParameterDataType = 'Integer' | 'Decimal' | 'Boolean' | 'String' | 'StringList'
export type ChangeType = 'Update' | 'Reset'

export interface ConfigurationParameter {
  id: string
  key: string
  category: string
  dataType: ParameterDataType
  value: string
  defaultValue: string
  allowedMin: string | null
  allowedMax: string | null
  description: string
  isOverridden: boolean
  createdAt: string
  createdBy: string | null
  updatedAt: string
  updatedBy: string | null
  version: number
}

export interface ChangeRecord {
  id: string
  changeType: ChangeType
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
}

export const settingsApi = {
  list: (params?: { category?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PagedResult<ConfigurationParameter>>('/configuracion/settings', { params }).then(r => r.data),

  get: (key: string) =>
    apiClient.get<ConfigurationParameter>(`/configuracion/settings/${key}`).then(r => r.data),

  update: (key: string, value: string) =>
    apiClient.put<ConfigurationParameter>(`/configuracion/settings/${key}/value`, { value }).then(r => r.data),

  reset: (key: string) =>
    apiClient.post<ConfigurationParameter>(`/configuracion/settings/${key}/reset`).then(r => r.data),

  history: (key: string, params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PagedResult<ChangeRecord>>(`/configuracion/settings/${key}/history`, { params }).then(r => r.data),
}
