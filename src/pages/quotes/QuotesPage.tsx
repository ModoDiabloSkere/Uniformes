import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Download, ChevronDown, ChevronUp,
  Users, Mail, Phone, Building2, Calendar, MessageSquare,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { fadeInItem, fadeInList } from '../../lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'nueva' | 'web'

interface QuoteItem {
  id: string
  descripcion: string
  cantidad: number
  precio_unitario: number
}

interface LandingContact {
  id: string
  name: string
  company: string
  email: string
  phone: string | null
  employees: string | null
  message: string
  status: 'nueva' | 'vista' | 'contactada' | 'convertida'
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

const SEASON_LABEL: Record<string, string> = {
  OI: 'Otoño/Invierno',
  PV: 'Primavera/Verano',
}

const WEB_STATUS_LABELS: Record<LandingContact['status'], string> = {
  nueva: 'Nueva', vista: 'Vista', contactada: 'Contactada', convertida: 'Convertida',
}
const WEB_STATUS_COLORS: Record<LandingContact['status'], string> = {
  nueva: 'bg-primary-50 text-primary-700 ring-primary-200',
  vista: 'bg-gray-100 text-gray-600 ring-gray-200',
  contactada: 'bg-blue-50 text-blue-700 ring-blue-200',
  convertida: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}
const WEB_TABS = [
  { label: 'Todas', value: '' },
  { label: 'Nuevas', value: 'nueva' },
  { label: 'Vistas', value: 'vista' },
  { label: 'Contactadas', value: 'contactada' },
  { label: 'Convertidas', value: 'convertida' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

// ─── Web contact row ──────────────────────────────────────────────────────────

function ContactRow({ contact }: { contact: LandingContact }) {
  const [expanded, setExpanded] = useState(false)
  const { patch } = useApi()
  const qc = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (status: LandingContact['status']) =>
      patch(`/api/landing-contacts/${contact.id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['landing-contacts'] }),
  })

  const date = new Date(contact.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        style={{ background: 'var(--color-surface)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
        >
          {contact.name[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--color-text-primary)' }}>
              {contact.name}
            </p>
            <p className="text-[12px] truncate flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              {contact.company}
            </p>
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-[12px] truncate flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              {contact.email}
            </p>
            {contact.phone && (
              <p className="text-[12px] truncate flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                {contact.phone}
              </p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            {contact.employees && (
              <><Users className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />{contact.employees} empleados</>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            <Calendar className="h-3.5 w-3.5" />{date}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${WEB_STATUS_COLORS[contact.status]}`}>
            {WEB_STATUS_LABELS[contact.status]}
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            : <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Datos de contacto
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Mail className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  <a href={`mailto:${contact.email}`} style={{ color: 'var(--color-accent)' }}>{contact.email}</a>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    <Phone className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </div>
                )}
                {contact.employees && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    <Users className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    {contact.employees} empleados
                  </div>
                )}
                <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />{date}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                <MessageSquare className="h-3.5 w-3.5" />Mensaje
              </p>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                {contact.message}
              </p>
            </div>
          </div>
          <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Actualizar estado:</p>
            <div className="flex gap-2 flex-wrap justify-end">
              {(['nueva', 'vista', 'contactada', 'convertida'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => statusMutation.mutate(s)}
                  disabled={statusMutation.isPending || contact.status === s}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    contact.status === s
                      ? `${WEB_STATUS_COLORS[s]} ring-1 cursor-default`
                      : 'border text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                  style={contact.status !== s ? { borderColor: 'var(--color-border)', background: 'var(--color-surface)' } : {}}
                >
                  {WEB_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function QuotesPage() {
  const { get } = useApi()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('nueva')

  // ── Nueva cotización ─────────────────────────────────────────────────────
  const [clienteId, setClienteId] = useState('')
  const [season, setSeason] = useState('OI')
  const [seasonYear, setSeasonYear] = useState(currentYear)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<QuoteItem[]>([
    { id: uid(), descripcion: '', cantidad: 1, precio_unitario: 0 },
  ])
  const [downloading, setDownloading] = useState(false)

  const temporadaLabel = `${SEASON_LABEL[season]} ${seasonYear}`

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients-list'],
    queryFn: () => get<any[]>('/api/clients?limit=200'),
    enabled: tab === 'nueva',
  })

  const clientOptions = useMemo(
    () => clients.map((c: any) => ({ value: c.id, label: c.company_name })),
    [clients]
  )

  const selectedClient = clients.find((c: any) => c.id === clienteId)
  const clienteNombre = selectedClient?.company_name || ''

  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0),
    [items]
  )

