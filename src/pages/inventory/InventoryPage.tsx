import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus, PackagePlus } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

interface EntryForm {
  material_id: string
  quantity: string
  order_id: string
  notes: string
}

export function InventoryPage() {
  const { get, post } = useApi()
  const queryClient = useQueryClient()
  const [entryModal, setEntryModal] = useState(false)
  const [form, setForm] = useState<EntryForm>({
    material_id: '',
    quantity: '',
    order_id: '',
    notes: '',
  })

  const { data: inventory = [], isLoading } = useQuery<any[]>({
    queryKey: ['inventory'],
    queryFn: () => get('/api/inventory'),
  })

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['orders', 'activos'],
    queryFn: () => get('/api/orders?exclude_status=cancelado,entregado'),
  })

  const { data: entries = [], isLoading: entriesLoading } = useQuery<any[]>({
    queryKey: ['inventory-entries'],
    queryFn: () => get('/api/inventory/entries?limit=30'),
  })

  const createEntry = useMutation({
    mutationFn: (data: any) =>
      post('/api/inventory/entries', {
        material_id: data.material_id,
        quantity: Number(data.quantity),
        order_id: data.order_id || null,
        notes: data.notes || null,
        type: 'entrada',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-entries'] })
      setEntryModal(false)
      setForm({ material_id: '', quantity: '', order_id: '', notes: '' })
    },
  })

  const openEntry = (materialId?: string) => {
    setForm({ material_id: materialId || '', quantity: '', order_id: '', notes: '' })
    setEntryModal(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        subtitle={`${inventory.length} materiales en stock`}
        action={
          <Button onClick={() => openEntry()}>
            <PackagePlus className="h-4 w-4" />
            Registrar entrada
          </Button>
        }
      />

      {/* Stock levels table */}
      <Card title="Stock actual">
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
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="font-medium">{row.materials?.name}</span>
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
                  <span className={`font-semibold ${row.low_stock ? 'text-amber-600' : 'text-gray-900'}`}>
                    {row.quantity_available} {row.materials?.unit}
                  </span>
                ),
              },
              {
                key: 'min_stock',
                header: 'Stock min.',
                render: (row: any) =>
                  row.materials?.min_stock != null
                    ? `${row.materials.min_stock} ${row.materials?.unit}`
                    : '-',
              },
              {
                key: 'status',
                header: 'Estado',
                render: (row: any) =>
                  row.low_stock ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Stock bajo
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      OK
                    </span>
                  ),
              },
              {
                key: 'add',
                header: '',
                render: (row: any) => (
                  <button
                    onClick={() => openEntry(row.material_id)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> Entrada
                  </button>
                ),
              },
            ]}
            data={inventory}
          />
        )}
      </Card>

      {/* Movement history */}
      <Card title="Historial de entradas">
        {entriesLoading ? (
          <div className="py-8 text-center text-gray-400">Cargando...</div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            Sin movimientos registrados
          </div>
        ) : (
          <Table
            columns={[
              {
                key: 'date',
                header: 'Fecha',
                render: (r: any) =>
                  new Date(r.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
              },
              {
                key: 'material',
                header: 'Material',
                render: (r: any) => (
                  <span className="font-medium">{r.material_name || r.materials?.name}</span>
                ),
              },
              {
                key: 'quantity',
                header: 'Cantidad',
                render: (r: any) => (
                  <span className="font-semibold text-green-700">
                    +{r.quantity} {r.unit || r.materials?.unit}
                  </span>
                ),
              },
              {
                key: 'type',
                header: 'Tipo',
                render: (r: any) => <Badge status={r.type || 'entrada'} />,
              },
              {
                key: 'order',
                header: 'Para pedido',
                render: (r: any) =>
                  r.order_client || r.orders?.clients?.company_name ? (
                    <span className="text-sm text-gray-700">
                      {r.order_client || r.orders?.clients?.company_name}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
              {
                key: 'notes',
                header: 'Notas',
                render: (r: any) =>
                  r.notes ? (
                    <span className="text-sm text-gray-500">{r.notes}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  ),
              },
            ]}
            data={entries}
          />
        )}
      </Card>

      {/* Register entry modal */}
      <Modal open={entryModal} onClose={() => setEntryModal(false)} title="Registrar entrada de material">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createEntry.mutate(form)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material *
            </label>
            <select
              required
              value={form.material_id}
              onChange={(e) => setForm({ ...form, material_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              <option value="">Seleccionar material...</option>
              {inventory.map((item: any) => (
                <option key={item.material_id} value={item.material_id}>
                  {item.materials?.name} ({item.materials?.category || 'Sin categoria'})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Cantidad recibida *"
            type="number"
            min="0.01"
            step="any"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Ej: 50"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Para pedido (opcional)
            </label>
            <select
              value={form.order_id}
              onChange={(e) => setForm({ ...form, order_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              <option value="">Sin pedido especifico</option>
              {orders.map((order: any) => (
                <option key={order.id} value={order.id}>
                  {order.clients?.company_name} — #{order.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Indica el pedido para el que se solicitó este material, aunque puede usarse en otros.
            </p>
          </div>

          <Input
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Ej: Factura #123, proveedor Textiles SA"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEntryModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? 'Guardando...' : 'Registrar entrada'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
