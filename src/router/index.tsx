import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PurchaseOrdersPage } from '@/features/compras/PurchaseOrdersPage'

function PrivateRoute() {
  const token = localStorage.getItem('access_token')
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/ordenes-compra" replace /> },
          { path: 'ordenes-compra', element: <PurchaseOrdersPage /> },
        ],
      },
    ],
  },
])
