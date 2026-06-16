import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Layers, Scissors } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'

type Tab = 'telas' | 'modelos'

const SEASON_LABEL: Record<string, string> = { OI: 'Otoño/Invierno', PV: 'Primavera/Verano' }
const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

const PIECE_ICONS: Record<string, string> = {
  blusa: '👔',
  chaleco: '🧥',
  pantalon: '👖',
}

function seasonLabel(s: string, y: number) {
  return `${SEASON_LABEL[s] || s} ${y}`
}

export function CatalogPage() {
  const { get, post, put, del } = useApi()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('telas')

  // ── Telas ──────────────────────────────────────────────────────────────
  const [telaModal, setTelaModal] = useState(false)
  const [editingTela, setEditingTela] = useState<any>(null)
  const [telaForm, setTelaForm] = useState({
    name: '', code: '', fabric_type: 'linea', season: 'OI', season_year: currentYear,
    color: '', unit: 'metros', min_stock: '',
  })

  const { data: telas = [] } = useQuery<any[]>({
    queryKey: ['materials'],
    queryFn: () => get<any[]>('/api/materials?limit=200'),
  })

  const fabrics = telas.filter((m: any) => m.fabric_type)
  const linea = fabrics.filter((m: any) => m.fabric_type === 'linea')
  const temporada = fabrics.filter((m: any) => m.fabric_type === 'temporada')

  const groupedTemporada = temporada.reduce<Record<string, any[]>>((acc, t) => {
    const key = `${t.season}-${t.season_year}`
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  const saveTelaMutation = useMutation({
    mutationFn: (data: any) =>
      editingTela ? put(`/api/materials/${editingTela.id}`, data) : post('/api/materials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      closeTelaModal()
    },
  })

  const deleteTelaMutation = useMutation({
    mutationFn: (id: string) => del(`/api/materials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  })

  function openTelaModal(tela?: any) {
    setEditingTela(tela || null)
    setTelaForm({
      name: tela?.name || '',
      code: tela?.code || '',
      fabric_type: tela?.fabric_type || 'linea',
      season: tela?.season || 'OI',
      season_year: tela?.season_year || currentYear,
      color: tela?.color || '',
      unit: tela?.unit || 'metros',
      min_stock: tela?.min_stock ?? '',
    })
    setTelaModal(true)
  }

  function closeTelaModal() {
    setTelaModal(false)
    setEditingTela(null)
  }

  function submitTela(e: React.FormEvent) {
    e.preventDefault()
    saveTelaMutation.mutate({
      name: telaForm.name,
      color: telaForm.color || null,
      fabric_type: telaForm.fabric_type,
      season: telaForm.fabric_type === 'temporada' ? telaForm.season : null,
      season_year: telaForm.fabric_type === 'temporada' ? Number(telaForm.season_year) : null,
      category: 'Tela',
      unit: 'metros',
    })
  }

  // ── Modelos ────────────────────────────────────────────────────────────
  const [modeloModal, setModeloModal] = useState(false)
  const [editingModelo, setEditingModelo] = useState<any>(null)
  const [modeloForm, setModeloForm] = useState({
    number: '', season: 'OI', season_year: currentYear,
    blusa_material_id: '', chaleco_material_id: '', pantalon_material_id: '',
    notes: '', active: true,
  })

  const { data: modelos = [] } = useQuery<any[]>({
    queryKey: ['models'],
    queryFn: () => get<any[]>('/api/models'),
  })

  const saveModeloMutation = useMutation({
    mutationFn: (data: any) =>
      editingModelo ? put(`/api/models/${editingModelo.id}`, data) : post('/api/models', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      closeModeloModal()
    },
  })

  const deleteModeloMutation = useMutation({
    mutationFn: (id: string) => del(`/api/models/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  })

  const toggleModeloMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      put(`/api/models/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  })

  function openModeloModal(modelo?: any) {
    setEditingModelo(modelo || null)
    setModeloForm({
      number: modelo?.number || '',
      season: modelo?.season || 'OI',
      season_year: modelo?.season_year || currentYear,
      blusa_material_id: modelo?.blusa_material_id || '',
      chaleco_material_id: modelo?.chaleco_material_id || '',
      pantalon_material_id: modelo?.pantalon_material_id || '',
      notes: modelo?.notes || '',
      active: modelo?.active ?? true,
    })
    setModeloModal(true)
  }

  function closeModeloModal() {
    setModeloModal(false)
    setEditingModelo(null)
  }

  function submitModelo(e: React.FormEvent) {
    e.preventDefault()
    saveModeloMutation.mutate({
      number: modeloForm.number,
      season: modeloForm.season,
      season_year: Number(modeloForm.season_year),
      blusa_material_id: modeloForm.blusa_material_id || null,
      chaleco_material_id: modeloForm.chaleco_material_id || null,
      pantalon_material_id: modeloForm.pantalon_material_id || null,
      notes: modeloForm.notes || null,
      active: modeloForm.active,
    })
  }

  const fabricOptions = fabrics
    .filter((m: any) => m.active !== false)
    .map((m: any) => ({
      value: m.id,
      label: `${m.name}${m.code ? ` (${m.code})` : ''}${m.fabric_type === 'temporada' ? ` · ${m.season}${m.season_year}` : ''}`,
    }))

  const telaColumns = [
    {
      key: 'name', header: 'Nombre',
      render: (r: any) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'color', header: 'Color',
      render: (r: any) => r.color
        ? <span className="text-sm text-gray-700">{r.color}</span>
        : <span className="text-xs text-gray-300">—</span>,
    },
    {
      key: 'actions', header: '',
      render: (r: any) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openTelaModal(r)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { if (confirm(`¿Eliminar "${r.name}"?`)) deleteTelaMutation.mutate(r.id) }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Catálogo"
        subtitle="Telas y modelos disponibles"
        action={
          tab === 'telas'
            ? <Button size="sm" onClick={() => openTelaModal()}><Plus className="h-4 w-4" /> Nueva tela</Button>
            : <Button size="sm" onClick={() => openModeloModal()}><Plus className="h-4 w-4" /> Nuevo modelo</Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('telas')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'telas'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Scissors className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          Telas
        </button>
        <button
          onClick={() => setTab('modelos')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'modelos'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          Modelos
        </button>
      </div>

      {/* ── TELAS ── */}
      {tab === 'telas' && (
        <div className="space-y-4">
          {/* Línea */}
          <Card
            title={`Telas de Línea`}
            action={<span className="text-xs text-gray-400 font-normal">{linea.length} telas</span>}
          >
            {linea.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin telas de línea registradas</p>
            ) : (
              <Table columns={telaColumns} data={linea} />
            )}
          </Card>

          {/* Temporada — un bloque por temporada */}
          {Object.entries(groupedTemporada)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, items]) => {
              const [s, y] = key.split('-')
              return (
                <Card
                  key={key}
                  title={`Telas de Temporada · ${seasonLabel(s, Number(y))}`}
                  action={<span className="text-xs text-gray-400 font-normal">{items.length} telas</span>}
                >
                  <Table columns={telaColumns} data={items} />
                </Card>
              )
            })}

          {fabrics.length === 0 && (
            <Card>
              <div className="text-center py-10 text-gray-400">
                <Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Sin telas registradas</p>
                <p className="text-sm mt-1">Agrega la primera tela usando el botón superior.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── MODELOS ── */}
      {tab === 'modelos' && (
        <div className="space-y-3">
          {modelos.length === 0 ? (
            <Card>
              <div className="text-center py-10 text-gray-400">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Sin modelos registrados</p>
                <p className="text-sm mt-1">Crea el primer modelo para empezar a ofrecer combinaciones.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-gray-100">
                {modelos.map((m: any) => (
                  <div key={m.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">#{m.number}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">Modelo #{m.number}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {seasonLabel(m.season, m.season_year)}
                          </span>
                          {!m.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactivo</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {[
                            { label: 'Blusa', fabric: m.blusa_material },
                            { label: 'Chaleco', fabric: m.chaleco_material },
                            { label: 'Pantalón', fabric: m.pantalon_material },
                          ].map(({ label, fabric }) => (
                            <div key={label} className="text-xs">
                              <span className="text-gray-400">{label}: </span>
                              {fabric
                                ? <span className="text-gray-700 font-medium">{fabric.name}{fabric.code ? ` (${fabric.code})` : ''}</span>
                                : <span className="text-gray-300 italic">—</span>
                              }
                            </div>
                          ))}
                        </div>
                        {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleModeloMutation.mutate({ id: m.id, active: !m.active })}
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          m.active
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {m.active ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        onClick={() => openModeloModal(m)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar Modelo #${m.number}?`)) deleteModeloMutation.mutate(m.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Modal Tela ── */}
      <Modal open={telaModal} onClose={closeTelaModal} title={editingTela ? 'Editar tela' : 'Nueva tela'}>
        <form onSubmit={submitTela} className="space-y-4">
          <Input
            label="Nombre de tela *"
            value={telaForm.name}
            onChange={(e) => setTelaForm({ ...telaForm, name: e.target.value })}
            required
            placeholder="Ej: Montecristo"
          />
          <Input
            label="Color"
            value={telaForm.color}
            onChange={(e) => setTelaForm({ ...telaForm, color: e.target.value })}
            placeholder="Ej: Blanca, Bone, Coral"
          />
          <Select
            label="Tipo *"
            value={telaForm.fabric_type}
            onChange={(e) => setTelaForm({ ...telaForm, fabric_type: e.target.value })}
            options={[
              { value: 'linea', label: 'Línea (permanente)' },
              { value: 'temporada', label: 'Temporada' },
            ]}
          />
          {telaForm.fabric_type === 'temporada' && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Temporada *"
                value={telaForm.season}
                onChange={(e) => setTelaForm({ ...telaForm, season: e.target.value })}
                options={[
                  { value: 'OI', label: 'Otoño/Invierno' },
                  { value: 'PV', label: 'Primavera/Verano' },
                ]}
              />
              <Select
                label="Año *"
                value={String(telaForm.season_year)}
                onChange={(e) => setTelaForm({ ...telaForm, season_year: Number(e.target.value) })}
                options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeTelaModal}>Cancelar</Button>
            <Button type="submit" disabled={saveTelaMutation.isPending}>
              {editingTela ? 'Guardar cambios' : 'Agregar tela'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Modelo ── */}
      <Modal open={modeloModal} onClose={closeModeloModal} title={editingModelo ? 'Editar modelo' : 'Nuevo modelo'}>
        <form onSubmit={submitModelo} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Número *"
              value={modeloForm.number}
              onChange={(e) => setModeloForm({ ...modeloForm, number: e.target.value })}
              required
              placeholder="Ej: 3"
            />
            <Select
              label="Temporada *"
              value={modeloForm.season}
              onChange={(e) => setModeloForm({ ...modeloForm, season: e.target.value })}
              options={[
                { value: 'OI', label: 'Otoño/Invierno' },
                { value: 'PV', label: 'Primavera/Verano' },
              ]}
            />
            <Select
              label="Año *"
              value={String(modeloForm.season_year)}
              onChange={(e) => setModeloForm({ ...modeloForm, season_year: Number(e.target.value) })}
              options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Combinación de telas</p>
            <Select
              label="Tela para Blusa / Camisa"
              value={modeloForm.blusa_material_id}
              onChange={(e) => setModeloForm({ ...modeloForm, blusa_material_id: e.target.value })}
              options={fabricOptions}
              placeholder="— Seleccionar tela —"
            />
            <Select
              label="Tela para Chaleco / Saco"
              value={modeloForm.chaleco_material_id}
              onChange={(e) => setModeloForm({ ...modeloForm, chaleco_material_id: e.target.value })}
              options={fabricOptions}
              placeholder="— Seleccionar tela —"
            />
            <Select
              label="Tela para Pantalón / Falda"
              value={modeloForm.pantalon_material_id}
              onChange={(e) => setModeloForm({ ...modeloForm, pantalon_material_id: e.target.value })}
              options={fabricOptions}
              placeholder="— Seleccionar tela —"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={modeloForm.notes}
              onChange={(e) => setModeloForm({ ...modeloForm, notes: e.target.value })}
              rows={2}
              placeholder="Notas opcionales sobre este modelo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModeloModal}>Cancelar</Button>
            <Button type="submit" disabled={saveModeloMutation.isPending}>
              {editingModelo ? 'Guardar cambios' : 'Crear modelo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
