import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PurchaseOrdersPage } from '@/features/compras/PurchaseOrdersPage'
import { NuevaOrdenPage } from '@/features/compras/NuevaOrdenPage'
import { ProveedoresPage } from '@/features/proveedores/ProveedoresPage'
import { ArticulosPage } from '@/features/articulos/ArticulosPage'
import { UsuariosPage } from '@/features/usuarios/UsuariosPage'
import { RolesPage } from '@/features/roles/RolesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { MaestroPage } from '@/features/maestros/MaestroPage'
import {
  analystsConfig,
  companiesConfig,
  containerTypesConfig,
  countriesConfig,
  currenciesConfig,
  customsBrokersConfig,
  documentTypesConfig,
  forwardersConfig,
  incotermsConfig,
  insuranceCompaniesConfig,
  packageTypesConfig,
  paymentTermsConfig,
  portsConfig,
  shippingLinesConfig,
  tariffCodesConfig,
  transportModesConfig,
  unitsOfMeasureConfig,
  warehousesConfig,
} from '@/features/maestros/configs'

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

          // Compras
          { path: 'ordenes-compra', element: <PurchaseOrdersPage /> },
          { path: 'ordenes-compra/nueva', element: <NuevaOrdenPage /> },

          // Maestros — artículos y proveedores mantienen su página específica
          { path: 'maestros/articulos', element: <ArticulosPage /> },
          { path: 'maestros/proveedores', element: <ProveedoresPage /> },

          // Maestros genéricos
          { path: 'maestros/paises', element: <MaestroPage config={countriesConfig} /> },
          { path: 'maestros/monedas', element: <MaestroPage config={currenciesConfig} /> },
          { path: 'maestros/unidades-medida', element: <MaestroPage config={unitsOfMeasureConfig} /> },
          { path: 'maestros/tipos-contenedor', element: <MaestroPage config={containerTypesConfig} /> },
          { path: 'maestros/tipos-embalaje', element: <MaestroPage config={packageTypesConfig} /> },
          { path: 'maestros/tipos-documento', element: <MaestroPage config={documentTypesConfig} /> },
          { path: 'maestros/modos-transporte', element: <MaestroPage config={transportModesConfig} /> },
          { path: 'maestros/incoterms', element: <MaestroPage config={incotermsConfig} /> },
          { path: 'maestros/terminos-pago', element: <MaestroPage config={paymentTermsConfig} /> },
          { path: 'maestros/puertos', element: <MaestroPage config={portsConfig} /> },
          { path: 'maestros/lineas-navieras', element: <MaestroPage config={shippingLinesConfig} /> },
          { path: 'maestros/bodegas', element: <MaestroPage config={warehousesConfig} /> },
          { path: 'maestros/codigos-arancelarios', element: <MaestroPage config={tariffCodesConfig} /> },

          // Terceros
          { path: 'terceros/empresas', element: <MaestroPage config={companiesConfig} /> },
          { path: 'terceros/analistas', element: <MaestroPage config={analystsConfig} /> },
          { path: 'terceros/aduanas', element: <MaestroPage config={customsBrokersConfig} /> },
          { path: 'terceros/forwarders', element: <MaestroPage config={forwardersConfig} /> },
          { path: 'terceros/aseguradoras', element: <MaestroPage config={insuranceCompaniesConfig} /> },

          // Administración
          { path: 'admin/usuarios', element: <UsuariosPage /> },
          { path: 'admin/roles', element: <RolesPage /> },
          { path: 'admin/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
