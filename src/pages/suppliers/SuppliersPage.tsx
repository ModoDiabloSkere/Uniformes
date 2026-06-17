import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Truck } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'

type SupplierForm = { name: string; phone: string; email: string; address: string }
const emptyForm: SupplierForm = { name: '', phone: '', email: '', address: '' }

export function SuppliersPage() {
  const { get, post, put, del } = useApi()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [form, setForm] = useState<SupplierForm>(emptyForm)

  const { data: suppliers = [], isLoading } = useQuery<any[]>({
    queryKey: ['suppliers'],
    queryFn: () => get('/api/suppliers'),
  })

  const createMutation = useMutation({
    mutationFn: (data: SupplierForm) => post('/api/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: SupplierForm) => put(`/api/suppliers/${editingSupplier.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/api/suppliers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  function openCreate() {
    setEditingSupplier(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(supplier: any) {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingSupplier(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingSupplier) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle={`${suppliers.length} proveedores registrados`}
        action={
          <Button onClick={openCreate}>
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
                key: 'name',
                header: 'Proveedor',
                render: (r: any) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                ),
              },
              { key: 'phone', header: 'Teléfono' },
              { key: 'email', header: 'Email' },
              { key: 'address', header: 'Dirección' },
              {
                key: 'actions',
                header: '',
                render: (r: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Eliminar proveedor?')) deleteMutation.mutate(r.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={suppliers}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : editingSupplier ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