  function addItem() {
    setItems((prev) => [...prev, { id: uid(), descripcion: '', cantidad: 1, precio_unitario: 0 }])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateItem(id: string, field: keyof Omit<QuoteItem, 'id'>, value: string | number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  async function handleDownload() {
    if (!clienteId) {
      toast.error('Selecciona un cliente')
      return
    }
    if (items.some((i) => !i.descripcion.trim())) {
      toast.error('Todas las piezas deben tener descripción')
      return
    }
    setDownloading(true)
    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = import.meta.env.VITE_API_URL
      const res = await fetch(`${apiUrl}/api/quotations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          client_id: clienteId,
          cliente_nombre: clienteNombre,
          temporada_label: temporadaLabel,
          fecha,
          items: items.map((i) => ({
            cantidad: i.cantidad,
            descripcion: i.descripcion,
            precio_unitario: i.precio_unitario,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as any).error || 'Error al generar la cotización')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match ? match[1] : 'Cotizacion.docx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Cotización descargada')
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar la cotización')
    } finally {
      setDownloading(false)
    }
  }

  // ── Solicitudes web ──────────────────────────────────────────────────────
  const [webTab, setWebTab] = useState('')
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<LandingContact[]>({
    queryKey: ['landing-contacts', webTab],
    queryFn: () =>
      get<LandingContact[]>(webTab ? `/api/landing-contacts?status=${webTab}` : '/api/landing-contacts'),
    enabled: tab === 'web',
  })
  const newCount = contacts.filter((c) => c.status === 'nueva').length

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: 'nueva', label: 'Nueva cotización' },
    { key: 'web', label: 'Solicitudes web' },
  ]

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle="Crea y descarga cotizaciones o revisa solicitudes de la web"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 relative" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="relative px-4 py-2.5 text-[14px] font-medium transition-colors flex items-center gap-2"
            style={{ color: tab === key ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          >
            {label}
            {key === 'web' && newCount > 0 && tab !== 'web' && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold"
                style={{ background: 'var(--color-accent)' }}
              >
                {newCount}
              </span>
            )}
            {tab === key && (
              <motion.div
                layoutId="quotes-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: 'var(--color-accent)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Tab: Nueva cotización ─────────────────────────────────────── */}
        {tab === 'nueva' && (
          <motion.div
            key="nueva"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="space-y-4"
          >
            {/* Client + season info */}
            <Card title="Datos del cliente">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <SearchSelect
                    label="Cliente"
                    value={clienteId}
                    onChange={setClienteId}
                    options={clientOptions}
                    placeholder="Buscar cliente..."
                    required
                  />
                </div>
                <Select
                  label="Temporada"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  options={[
                    { value: 'OI', label: 'Otoño/Invierno' },
                    { value: 'PV', label: 'Primavera/Verano' },
                  ]}
                />
                <Select
                  label="Año"
                  value={String(seasonYear)}
                  onChange={(e) => setSeasonYear(Number(e.target.value))}
                  options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
                />
              </div>
              <div className="mt-4 max-w-xs">
                <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Fecha de cotización
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-[14px] outline-none transition-all"
                  style={{
                    borderColor: 'var(--color-border-strong)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </Card>

            {/* Items table */}
            <Card
              title="Piezas requeridas"
              action={
                <Button size="sm" variant="secondary" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" /> Agregar pieza
                </Button>
              }
            >
              {/* Header */}
              <div
                className="grid gap-3 pb-2 mb-1 text-[12px] font-semibold uppercase tracking-wide"
                style={{
                  gridTemplateColumns: '1fr 80px 130px 110px 32px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>Descripción</span>
                <span className="text-center">Cant.</span>
                <span className="text-right">Precio unitario</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>

              <motion.div variants={fadeInList} initial="hidden" animate="visible" className="space-y-2 mt-2">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={fadeInItem}
                    className="grid gap-3 items-center"
                    style={{ gridTemplateColumns: '1fr 80px 130px 110px 32px' }}
                  >
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                      placeholder="Ej: Chaleco mod. #3, color azul marino"
                      className="px-3 py-2 border rounded-lg text-[13px] outline-none transition-all w-full"
                      style={{
                        borderColor: 'var(--color-border-strong)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.id, 'cantidad', Math.max(1, Number(e.target.value)))}
                      className="px-3 py-2 border rounded-lg text-[13px] outline-none text-center w-full"
                      style={{
                        borderColor: 'var(--color-border-strong)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.precio_unitario}
                        onChange={(e) => updateItem(item.id, 'precio_unitario', Number(e.target.value))}
                        className="pl-6 pr-3 py-2 border rounded-lg text-[13px] outline-none text-right w-full"
                        style={{
                          borderColor: 'var(--color-border-strong)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    <span
                      className="text-right text-[13px] font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {fmt(item.cantidad * item.precio_unitario)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-1 rounded-lg transition-colors disabled:opacity-30"
                      style={{ color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => { if (items.length > 1) e.currentTarget.style.color = '#DC2626' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>

              {/* Total + download */}
              <div
                className="mt-5 pt-4 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                    Total estimado:
                  </span>
                  <span className="text-[20px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {fmt(total)}
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    (sin IVA)
                  </span>
                </div>
                <Button onClick={handleDownload} loading={downloading}>
                  <Download className="h-4 w-4" />
                  Descargar cotización
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Tab: Solicitudes web ──────────────────────────────────────── */}
        {tab === 'web' && (
          <motion.div
            key="web"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="space-y-4"
          >
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit" style={{ background: 'var(--color-surface-2)' }}>
              {WEB_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setWebTab(t.value)}
                  className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
                  style={
                    webTab === t.value
                      ? { background: 'var(--color-surface)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                      : { color: 'var(--color-text-muted)' }
                  }
                >
                  {t.label}
                  {t.value === 'nueva' && newCount > 0 && webTab !== 'nueva' && (
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      {newCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <Card>
              {loadingContacts ? (
                <div className="py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
              ) : contacts.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-border)' }} />
                  <p className="font-medium text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
                    No hay solicitudes{webTab ? ` con estado "${WEB_STATUS_LABELS[webTab as LandingContact['status']]}"` : ''}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <ContactRow key={contact.id} contact={contact} />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
