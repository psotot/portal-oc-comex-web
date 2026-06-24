import { apiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresInSeconds: number
}

export interface UserProfile {
  id: string
  email: string
  nombreCompleto: string
  roles: string[]
  empresas: { id: string; nombre: string }[]
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/acceso/auth/login', data).then((r) => r.data),

  me: () =>
    apiClient.get<UserProfile>('/acceso/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post('/acceso/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/acceso/auth/reset-password', { token, newPassword: password }),
}
