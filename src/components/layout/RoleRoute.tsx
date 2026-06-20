import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type UserRole } from '../../stores/authStore'

interface RoleRouteProps {
  roles: UserRole[]
}

/**
 * Guard de ruta por rol. Defensa en profundidad: el backend ya valida
 * permisos por endpoint, pero esto evita que un rol navegue por URL a una
 * sección que no le corresponde (mejor UX que ver errores 403).
 */
export function RoleRoute({ roles }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
