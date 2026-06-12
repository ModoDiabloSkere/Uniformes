import { useQuery } from '@tanstack/react-query'
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/layout/PageHeader'

interface DashboardData {
  orders_in_production: number
  orders_delivered_this_month: number
  orders_pending: number
  low_stock_count: number
  monthly_revenue: number
  low_stock_items: any[]

}

export function DashboardPage() {
  const { get } = useApi()
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => get('/api/dashboard'),
  })

  const stats = [
    {
      label: 'Pedidos en produccion',
      value: data?.orders_in_production ?? '-',
      icon: ShoppingCart,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Entregados este mes',
      value: data?.orders_delivered_this_month ?? '-',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Pedidos pendientes',
      value: data?.orders_pending ?? '-',
      icon: Clock,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Ingresos del mes',
      value: data
        ? `$${data.monthly_revenue.toLocaleString()}`
        : '-',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Materiales bajo stock',
      value: data?.low_stock_count ?? '-',
      icon: AlertTriangle,
      color:
        (data?.low_stock_count ?? 0) > 0
          ? 'text-red-600 bg-red-50'
          : 'text-gray-600 bg-gray-50',
    },
    {
      label: 'Inventario',
      value: 'Ver',
      icon: Package,
      color: 'text-violet-600 bg-violet-50',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Panel de control"
        subtitle="Resumen general del sistema"
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-lg">
            <Card title="Alertas de stock bajo">
              {data?.low_stock_items && data.low_stock_items.length > 0 ? (
                <ul className="space-y-3">
                  {data.low_stock_items.map((item: any) => (
                    <li
                      key={item.material_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">
                        {item.materials?.name}
                      </span>
                      <span className="text-red-600 font-medium">
                        {item.quantity_available} disponibles
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">
                  No hay alertas de stock
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
