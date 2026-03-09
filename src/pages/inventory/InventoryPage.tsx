import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'

export function InventoryPage() {
  const { get, patch } = useApi()
  const queryClient = useQueryClient()

  const { data: inventory = [], isLoading } = useQuery<any[]>({
    queryKey: ['inventory'],
    queryFn: () => get('/api/inventory'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ materialId, quantity }: { materialId: string; quantity: number }) =>
      patch(`/api/inventory/${materialId}`, { quantity_available: quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle={`${inventory.length} materiales en stock`}
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Material',
                render: (row: any) => (
                  <div className="flex items-center gap-2">
                    {row.low_stock && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-medium">
                      {row.materials?.name}
                    </span>
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Categoria',
                render: (row: any) => row.materials?.category || '-',
              },
              {
                key: 'quantity_available',
                header: 'Disponible',
                render: (row: any) => (
                  <input
                    type="number"
                    defaultValue={row.quantity_available}
                    onBlur={(e) => {
                      const val = Number(e.target.value)
                      if (val !== row.quantity_available) {
                        updateMutation.mutate({
                          materialId: row.material_id,
                          quantity: val,
                        })
                      }
                    }}
                    className={`w-24 px-2 py-1 border rounded text-sm text-right ${
                      row.low_stock
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-200'
                    }`}
                  />
                ),
              },
              {
                key: 'unit',
                header: 'Unidad',
                render: (row: any) => row.materials?.unit,
              },
              {
                key: 'min_stock',
                header: 'Stock min.',
                render: (row: any) => row.materials?.min_stock ?? '-',
              },
              {
                key: 'status',
                header: 'Estado',
                render: (row: any) =>
                  row.low_stock ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Bajo
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      OK
                    </span>
                  ),
              },
            ]}
            data={inventory}
          />
        )}
      </Card>
    </div>
  )
}
