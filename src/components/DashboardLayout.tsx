import { Outlet, NavLink } from 'react-router-dom'
import {
  ShoppingCart, LayoutDashboard, LogOut,
  Building2, Package, Globe, DollarSign, Ruler, Box, PackageOpen,
  FileText, Truck, Scale, CreditCard, Anchor, Ship, Warehouse, Tag,
  Building, User, Landmark, Briefcase, Shield, UserCog, ShieldCheck, Settings,
} from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navCompras = [
  { to: '/ordenes-compra', label: 'Órdenes de Compra', icon: ShoppingCart },
]

const navMaestros = [
  { to: '/maestros/articulos', label: 'Artículos', icon: Package },
  { to: '/maestros/paises', label: 'Países', icon: Globe },
  { to: '/maestros/monedas', label: 'Monedas', icon: DollarSign },
  { to: '/maestros/unidades-medida', label: 'Unidades de Medida', icon: Ruler },
  { to: '/maestros/tipos-contenedor', label: 'Tipos de Contenedor', icon: Box },
  { to: '/maestros/tipos-embalaje', label: 'Tipos de Embalaje', icon: PackageOpen },
  { to: '/maestros/tipos-documento', label: 'Tipos de Documento', icon: FileText },
  { to: '/maestros/modos-transporte', label: 'Modos de Transporte', icon: Truck },
  { to: '/maestros/incoterms', label: 'Incoterms', icon: Scale },
  { to: '/maestros/terminos-pago', label: 'Términos de Pago', icon: CreditCard },
  { to: '/maestros/puertos', label: 'Puertos', icon: Anchor },
  { to: '/maestros/lineas-navieras', label: 'Líneas Navieras', icon: Ship },
  { to: '/maestros/bodegas', label: 'Bodegas', icon: Warehouse },
  { to: '/maestros/codigos-arancelarios', label: 'Códigos Arancelarios', icon: Tag },
]

const navTerceros = [
  { to: '/maestros/proveedores', label: 'Proveedores', icon: Building2 },
  { to: '/terceros/empresas', label: 'Empresas', icon: Building },
  { to: '/terceros/analistas', label: 'Analistas', icon: User },
  { to: '/terceros/aduanas', label: 'Agencias de Aduana', icon: Landmark },
  { to: '/terceros/forwarders', label: 'Agentes de Carga', icon: Briefcase },
  { to: '/terceros/aseguradoras', label: 'Aseguradoras', icon: Shield },
]

const navAdmin = [
  { to: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Configuración', icon: Settings },
]

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

function NavSection({ label, items }: { label: string; items: typeof navCompras }) {
  return (
    <div>
      <p className="px-3 mb-1 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(item => <NavItem key={item.to} {...item} />)}
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const logout = useLogout()

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 flex flex-col border-r bg-sidebar px-3 py-4 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LayoutDashboard className="h-5 w-5 text-sidebar-primary shrink-0" />
          <span className="font-semibold text-sidebar-foreground text-sm truncate">Portal OC Comex</span>
        </div>

        <Separator className="mb-4" />

        <nav className="flex-1 space-y-4">
          <div className="space-y-0.5">
            {navCompras.map(item => <NavItem key={item.to} {...item} />)}
          </div>
          <NavSection label="Maestros" items={navMaestros} />
          <NavSection label="Terceros" items={navTerceros} />
          <NavSection label="Administración" items={navAdmin} />
        </nav>

        <Separator className="my-4" />

        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-sidebar-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
