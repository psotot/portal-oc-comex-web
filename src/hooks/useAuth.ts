import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, type LoginRequest } from '@/api/auth'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  })
}

export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ accessToken }) => {
      localStorage.setItem('access_token', accessToken)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return () => {
    localStorage.removeItem('access_token')
    queryClient.clear()
    navigate('/login')
  }
}
