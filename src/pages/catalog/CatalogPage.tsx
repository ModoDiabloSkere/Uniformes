import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Layers, Scissors, X, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { EmptyState } from '../../components/ui/EmptyState'
import { fadeInItem, fadeInList } from '../../lib/motion'

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

const PIECE_LABEL: Record<string, string> = {
  blusa: 'Blusa',
  chaleco: 'Chaleco',
  pantalon: 'Pantalón',
  'Ch/P': 'Ch/P',
}
const PIECE_COLOR: Record<string, { bg: string; text: string }> = {
  blusa:    { bg: '#EFF6FF', text: '#2563EB' },
  chaleco:  { bg: '#F5F3FF', text: '#7C3AED' },
  pantalon: { bg: '#FFFBEB', text: '#D97706' },
  'Ch/P':   { bg: '#F0FDFA', text: '#0D9488' },
}

export function CatalogPage() {
  const { get, post, put, del } = useApi()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('telas')

  // ── Telas ──────────────────────────────────────────────────────────────
  const [telaSearch, setTelaSearch] = useState('')
  const [telaSeasonFilter, setTelaSeasonFilter] = useState('')
  const [telaModal, setTelaModal] = useState(false)
  const [editingTelaGroup, setEditingTelaGroup] = useState<FabricGroup | null>(null)
  const [telaFormError, setTelaFormError] = useState('')
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

  // Opciones del filtro de temporada generadas dinámicamente
  const seasonFilterOptions = [
    { value: '', label: 'Todas' },
    { value: 'linea', label: 'Solo línea' },
    ...Object.keys(groupedTemporada)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [s, y] = key.split('-')
        return { value: key, label: seasonLabel(s, Number(y)) }
      }),
  ]

  const searchLower = telaSearch.toLowerCase()

  const lineaFiltered = telaSeasonFilter === '' || telaSeasonFilter === 'linea'
    ? linea.filter((g) => !searchLower || g.name.toLowerCase().includes(searchLower))
    : []

  const temporadaFilteredEntries = Object.entries(groupedTemporada)
    .filter(([key]) => telaSeasonFilter === '' || telaSeasonFilter === key)
    .map(([key, groups]) => [
      key,
      groups.filter((g) => !searchLower || g.name.toLowerCase().includes(searchLower)),
    ] as [string, FabricGroup[]])
    .filter(([, groups]) => groups.length > 0)

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
      await Promise.all(deletedIds.map((id) => del(`/api/materials/${id}`)))
      const toUpdate = colors.filter((c) => c.id)
      const toCreate = colors.filter((c) => !c.id && c.value.trim())
      await Promise.all([
        ...toUpdate.map((c) => put(`/api/materials/${c.id}`, { ...base, color: c.value || null })),
        ...toCreate.map((c) => post('/api/materials', { ...base, color: c.value || null })),
        ...(toCreate.length === 0 && toUpdate.length === 0
          ? [post('/api/materials', { ...base, color: null })]
          : []),
      ])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      closeTelaModal()
      toast.success(editingTelaGroup ? 'Tela actualizada' : 'Tela creada')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al guardar la tela'),
  })

  const deleteTelaMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await del(`/api/materials/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success('Tela eliminada')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al eliminar'),
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
    setTelaFormError('')
  }

  function isDuplicateTela(): boolean {
    const nameLower = telaForm.name.toLowerCase().trim()
    return fabrics.some((f: any) => {
      if (editingTelaGroup?.items.some((i: any) => i.id === f.id)) return false
      if (f.name.toLowerCase().trim() !== nameLower) return false
      if (f.fabric_type !== telaForm.fabric_type) return false
      if (telaForm.fabric_type === 'temporada') {
        return f.season === telaForm.season && Number(f.season_year) === Number(telaForm.season_year)
      }
      return true
    })
  }

  function submitTela(e: React.FormEvent) {
    e.preventDefault()
    setTelaFormError('')
    if (isDuplicateTela()) {
      const where = telaForm.fabric_type === 'temporada'
        ? ` de temporada ${telaForm.season} ${telaForm.season_year}`
        : ' de línea'
      setTelaFormError(`Ya existe una tela llamada "${telaForm.name}"${where}.`)
      return
    }
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
  const [modeloSearch, setModeloSearch] = useState('')
  const [modeloSeasonFilter, setModeloSeasonFilter] = useState('')
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
      toast.success(editingModelo ? 'Modelo actualizado' : 'Modelo creado')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al guardar el modelo'),
  })

  const deleteModeloMutation = useMutation({
    mutationFn: (id: string) => del(`/api/models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success('Modelo eliminado')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al eliminar'),
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

  const modeloSeasonOptions = useMemo(() => {
    const seasons = new Set(modelos.map((m: any) => `${m.season}-${m.season_year}`))
    return [
      { value: '', label: 'Todas las temporadas' },
      ...[...seasons]
        .sort((a, b) => b.localeCompare(a))
        .map((key) => {
          const [s, y] = key.split('-')
          return { value: key, label: seasonLabel(s, Number(y)) }
        }),
    ]
  }, [modelos])

  const modelosFiltered = useMemo(() => {
    let result = modelos
    if (modeloSearch) {
      const q = modeloSearch.toLowerCase()
      result = result.filter((m: any) => String(m.number).toLowerCase().includes(q))
    }
    if (modeloSeasonFilter) {
      const [s, y] = modeloSeasonFilter.split('-')
      result = result.filter((m: any) => m.season === s && String(m.season_year) === y)
    }
    return result
  }, [modelos, modeloSearch, modeloSeasonFilter])

  // ── FabricGroupRow ─────────────────────────────────────────────────────
  function FabricGroupRow({ group }: { group: FabricGroup }) {
    const pieceType = group.items[0]?.piece_type
    const pc = PIECE_COLOR[pieceType]
    return (
      <div
        className="py-3 flex items-center justify-between gap-4 group"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="font-medium w-36 flex-shrink-0 text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
            {group.name}
          </span>
          {pieceType && pc && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ background: pc.bg, color: pc.text }}
            >
              {PIECE_LABEL[pieceType] || pieceType}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item: any) => (
              <span
                key={item.id}
                className="text-[11px] px-2.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
              >
                {item.color || '—'}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openTelaModal(group)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar "${group.name}" con todos sus colores?`))
                deleteTelaMutation.mutate(group.items.map((i: any) => i.id))
            }}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: typeof Scissors }[] = [
    { key: 'telas',   label: 'Telas',   icon: Scissors },
    { key: 'modelos', label: 'Modelos', icon: Layers },
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
      <div
        className="flex gap-1 mb-6 relative"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="relative px-4 py-2.5 text-[14px] font-medium transition-colors flex items-center gap-1.5"
            style={{
              color: tab === key ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: 'none',
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
            {tab === key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: 'var(--color-accent)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {tab === 'telas' && (
          <motion.div
            key="telas"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="space-y-4"
          >
            {/* Barra de búsqueda y filtro */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={telaSearch}
                  onChange={(e) => setTelaSearch(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border outline-none"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                {telaSearch && (
                  <button
                    onClick={() => setTelaSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <select
                value={telaSeasonFilter}
                onChange={(e) => setTelaSeasonFilter(e.target.value)}
                className="px-3 py-2 text-[13px] rounded-lg border outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {seasonFilterOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Telas de Línea */}
            {(telaSeasonFilter === '' || telaSeasonFilter === 'linea') && (
              <Card
                title="Telas de Línea"
                action={<span className="text-[12px] font-normal" style={{ color: 'var(--color-text-muted)' }}>{lineaFiltered.length} telas</span>}
              >
                {lineaFiltered.length === 0 ? (
                  <p className="text-[13px] py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    {telaSearch ? 'Sin resultados para esa búsqueda' : 'Sin telas de línea registradas'}
                  </p>
                ) : (
                  <motion.div variants={fadeInList} initial="hidden" animate="visible">
                    {lineaFiltered.map((group) => (
                      <motion.div key={group.name} variants={fadeInItem}>
                        <FabricGroupRow group={group} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </Card>
            )}

            {/* Telas de Temporada */}
            {temporadaFilteredEntries
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([key, groups]) => {
                const [s, y] = key.split('-')
                return (
                  <Card
                    key={key}
                    title={`Telas de Temporada · ${seasonLabel(s, Number(y))}`}
                    action={<span className="text-[12px] font-normal" style={{ color: 'var(--color-text-muted)' }}>{groups.length} telas</span>}
                  >
                    <motion.div variants={fadeInList} initial="hidden" animate="visible">
                      {groups.map((group) => (
                        <motion.div key={group.name} variants={fadeInItem}>
                          <FabricGroupRow group={group} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </Card>
                )
              })}

            {fabrics.length === 0 && (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-card)' }}>
                <EmptyState
                  icon={Scissors}
                  title="Sin telas registradas"
                  description="Agrega la primera tela usando el botón superior."
                  action={
                    <Button size="sm" onClick={() => openTelaModal()}>
                      <Plus className="h-4 w-4" /> Nueva tela
                    </Button>
                  }
                />
              </div>
            )}
          </motion.div>
        )}

        {tab === 'modelos' && (
          <motion.div
            key="modelos"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="space-y-3"
          >
            {/* Barra de búsqueda y filtro */}
            {modelos.length > 0 && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    value={modeloSearch}
                    onChange={(e) => setModeloSearch(e.target.value)}
                    placeholder="Buscar por número..."
                    className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border outline-none"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {modeloSearch && (
                    <button
                      onClick={() => setModeloSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <select
                  value={modeloSeasonFilter}
                  onChange={(e) => setModeloSeasonFilter(e.target.value)}
                  className="px-3 py-2 text-[13px] rounded-lg border outline-none"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {modeloSeasonOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {modelos.length === 0 ? (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-card)' }}>
                <EmptyState
                  icon={Layers}
                  title="Sin modelos registrados"
                  description="Crea el primer modelo para empezar a ofrecer combinaciones."
                  action={
                    <Button size="sm" onClick={() => openModeloModal()}>
                      <Plus className="h-4 w-4" /> Nuevo modelo
                    </Button>
                  }
                />
              </div>
            ) : modelosFiltered.length === 0 ? (
              <p className="text-[13px] py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Sin resultados para esa búsqueda
              </p>
            ) : (
              <Card>
                <motion.div variants={fadeInList} initial="hidden" animate="visible">
                  {modelosFiltered.map((m: any) => (
                    <motion.div
                      key={m.id}
                      variants={fadeInItem}
                      className="py-4 flex items-start justify-between gap-4 group"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--color-accent-light)' }}
                        >
                          <span className="font-bold text-[13px]" style={{ color: 'var(--color-accent)' }}>
                            #{m.number}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
                              Modelo #{m.number}
                            </span>
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
                            >
                              {seasonLabel(m.season, m.season_year)}
                            </span>
                            {!m.active && (
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                              >
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3">
                            {[
                              { label: 'Chaleco',  fabric: m.chaleco_material },
                              { label: 'Blusa',    fabric: m.blusa_material },
                              { label: 'Pantalón', fabric: m.pantalon_material },
                            ].map(({ label, fabric }) => (
                              <div key={label} className="text-[12px]">
                                <span style={{ color: 'var(--color-text-muted)' }}>{label}: </span>
                                {fabric
                                  ? <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{fabric.name}{fabric.color ? ` · ${fabric.color}` : ''}</span>
                                  : <span style={{ color: 'var(--color-border-strong)', fontStyle: 'italic' }}>—</span>
                                }
                              </div>
                            ))}
                          </div>
                          {m.notes && (
                            <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{m.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleModeloMutation.mutate({ id: m.id, active: !m.active })}
                          className="text-[11px] px-2 py-1 rounded-full font-medium transition-colors"
                          style={
                            m.active
                              ? { background: '#F0FDF4', color: '#059669' }
                              : { background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }
                          }
                        >
                          {m.active ? 'Activo' : 'Inactivo'}
                        </button>
                        <button
                          onClick={() => openModeloModal(m)}
                          className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar Modelo #${m.number}?`)) deleteModeloMutation.mutate(m.id) }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Tela ── */}
      <Modal open={telaModal} onClose={closeTelaModal} title={editingTelaGroup ? 'Editar tela' : 'Nueva tela'}>
        <form onSubmit={submitTela} className="space-y-4">
          <Input
            label="Nombre de tela"
            value={telaForm.name}
            onChange={(e) => { setTelaForm({ ...telaForm, name: e.target.value.toUpperCase() }); setTelaFormError('') }}
            required
          />
          {telaFormError && (
            <p className="text-[13px] text-red-500 -mt-2">{telaFormError}</p>
          )}

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
            label="Uso de pieza *"
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
            required
          />

          {/* Colores dinámicos */}
          <div>
            <label className="text-[13px] font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Colores disponibles
            </label>
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
                      className="p-1.5 flex-shrink-0 mt-0.5 transition-colors"
                      style={{ color: 'var(--color-border-strong)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-border-strong)')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addColor}
              className="mt-2 text-[12px] font-medium flex items-center gap-1 transition-colors"
              style={{ color: 'var(--color-accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Plus className="h-3.5 w-3.5" /> Agregar color
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeTelaModal}>Cancelar</Button>
            <Button type="submit" loading={saveTelasMutation.isPending}>
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
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Combinación de telas
            </p>
            <SearchSelect
              label="Tela para Chaleco / Saco"
              value={modeloForm.chaleco_material_id}
              onChange={(v) => setModeloForm({ ...modeloForm, chaleco_material_id: v })}
              options={chalecoOptions}
              placeholder="Buscar tela de chaleco..."
            />
            <SearchSelect
              label="Tela para Blusa / Camisa"
              value={modeloForm.blusa_material_id}
              onChange={(v) => setModeloForm({ ...modeloForm, blusa_material_id: v })}
              options={blusaOptions}
              placeholder="Buscar tela de blusa..."
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
            <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Observaciones
            </label>
            <textarea
              value={modeloForm.notes}
              onChange={(e) => setModeloForm({ ...modeloForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-[14px] bg-white outline-none transition-all resize-none border-[var(--color-border-strong)] focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)]"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModeloModal}>Cancelar</Button>
            <Button type="submit" loading={saveModeloMutation.isPending}>
              {editingModelo ? 'Guardar cambios' : 'Crear modelo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
