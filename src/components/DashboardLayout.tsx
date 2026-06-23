import { Outlet, NavLink } from 'react-router-dom'
import { ShoppingCart, LayoutDashboard, LogOut } from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/ordenes-compra', label: 'Órdenes de Compra', icon: ShoppingCart },
]

export function DashboardLayout() {
  const logout = useLogout()

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 flex flex-col border-r bg-sidebar px-3 py-4 shrink-0">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LayoutDashboard className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground text-sm">Portal OC Comex</span>
        </div>

        <Separator className="mb-4" />

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
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
