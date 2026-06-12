import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Scissors,
  ClipboardList,
  BookOpen,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { UserRole } from '../../stores/authStore'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  roles: UserRole[]
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Panel de control', icon: LayoutDashboard, roles: ['admin', 'ventas', 'almacen', 'confeccion'] },
  { to: '/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'ventas'] },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart, roles: ['admin', 'ventas', 'confeccion'] },
  { to: '/inventario', label: 'Inventario', icon: Package, roles: ['admin', 'almacen'] },
  { to: '/materiales', label: 'Materiales', icon: Warehouse, roles: ['admin', 'almacen'] },
  { to: '/proveedores', label: 'Proveedores', icon: Truck, roles: ['admin', 'almacen'] },
  { to: '/produccion', label: 'Produccion', icon: Scissors, roles: ['admin', 'confeccion'] },
  { to: '/cotizaciones', label: 'Cotizaciones web', icon: ClipboardList, roles: ['admin', 'ventas'] },
  { to: '/catalogo', label: 'Catálogo', icon: BookOpen, roles: ['admin', 'ventas'] },
]
