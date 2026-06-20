import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { AppLayout } from './components/layout/AppLayout'
import { RoleRoute } from './components/layout/RoleRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ClientsPage } from './pages/clients/ClientsPage'
import { ClientDetailPage } from './pages/clients/ClientDetailPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { OrderDetailPage } from './pages/orders/OrderDetailPage'
import { ProductionPage } from './pages/orders/ProductionPage'
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { QuotesPage } from './pages/quotes/QuotesPage'
import { CatalogPage } from './pages/catalog/CatalogPage'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      if ((error as any)?.status === 401) {
        useAuthStore.getState().logout()
        window.location.replace('/login')
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error: unknown) => {
        if ((error as any)?.status === 401) return false
        return failureCount < 1
      },
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
            {/* Accesible para todos los roles autenticados */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Ventas / Admin */}
            <Route element={<RoleRoute roles={['admin', 'ventas']} />}>
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/clientes/:id" element={<ClientDetailPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/cotizaciones" element={<QuotesPage />} />
            </Route>

            {/* Pedidos y producción (ventas + confección) */}
            <Route element={<RoleRoute roles={['admin', 'ventas', 'confeccion']} />}>
              <Route path="/pedidos" element={<OrdersPage />} />
              <Route path="/pedidos/:id" element={<OrderDetailPage />} />
              <Route path="/empleados/:id" element={<EmployeeDetailPage />} />
            </Route>

            <Route element={<RoleRoute roles={['admin', 'confeccion']} />}>
              <Route path="/produccion" element={<ProductionPage />} />
            </Route>

            {/* Almacén / Admin */}
            <Route element={<RoleRoute roles={['admin', 'almacen']} />}>
              <Route path="/inventario" element={<InventoryPage />} />
              <Route path="/proveedores" element={<SuppliersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
