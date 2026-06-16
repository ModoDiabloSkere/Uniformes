import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'

export function OrdersPage() {
  const { get, post } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ client_id: '', delivery_date: '', notes: '' })

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['orders', statusFilter],
    queryFn: () =>
      get(`/api/orders${statusFilter ? `?status=${statusFilter}` : ''}`),
  })

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: () => get('/api/clients'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => post('/api/orders', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setModalOpen(false)
      navigate(`/pedidos/${data.id}`)
    },
  })

  const filtered = orders.filter(
    (o: any) =>
      o.clients?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search)
  )

  return (
    <div>
      <PageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedidos`}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </Button>
        }
      />

      <Card>
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por empresa o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>
          <Select
            placeholder="Todos los estados"
            options={[
              { value: 'cotizacion', label: 'Cotizacion' },
              { value: 'aprobado', label: 'Aprobado' },
              { value: 'anticipo_pagado', label: 'Anticipo pagado' },
              { value: 'en_produccion', label: 'En produccion' },
              { value: 'terminado', label: 'Terminado' },
              { value: 'entregado', label: 'Entregado' },
              { value: 'cancelado', label: 'Cancelado' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        ) : (
          <Table
            columns={[
              {
                key: 'id',
                header: 'ID',
                render: (row: any) => (
                  <span className="font-mono text-xs text-gray-500">
                    {row.id.slice(0, 8)}
                  </span>
                ),
              },
              {
                key: 'client',
                header: 'Cliente',
                render: (row: any) => (
                  <span className="font-medium">
                    {row.clients?.company_name || '-'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (row: any) => <Badge status={row.status} />,
              },
              {
                key: 'total_price',
                header: 'Total',
                render: (row: any) => (
                  <span className="font-medium">
                    ${Number(row.total_price).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'advance_payment',
                header: 'Anticipo',
                render: (row: any) =>
                  `$${Number(row.advance_payment).toLocaleString()}`,
              },
              {
                key: 'items',
                header: 'Items',
                render: (row: any) => row.order_items?.length || 0,
              },
              {
                key: 'created_at',
                header: 'Fecha',
                render: (row: any) =>
                  new Date(row.created_at).toLocaleDateString(),
              },
            ]}
            data={filtered}
            onRowClick={(row: any) => navigate(`/pedidos/${row.id}`)}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo pedido"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(form)
          }}
          className="space-y-4"
        >
          <Select
            label="Cliente *"
            options={clients.map((c: any) => ({
              value: c.id,
              label: c.company_name,
            }))}
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            required
          />
          <Input
            label="Fecha de entrega"
            type="date"
            value={form.delivery_date}
            onChange={(e) =>
              setForm({ ...form, delivery_date: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Crear pedido
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
