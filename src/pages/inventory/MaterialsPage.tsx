import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'

export function MaterialsPage() {
  const { get, post, del } = useApi()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', unit: 'metros', min_stock: '' })

  const { data: materials = [], isLoading } = useQuery<any[]>({
    queryKey: ['materials'],
    queryFn: () => get('/api/materials'),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => post('/api/materials', { ...data, min_stock: Number(data.min_stock) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      setModalOpen(false)
      setForm({ name: '', category: '', unit: 'metros', min_stock: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/api/materials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  })

  return (
    <div>
      <PageHeader
        title="Materiales"
        subtitle="Catalogo de materias primas"
        action={
          <Button onClick={() => setModalOpen(true)}>
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
              { key: 'category', header: 'Categoria' },
              { key: 'unit', header: 'Unidad' },
              { key: 'min_stock', header: 'Stock minimo' },
              {
                key: 'stock',
                header: 'En inventario',
                render: (r: any) => r.inventory?.[0]?.quantity_available ?? 0,
              },
              {
                key: 'actions', header: '', render: (r: any) => (
                  <button
                    onClick={() => { if (confirm('Eliminar material?')) deleteMutation.mutate(r.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
            data={materials}
          />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo material">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Telas, Botones" />
            <Input label="Unidad *" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required placeholder="metros, piezas, rollos" />
          </div>
          <Input label="Stock minimo" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
