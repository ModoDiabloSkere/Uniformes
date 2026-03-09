import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Scissors,
  LogOut,
} from 'lucide-react'
import { useAuthStore, type UserRole } from '../../stores/authStore'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'ventas', 'almacen', 'confeccion'],
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: Users,
    roles: ['admin', 'ventas'],
  },
  {
    to: '/pedidos',
    label: 'Pedidos',
    icon: ShoppingCart,
    roles: ['admin', 'ventas', 'confeccion'],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: Package,
    roles: ['admin', 'almacen'],
  },
  {
    to: '/materiales',
    label: 'Materiales',
    icon: Warehouse,
    roles: ['admin', 'almacen'],
  },
  {
    to: '/proveedores',
    label: 'Proveedores',
    icon: Truck,
    roles: ['admin', 'almacen'],
  },
  {
    to: '/produccion',
    label: 'Produccion',
    icon: Scissors,
    roles: ['admin', 'confeccion'],
  },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Scissors className="h-7 w-7 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">
            Uniformes<span className="text-primary-600">Pro</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.email}
          </p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
