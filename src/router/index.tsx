import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardLayout } from '@/components/DashboardLayout'
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

// ─── Lazy-loaded page components ─────────────────────────────────────────────

const PurchaseOrdersPage = lazy(() =>
  import('@/features/compras/PurchaseOrdersPage').then((m) => ({ default: m.PurchaseOrdersPage })),
)
const NuevaOrdenPage = lazy(() =>
  import('@/features/compras/NuevaOrdenPage').then((m) => ({ default: m.NuevaOrdenPage })),
)
const ProveedoresPage = lazy(() =>
  import('@/features/proveedores/ProveedoresPage').then((m) => ({ default: m.ProveedoresPage })),
)
const ArticulosPage = lazy(() =>
  import('@/features/articulos/ArticulosPage').then((m) => ({ default: m.ArticulosPage })),
)
const UsuariosPage = lazy(() =>
  import('@/features/usuarios/UsuariosPage').then((m) => ({ default: m.UsuariosPage })),
)
const RolesPage = lazy(() =>
  import('@/features/roles/RolesPage').then((m) => ({ default: m.RolesPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const MaestroPage = lazy(() =>
  import('@/features/maestros/MaestroPage').then((m) => ({ default: m.MaestroPage })),
)

// ─── Wrappers with config (lazy-friendly) ────────────────────────────────────

const Paises        = () => <MaestroPage config={countriesConfig} />
const Monedas       = () => <MaestroPage config={currenciesConfig} />
const UndsMedida    = () => <MaestroPage config={unitsOfMeasureConfig} />
const TiposConten   = () => <MaestroPage config={containerTypesConfig} />
const TiposEmbalaje = () => <MaestroPage config={packageTypesConfig} />
const TiposDoc      = () => <MaestroPage config={documentTypesConfig} />
const ModosTransp   = () => <MaestroPage config={transportModesConfig} />
const Incoterms     = () => <MaestroPage config={incotermsConfig} />
const TermsPago     = () => <MaestroPage config={paymentTermsConfig} />
const Puertos       = () => <MaestroPage config={portsConfig} />
const LineasNav     = () => <MaestroPage config={shippingLinesConfig} />
const Bodegas       = () => <MaestroPage config={warehousesConfig} />
const CodsArancel   = () => <MaestroPage config={tariffCodesConfig} />
const Empresas      = () => <MaestroPage config={companiesConfig} />
const Analistas     = () => <MaestroPage config={analystsConfig} />
const Aduanas       = () => <MaestroPage config={customsBrokersConfig} />
const Forwarders    = () => <MaestroPage config={forwardersConfig} />
const Aseguradoras  = () => <MaestroPage config={insuranceCompaniesConfig} />

// ─── Route guards ─────────────────────────────────────────────────────────────

function PrivateRoute() {
  const token = localStorage.getItem('access_token')
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

function SuspenseOutlet() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Cargando...</div>}>
      <Outlet />
    </Suspense>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

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
          {
            element: <SuspenseOutlet />,
            children: [
              // Compras
              { path: 'ordenes-compra', element: <PurchaseOrdersPage /> },
              { path: 'ordenes-compra/nueva', element: <NuevaOrdenPage /> },

              // Maestros
              { path: 'maestros/articulos', element: <ArticulosPage /> },
              { path: 'maestros/proveedores', element: <ProveedoresPage /> },
              { path: 'maestros/paises', element: <Paises /> },
              { path: 'maestros/monedas', element: <Monedas /> },
              { path: 'maestros/unidades-medida', element: <UndsMedida /> },
              { path: 'maestros/tipos-contenedor', element: <TiposConten /> },
              { path: 'maestros/tipos-embalaje', element: <TiposEmbalaje /> },
              { path: 'maestros/tipos-documento', element: <TiposDoc /> },
              { path: 'maestros/modos-transporte', element: <ModosTransp /> },
              { path: 'maestros/incoterms', element: <Incoterms /> },
              { path: 'maestros/terminos-pago', element: <TermsPago /> },
              { path: 'maestros/puertos', element: <Puertos /> },
              { path: 'maestros/lineas-navieras', element: <LineasNav /> },
              { path: 'maestros/bodegas', element: <Bodegas /> },
              { path: 'maestros/codigos-arancelarios', element: <CodsArancel /> },

              // Terceros
              { path: 'terceros/empresas', element: <Empresas /> },
              { path: 'terceros/analistas', element: <Analistas /> },
              { path: 'terceros/aduanas', element: <Aduanas /> },
              { path: 'terceros/forwarders', element: <Forwarders /> },
              { path: 'terceros/aseguradoras', element: <Aseguradoras /> },

              // Administración
              { path: 'admin/usuarios', element: <UsuariosPage /> },
              { path: 'admin/roles', element: <RolesPage /> },
              { path: 'admin/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
