import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Truck } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'

export function SuppliersPage() {
  const { get, post, del } = useApi()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  const { data: suppliers = [], isLoading } = useQuery<any[]>({
    queryKey: ['suppliers'],
    queryFn: () => get('/api/suppliers'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => post('/api/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setModalOpen(false)
      setForm({ name: '', phone: '', email: '', address: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/api/suppliers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle={`${suppliers.length} proveedores registrados`}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        ) : (
          <Table
            columns={[
              {
                key: 'name', header: 'Proveedor', render: (r: any) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                ),
              },
              { key: 'phone', header: 'Telefono' },
              { key: 'email', header: 'Email' },
              { key: 'address', header: 'Direccion' },
              {
                key: 'actions', header: '', render: (r: any) => (
                  <button
                    onClick={() => { if (confirm('Eliminar proveedor?')) deleteMutation.mutate(r.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
            data={suppliers}
          />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo proveedor">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="Direccion" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
