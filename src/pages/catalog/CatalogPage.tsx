import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Layers, Scissors, X } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { SearchSelect } from '../../components/ui/SearchSelect'

type Tab = 'telas' | 'modelos'

const SEASON_LABEL: Record<string, string> = { OI: 'Otoño/Invierno', PV: 'Primavera/Verano' }
const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

function seasonLabel(s: string, y: number) {
  return `${SEASON_LABEL[s] || s} ${y}`
}

interface FabricGroup {
  name: string
  fabric_type: string
  season: string | null
  season_year: number | null
  items: any[]
}

function groupFabrics(fabrics: any[]): FabricGroup[] {
  const map = new Map<string, FabricGroup>()
  for (const f of fabrics) {
    const key = `${f.name}||${f.fabric_type}||${f.season || ''}||${f.season_year || ''}`
    if (!map.has(key)) {
      map.set(key, {
        name: f.name,
        fabric_type: f.fabric_type,
        season: f.season,
        season_year: f.season_year,
        items: [],
      })
    }
    map.get(key)!.items.push(f)
  }
  return Array.from(map.values())
}

export function CatalogPage() {
  const { get, post, put, del } = useApi()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('telas')

  // ── Telas ──────────────────────────────────────────────────────────────
  const [telaModal, setTelaModal] = useState(false)
  const [editingTelaGroup, setEditingTelaGroup] = useState<FabricGroup | null>(null)
  const [telaForm, setTelaForm] = useState({
    name: '',
    fabric_type: 'linea' as 'linea' | 'temporada',
    season: 'OI',
    season_year: currentYear,
    piece_type: '' as '' | 'blusa' | 'chaleco' | 'pantalon' | 'Ch/P',
    colors: [{ id: null as string | null, value: '' }],
  })

  const { data: telas = [] } = useQuery<any[]>({
    queryKey: ['materials'],
    queryFn: () => get<any[]>('/api/materials?limit=200'),
  })

  const fabrics = telas.filter((m: any) => m.fabric_type)
  const linea = groupFabrics(fabrics.filter((m: any) => m.fabric_type === 'linea'))
  const temporada = fabrics.filter((m: any) => m.fabric_type === 'temporada')

  const groupedTemporada = temporada.reduce<Record<string, FabricGroup[]>>((acc, t) => {
    const key = `${t.season}-${t.season_year}`
    if (!acc[key]) acc[key] = []
    const groups = groupFabrics(temporada.filter((x: any) => x.season === t.season && x.season_year === t.season_year))
    acc[key] = groups
    return acc
  }, {})

  const saveTelasMutation = useMutation({
    mutationFn: async ({
      base,
      colors,
      deletedIds,
    }: {
      base: any
      colors: { id: string | null; value: string }[]
      deletedIds: string[]
    }) => {
      for (const id of deletedIds) {
        await del(`/api/materials/${id}`)
      }
      for (const c of colors.filter((c) => c.id)) {
        await put(`/api/materials/${c.id}`, { ...base, color: c.value || null })
      }
      const newColors = colors.filter((c) => !c.id && c.value.trim())
      if (newColors.length > 0) {
        for (const c of newColors) {
          await post('/api/materials', { ...base, color: c.value || null })
        }
      } else if (colors.every((c) => !c.id)) {
        await post('/api/materials', { ...base, color: null })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      closeTelaModal()
    },
  })

  const deleteTelaMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await del(`/api/materials/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  })

  function openTelaModal(group?: FabricGroup) {
    setEditingTelaGroup(group || null)
    setTelaForm({
      name: group?.name || '',
      fabric_type: (group?.fabric_type || 'linea') as 'linea' | 'temporada',
      season: group?.season || 'OI',
      season_year: group?.season_year || currentYear,
      piece_type: (group?.items[0]?.piece_type || '') as typeof telaForm.piece_type,
      colors: group?.items.map((i) => ({ id: i.id as string, value: i.color || '' })) || [
        { id: null, value: '' },
      ],
    })
    setTelaModal(true)
  }

  function closeTelaModal() {
    setTelaModal(false)
    setEditingTelaGroup(null)
  }

  function submitTela(e: React.FormEvent) {
    e.preventDefault()
    const base = {
      name: telaForm.name,
      fabric_type: telaForm.fabric_type,
      season: telaForm.fabric_type === 'temporada' ? telaForm.season : null,
      season_year: telaForm.fabric_type === 'temporada' ? telaForm.season_year : null,
      piece_type: telaForm.piece_type || null,
      category: 'Tela',
      unit: 'metros',
    }
    const existingIds = editingTelaGroup?.items.map((i) => i.id) || []
    const formIds = telaForm.colors.filter((c) => c.id).map((c) => c.id!)
    const deletedIds = existingIds.filter((id) => !formIds.includes(id))
    saveTelasMutation.mutate({ base, colors: telaForm.colors, deletedIds })
  }

  function addColor() {
    setTelaForm((f) => ({ ...f, colors: [...f.colors, { id: null, value: '' }] }))
  }

  function removeColor(index: number) {
    setTelaForm((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== index) }))
  }

  function updateColor(index: number, value: string) {
    setTelaForm((f) => ({
      ...f,
      colors: f.colors.map((c, i) => (i === index ? { ...c, value } : c)),
    }))
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

  function toOptions(list: any[]) {
    return list.map((m: any) => ({
      value: m.id,
      label: `${m.name}${m.color ? ` · ${m.color}` : ''}${m.fabric_type === 'temporada' ? ` (${m.season}${m.season_year})` : ''}`,
    }))
  }

  const blusaOptions = toOptions(fabrics.filter((m: any) => m.piece_type === 'blusa'))
  const chalecoOptions = toOptions(fabrics.filter((m: any) => m.piece_type === 'chaleco' || m.piece_type === 'Ch/P'))
  const pantaloneOptions = toOptions(fabrics.filter((m: any) => m.piece_type === 'pantalon' || m.piece_type === 'Ch/P'))

  // ── Componente de grupo de tela ────────────────────────────────────────
  const PIECE_LABEL: Record<string, string> = {
    blusa: 'Blusa',
    chaleco: 'Chaleco',
    pantalon: 'Pantalón',
    'Ch/P': 'Ch/P',
  }
  const PIECE_COLOR: Record<string, string> = {
    blusa: 'bg-blue-50 text-blue-700',
    chaleco: 'bg-purple-50 text-purple-700',
    pantalon: 'bg-amber-50 text-amber-700',
    'Ch/P': 'bg-teal-50 text-teal-700',
  }

  function FabricGroupRow({ group }: { group: FabricGroup }) {
    const pieceType = group.items[0]?.piece_type
    return (
      <div className="py-3 flex items-center justify-between gap-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="font-medium text-gray-900 w-36 flex-shrink-0">{group.name}</span>
          {pieceType && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PIECE_COLOR[pieceType] || 'bg-gray-100 text-gray-600'}`}>
              {PIECE_LABEL[pieceType] || pieceType}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item: any) => (
              <span
                key={item.id}
                className="text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {item.color || '—'}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => openTelaModal(group)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar "${group.name}" con todos sus colores?`))
                deleteTelaMutation.mutate(group.items.map((i: any) => i.id))
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

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
          <Card
            title="Telas de Línea"
            action={<span className="text-xs text-gray-400 font-normal">{linea.length} telas</span>}
          >
            {linea.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin telas de línea registradas</p>
            ) : (
              <div className="divide-y-0">
                {linea.map((group) => (
                  <FabricGroupRow key={group.name} group={group} />
                ))}
              </div>
            )}
          </Card>

          {Object.entries(groupedTemporada)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, groups]) => {
              const [s, y] = key.split('-')
              return (
                <Card
                  key={key}
                  title={`Telas de Temporada · ${seasonLabel(s, Number(y))}`}
                  action={<span className="text-xs text-gray-400 font-normal">{groups.length} telas</span>}
                >
                  {groups.map((group) => (
                    <FabricGroupRow key={group.name} group={group} />
                  ))}
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
                                ? <span className="text-gray-700 font-medium">{fabric.name}{fabric.color ? ` · ${fabric.color}` : ''}</span>
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
      <Modal open={telaModal} onClose={closeTelaModal} title={editingTelaGroup ? 'Editar tela' : 'Nueva tela'}>
        <form onSubmit={submitTela} className="space-y-4">
          <Input
            label="Nombre de tela"
            value={telaForm.name}
            onChange={(e) => setTelaForm({ ...telaForm, name: e.target.value })}
            required
          />

          <Select
            label="Tipo"
            value={telaForm.fabric_type}
            onChange={(e) =>
              setTelaForm({ ...telaForm, fabric_type: e.target.value as 'linea' | 'temporada' })
            }
            options={[
              { value: 'linea', label: 'Línea (permanente)' },
              { value: 'temporada', label: 'Temporada' },
            ]}
          />

          {telaForm.fabric_type === 'temporada' && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Temporada"
                value={telaForm.season}
                onChange={(e) => setTelaForm({ ...telaForm, season: e.target.value })}
                options={[
                  { value: 'OI', label: 'Otoño/Invierno' },
                  { value: 'PV', label: 'Primavera/Verano' },
                ]}
              />
              <Select
                label="Año"
                value={String(telaForm.season_year)}
                onChange={(e) => setTelaForm({ ...telaForm, season_year: Number(e.target.value) })}
                options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
              />
            </div>
          )}

          <Select
            label="Uso de pieza"
            value={telaForm.piece_type}
            onChange={(e) =>
              setTelaForm({ ...telaForm, piece_type: e.target.value as typeof telaForm.piece_type })
            }
            options={[
              { value: 'blusa', label: 'Blusa' },
              { value: 'chaleco', label: 'Chaleco' },
              { value: 'pantalon', label: 'Pantalón' },
              { value: 'Ch/P', label: 'Chaleco / Pantalón' },
            ]}
            placeholder="— Seleccionar pieza —"
          />

          {/* Colores dinámicos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Colores disponibles</label>
              <button
                type="button"
                onClick={addColor}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar color
              </button>
            </div>
            <div className="space-y-2">
              {telaForm.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    label=""
                    value={c.value}
                    onChange={(e) => updateColor(i, e.target.value)}
                    placeholder=""
                  />
                  {telaForm.colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      className="p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeTelaModal}>Cancelar</Button>
            <Button type="submit" disabled={saveTelasMutation.isPending}>
              {editingTelaGroup ? 'Guardar cambios' : 'Agregar tela'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Modelo ── */}
      <Modal open={modeloModal} onClose={closeModeloModal} title={editingModelo ? 'Editar modelo' : 'Nuevo modelo'}>
        <form onSubmit={submitModelo} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Número"
              value={modeloForm.number}
              onChange={(e) => setModeloForm({ ...modeloForm, number: e.target.value })}
              required
            />
            <Select
              label="Temporada"
              value={modeloForm.season}
              onChange={(e) => setModeloForm({ ...modeloForm, season: e.target.value })}
              options={[
                { value: 'OI', label: 'Otoño/Invierno' },
                { value: 'PV', label: 'Primavera/Verano' },
              ]}
            />
            <Select
              label="Año"
              value={String(modeloForm.season_year)}
              onChange={(e) => setModeloForm({ ...modeloForm, season_year: Number(e.target.value) })}
              options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Combinación de telas</p>
            <SearchSelect
              label="Tela para Blusa / Camisa"
              value={modeloForm.blusa_material_id}
              onChange={(v) => setModeloForm({ ...modeloForm, blusa_material_id: v })}
              options={blusaOptions}
              placeholder="Buscar tela de blusa..."
            />
            <SearchSelect
              label="Tela para Chaleco / Saco"
              value={modeloForm.chaleco_material_id}
              onChange={(v) => setModeloForm({ ...modeloForm, chaleco_material_id: v })}
              options={chalecoOptions}
              placeholder="Buscar tela de chaleco..."
            />
            <SearchSelect
              label="Tela para Pantalón / Falda"
              value={modeloForm.pantalon_material_id}
              onChange={(v) => setModeloForm({ ...modeloForm, pantalon_material_id: v })}
              options={pantaloneOptions}
              placeholder="Buscar tela de pantalón..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={modeloForm.notes}
              onChange={(e) => setModeloForm({ ...modeloForm, notes: e.target.value })}
              rows={2}
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
