import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export function ProductionPage() {
  const { get, patch } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['orders', 'en_produccion'],
    queryFn: () => get('/api/orders?status=en_produccion'),
  })

  const markDone = useMutation({
    mutationFn: (orderId: string) =>
      patch(`/api/orders/${orderId}/status`, { status: 'terminado' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  return (
    <div>
      <PageHeader
        title="Produccion"
        subtitle={`${orders.length} pedidos en produccion`}
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        ) : (
          <Table
            columns={[
              {
                key: 'id', header: 'Pedido', render: (r: any) => (
                  <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
                ),
              },
              {
                key: 'client', header: 'Cliente', render: (r: any) => (
                  <span className="font-medium">{r.clients?.company_name}</span>
                ),
              },
              {
                key: 'items', header: 'Items', render: (r: any) =>
                  r.order_items?.map((i: any) => `${i.quantity}x ${i.uniform_type}`).join(', ') || '-',
              },
              {
                key: 'delivery', header: 'Entrega', render: (r: any) =>
                  r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : '-',
              },
              { key: 'status', header: 'Estado', render: (r: any) => <Badge status={r.status} /> },
              {
                key: 'actions', header: '', render: (r: any) => (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Marcar como terminado?')) markDone.mutate(r.id)
                    }}
                  >
                    Completar
                  </Button>
                ),
              },
            ]}
            data={orders}
            onRowClick={(r: any) => navigate(`/pedidos/${r.id}`)}
            emptyMessage="No hay pedidos en produccion"
          />
        )}
      </Card>
    </div>
  )
}
