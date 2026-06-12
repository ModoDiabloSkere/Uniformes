import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'

export function CatalogPage() {
  const { get, post, put, del } = useApi()
  const queryClient = useQueryClient()

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)
  const [catForm, setCatForm] = useState({ name: '', description: '' })

  const [prodModal, setProdModal] = useState(false)
  const [editingProd, setEditingProd] = useState<any>(null)
  const [prodForm, setProdForm] = useState({ category_id: '', name: '', model_ref: '', description: '' })

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['product-categories'],
    queryFn: () => get<any[]>('/api/product-categories'),
  })

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => get<any[]>('/api/products?active=false'),
  })

  const saveCatMutation = useMutation({
    mutationFn: (data: any) =>
      editingCat ? put(`/api/product-categories/${editingCat.id}`, data) : post('/api/product-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      closeCatModal()
    },
  })

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => del(`/api/product-categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-categories'] }),
  })

  const saveProdMutation = useMutation({
    mutationFn: (data: any) =>
      editingProd ? put(`/api/products/${editingProd.id}`, data) : post('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeProdModal()
    },
  })

  const deleteProdMutation = useMutation({
    mutationFn: (id: string) => del(`/api/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const toggleActiveProdMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      put(`/api/products/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  function openCatModal(cat?: any) {
    setEditingCat(cat || null)
    setCatForm({ name: cat?.name || '', description: cat?.description || '' })
    setCatModal(true)
  }

  function closeCatModal() {
    setCatModal(false)
    setEditingCat(null)
    setCatForm({ name: '', description: '' })
  }

  function openProdModal(prod?: any, categoryId?: string) {
    setEditingProd(prod || null)
    setProdForm({
      category_id: prod?.category_id || categoryId || '',
      name: prod?.name || '',
      model_ref: prod?.model_ref || '',
      description: prod?.description || '',
    })
    setProdModal(true)
  }

  function closeProdModal() {
    setProdModal(false)
    setEditingProd(null)
    setProdForm({ category_id: '', name: '', model_ref: '', description: '' })
  }

  function toggleCat(id: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const productsByCategory = (categoryId: string) =>
    products.filter((p: any) => p.category_id === categoryId)

  return (
    <div>
      <PageHeader
        title="Catálogo de productos"
        subtitle="Gestiona los tipos de uniformes disponibles"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => openProdModal()}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
            <Button size="sm" onClick={() => openCatModal()}>
              <Tag className="h-4 w-4" /> Nueva categoría
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {categories.map((cat: any) => {
          const isOpen = expandedCats.has(cat.id)
          const prods = productsByCategory(cat.id)
          return (
            <Card key={cat.id}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {isOpen
                    ? <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                  <div>
                    <span className="font-semibold text-gray-900">{cat.name}</span>
                    {cat.description && (
                      <span className="ml-2 text-sm text-gray-400">{cat.description}</span>
                    )}
                  </div>
                  <span className="ml-3 text-sm text-gray-400">
                    {prods.length} producto{prods.length !== 1 ? 's' : ''}
                  </span>
                </button>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openProdModal(undefined, cat.id)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </Button>
                  <button
                    onClick={() => openCatModal(cat)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (prods.length > 0) {
                        alert('Elimina los productos de esta categoría antes de borrarla.')
                        return
                      }
                      if (confirm(`¿Eliminar categoría "${cat.name}"?`))
                        deleteCatMutation.mutate(cat.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {prods.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Sin productos en esta categoría.{' '}
                      <button
                        onClick={() => openProdModal(undefined, cat.id)}
                        className="text-primary-600 hover:underline"
                      >
                        Agregar el primero
                      </button>
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {prods.map((prod: any) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between py-3 px-1"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${prod.active ? 'bg-green-400' : 'bg-gray-300'}`}
                            />
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900">{prod.name}</span>
                              {prod.model_ref && (
                                <span className="ml-2 text-sm text-gray-500">
                                  Mod. {prod.model_ref}
                                </span>
                              )}
                              {prod.description && (
                                <p className="text-sm text-gray-400 truncate">{prod.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                            <button
                              onClick={() =>
                                toggleActiveProdMutation.mutate({ id: prod.id, active: !prod.active })
                              }
                              className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                                prod.active
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {prod.active ? 'Activo' : 'Inactivo'}
                            </button>
                            <button
                              onClick={() => openProdModal(prod)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar "${prod.name}"?`))
                                  deleteProdMutation.mutate(prod.id)
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}

        {categories.length === 0 && (
          <Card>
            <div className="text-center py-10 text-gray-400">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin categorías</p>
              <p className="text-sm mt-1">Crea una categoría para empezar a agregar productos.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Modal categoría */}
      <Modal
        open={catModal}
        onClose={closeCatModal}
        title={editingCat ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveCatMutation.mutate(catForm)
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre *"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
            placeholder="Ej: Blusas, Pantalones, Chalecos"
          />
          <Input
            label="Descripción"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
            placeholder="Descripción opcional"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeCatModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveCatMutation.isPending}>
              {editingCat ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal producto */}
      <Modal
        open={prodModal}
        onClose={closeProdModal}
        title={editingProd ? 'Editar producto' : 'Nuevo producto'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveProdMutation.mutate(prodForm)
          }}
          className="space-y-4"
        >
          <Select
            label="Categoría *"
            value={prodForm.category_id}
            onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
            options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            required
          />
          <Input
            label="Nombre del producto *"
            value={prodForm.name}
            onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
            required
            placeholder="Ej: Blusa Acacia Coffee, Chaleco Lugo Mint"
          />
          <Input
            label="Referencia / modelo"
            value={prodForm.model_ref}
            onChange={(e) => setProdForm({ ...prodForm, model_ref: e.target.value })}
            placeholder="Ej: #3, #5, Camisera"
          />
          <Input
            label="Descripción"
            value={prodForm.description}
            onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
            placeholder="Notas o especificaciones adicionales"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeProdModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveProdMutation.isPending}>
              {editingProd ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
