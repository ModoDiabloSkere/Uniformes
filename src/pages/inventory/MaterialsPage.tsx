import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'

type MaterialForm = { name: string; category: string; unit: string; min_stock: string }
const emptyForm: MaterialForm = { name: '', category: '', unit: 'metros', min_stock: '' }

export function MaterialsPage() {
  const { get, post, put, del } = useApi()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [form, setForm] = useState<MaterialForm>(emptyForm)

  const { data: materials = [], isLoading } = useQuery<any[]>({
    queryKey: ['materials'],
    queryFn: () => get('/api/materials'),
  })

  const createMutation = useMutation({
    mutationFn: (data: MaterialForm) =>
      post('/api/materials', { ...data, min_stock: Number(data.min_stock) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: MaterialForm) =>
      put(`/api/materials/${editingMaterial.id}`, { ...data, min_stock: Number(data.min_stock) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/api/materials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  })

  function openCreate() {
    setEditingMaterial(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(material: any) {
    setEditingMaterial(material)
    setForm({
      name: material.name,
      category: material.category || '',
      unit: material.unit,
      min_stock: String(material.min_stock ?? ''),
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingMaterial(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingMaterial) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title="Materiales"
        subtitle="Catálogo de materias primas"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo material
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        ) : (
          <Table
            columns={[
              { key: 'name', header: 'Material', render: (r: any) => <span className="font-medium">{r.name}</span> },
              { key: 'category', header: 'Categoría' },
              { key: 'unit', header: 'Unidad' },
              { key: 'min_stock', header: 'Stock mínimo' },
              {
                key: 'stock',
                header: 'En inventario',
                render: (r: any) => r.inventory?.[0]?.quantity_available ?? 0,
              },
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
                      onClick={() => { if (confirm('¿Eliminar material?')) deleteMutation.mutate(r.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={materials}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingMaterial ? 'Editar material' : 'Nuevo material'}
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
              label="Categoría"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ej: Telas, Botones"
            />
            <Input
              label="Unidad *"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              required
              placeholder="metros, piezas, rollos"
            />
          </div>
          <Input
            label="Stock mínimo"
            type="number"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : editingMaterial ? 'Guardar cambios' : 'Crear material'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
