import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Pencil, Trash2, UserPlus, AlertTriangle, CheckCircle, FileDown, Truck, X, Check, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { PasswordConfirmModal } from '../../components/ui/PasswordConfirmModal'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, post, put, patch, del, download } = useApi()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const [quotationsModal, setQuotationsModal] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [employeeModal, setEmployeeModal] = useState(false)
  const [itemForm, setItemForm] = useState({
    piece_type: '',
    fabric_id: '',
    model_id: '',
    quantity: '',
    price_per_unit: '',
    item_notes: '',
  })
  const emptyEmpForm = {
    name: '', folio: '', department: '', position: '',
    chaleco_talla: '', chaleco_notas: '',
    blusa_talla: '',   blusa_notas: '',
    pantalon_talla: '', pantalon_notas: '',
  }
  const [empForm, setEmpForm] = useState(emptyEmpForm)
  const [empSearch, setEmpSearch] = useState('')
  const [empPieceFilter, setEmpPieceFilter] = useState<'' | 'chaleco' | 'blusa' | 'pantalon'>('')
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [statusPwError, setStatusPwError] = useState('')
  const [poModal, setPoModal] = useState(false)
  const [poSupplierId, setPoSupplierId] = useState('')
  const [poRows, setPoRows] = useState([{ material_id: '', quantity: '', unit_price: '' }])
  const [deleteItemError, setDeleteItemError] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => get<any>(`/api/orders/${id}`),
  })

  const { data: materialCheck } = useQuery({
    queryKey: ['orders', id, 'check'],
    queryFn: () => get<any>(`/api/orders/${id}/check-materials`),
    enabled: !!order && order.order_items?.length > 0,
  })

  const { data: purchaseOrders = [] } = useQuery<any[]>({
    queryKey: ['orders', id, 'purchase-orders'],
    queryFn: () => get<any[]>(`/api/orders/${id}/purchase-orders`),
    enabled: !!id,
  })

  const { data: clientQuotations = [] } = useQuery<any[]>({
    queryKey: ['quotations', order?.client_id],
    queryFn: () => get<any[]>(`/api/quotations?client_id=${order!.client_id}`),
    enabled: !!order?.client_id,
  })

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ['suppliers'],
    queryFn: () => get<any[]>('/api/suppliers'),
    enabled: poModal,
  })

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ['materials'],
    queryFn: () => get<any[]>('/api/materials'),
    enabled: poModal,
  })

  const { data: fabrics = [] } = useQuery<any[]>({
    queryKey: ['fabrics-active'],
    queryFn: () => get<any[]>('/api/materials?limit=200'),
    select: (data: any[]) => data.filter((m) => m.fabric_type),
    enabled: itemModal,
  })

  const { data: models = [] } = useQuery<any[]>({
    queryKey: ['models-active'],
    queryFn: () => get<any[]>('/api/models?active=true'),
    enabled: itemModal,
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, password }: { status: string; password: string }) =>
      patch(`/api/orders/${id}/status`, { status, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      setPendingStatus(null)
      setStatusConfirmOpen(false)
      setStatusPwError('')
      toast.success('Estado del pedido actualizado')
    },
    onError: (err: any) => {
      setStatusPwError(err?.message || 'Contraseña incorrecta o sin permisos suficientes')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => put(`/api/orders/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', id] }),
    onError: (err: any) => toast.error(err?.message || 'Error al guardar'),
  })

  const emptyItemForm = { piece_type: '', fabric_id: '', model_id: '', quantity: '', price_per_unit: '', item_notes: '' }
  const [itemMode, setItemMode] = useState<'catalogo' | 'libre'>('catalogo')

  function openAddItem() {
    setEditingItem(null)
    setItemForm(emptyItemForm)
    setItemMode('catalogo')
    setItemModal(true)
  }

  function openEditItem(item: any) {
    setEditingItem(item)
    setItemForm({
      piece_type: item.piece_type || item.uniform_type || '',
      fabric_id: item.fabric_id || '',
      model_id: item.model_id || '',
      quantity: String(item.quantity),
      price_per_unit: String(item.price_per_unit),
      item_notes: item.item_notes || '',
    })
    setItemModal(true)
  }

  function closeItemModal() {
    setItemModal(false)
    setEditingItem(null)
    setItemForm(emptyItemForm)
    setItemMode('catalogo')
  }

  const addItemMutation = useMutation({
    mutationFn: (data: any) => post(`/api/orders/${id}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'check'] })
      closeItemModal()
      toast.success('Ítem agregado')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al agregar ítem'),
  })

  const updateItemMutation = useMutation({
    mutationFn: (data: any) => put(`/api/order-items/${editingItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'check'] })
      closeItemModal()
      toast.success('Ítem actualizado')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al actualizar ítem'),
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => del(`/api/order-items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'check'] })
      setDeleteItemError('')
      toast.success('Ítem eliminado')
    },
    onError: (err: any) => {
      setDeleteItemError(err?.message || 'Error al eliminar el ítem. Intenta de nuevo.')
      toast.error(err?.message || 'Error al eliminar el ítem')
    },
  })

  const addEmployeeMutation = useMutation({
    mutationFn: (data: any) => post<any>(`/api/orders/${id}/employees`, data),
    onError: (err: any) => toast.error(err?.message || 'Error al agregar empleado'),
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: (empId: string) => del(`/api/employees/${empId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      toast.success('Empleado eliminado')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al eliminar empleado'),
  })

  const PIECE_KEYS = ['chaleco', 'blusa', 'pantalon'] as const

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault()
    try {
      const employee = await addEmployeeMutation.mutateAsync({
        name: empForm.name,
        folio: empForm.folio || undefined,
        department: empForm.department || undefined,
        position: empForm.position || undefined,
      })
      const measurementData: Record<string, number | string> = {}
      for (const piece of PIECE_KEYS) {
        const talla = empForm[`${piece}_talla` as keyof typeof empForm]
        const notas = empForm[`${piece}_notas` as keyof typeof empForm]
        if (talla) measurementData[`${piece}_talla`] = Number(talla)
        if (notas) measurementData[`${piece}_notas`] = notas
      }
      if (Object.keys(measurementData).length > 0) {
        await put(`/api/employees/${employee.id}/measurements`, measurementData)
      }
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      setEmployeeModal(false)
      setEmpForm(emptyEmpForm)
      toast.success('Empleado agregado')
    } catch {
      // error ya mostrado por onError
    }
  }

  const createPoMutation = useMutation({
    mutationFn: (data: any) => post('/api/purchase-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'purchase-orders'] })
      closePoModal()
      toast.success('Orden de compra creada')
    },
    onError: (err: any) => toast.error(err?.message || 'Error al crear la orden'),
  })

  const updatePoStatusMutation = useMutation({
    mutationFn: ({ poId, status }: { poId: string; status: string }) =>
      patch(`/api/purchase-orders/${poId}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(status === 'recibida' ? 'OC marcada como recibida — inventario actualizado' : `OC actualizada`)
    },
    onError: (err: any) => toast.error(err?.message || 'Error al actualizar la OC'),
  })

  const handleDownloadPurchaseOrder = async () => {
    setDownloading(true)
    try {
      const blob = await download(`/api/orders/${id}/purchase-order`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `OrdenCompra-${id?.slice(0, 8).toUpperCase()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar la orden de compra')
    } finally {
      setDownloading(false)
    }
  }

  const closePoModal = () => {
    setPoModal(false)
    setPoSupplierId('')
    setPoRows([{ material_id: '', quantity: '', unit_price: '' }])
  }

  const handleCreatePo = () => {
    const items = poRows
      .filter((r) => r.material_id && r.quantity)
      .map((r) => ({
        material_id: r.material_id,
        quantity: Number(r.quantity),
        unit_price: r.unit_price ? Number(r.unit_price) : undefined,
      }))
    if (!poSupplierId || items.length === 0) return
    createPoMutation.mutate({ supplier_id: poSupplierId, order_id: id, items })
  }

  if (isLoading) return <div className="text-gray-400">Cargando...</div>
  if (!order) return <div className="text-gray-400">Pedido no encontrado</div>

  return (
    <div>
      <button
        onClick={() => navigate('/pedidos')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </button>

      <PageHeader
        title={`Pedido #${order.id.slice(0, 8)}`}
        subtitle={order.clients?.company_name}
        action={<StatusBadge status={order.status} />}
      />

      {/* Estado del pedido — ancho completo, antes del grid */}
      <div className="mb-6">
        <Card title="Estado del pedido">
          {(() => {
            const STATUS_FLOW = [
              { key: 'cotizacion',      label: 'Cotización',      color: '#6B7280' },
              { key: 'aprobado',        label: 'Aprobado',        color: '#4F52D6' },
              { key: 'anticipo_pagado', label: 'Anticipo pagado', color: '#7C3AED' },
              { key: 'en_produccion',   label: 'En producción',   color: '#D97706' },
              { key: 'terminado',       label: 'Terminado',       color: '#059669' },
              { key: 'entregado',       label: 'Entregado',       color: '#0D9E6B' },
            ]
            const currentIdx = STATUS_FLOW.findIndex((s) => s.key === order.status)
            return (
              <div className="space-y-4">
                {/* Timeline */}
                <div className="relative">
                  <div
                    className="absolute top-3.5 left-3.5 right-3.5 h-0.5"
                    style={{ background: 'var(--color-border)' }}
                  />
                  <div className="relative flex justify-between">
                    {STATUS_FLOW.map((s, idx) => {
                      const isPast    = idx < currentIdx
                      const isCurrent = idx === currentIdx
                      const isFuture  = idx > currentIdx
                      return (
                        <div key={s.key} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                            style={{
                              background: isFuture ? 'var(--color-surface-2)' : s.color,
                              border: isCurrent ? `3px solid ${s.color}` : 'none',
                              boxShadow: isCurrent ? `0 0 0 3px ${s.color}30` : undefined,
                            }}
                          >
                            {isPast ? (
                              <Check className="h-3.5 w-3.5 text-white" />
                            ) : isCurrent ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                            ) : (
                              <span className="w-2 h-2 rounded-full block" style={{ background: 'var(--color-border-strong)' }} />
                            )}
                          </div>
                          <span
                            className="text-[10px] text-center leading-tight"
                            style={{
                              color: isFuture ? 'var(--color-text-muted)' : isCurrent ? s.color : 'var(--color-text-secondary)',
                              fontWeight: isCurrent ? 600 : 400,
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Cancelado aparte */}
                {order.status === 'cancelado' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
                    <StatusBadge status="cancelado" size="sm" />
                    <span className="text-[12px] text-amber-700">Pedido pausado</span>
                  </div>
                )}

                {/* Selector horizontal */}
                <div className="pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <p className="text-label mb-2">Cambiar a:</p>
                  <div className="flex flex-wrap gap-2">
                    {[...STATUS_FLOW, { key: 'cancelado', label: 'Pausado', color: '#D97706' }]
                      .filter((s) => s.key !== order.status)
                      .map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setPendingStatus(pendingStatus === s.key ? null : s.key)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all"
                          style={
                            pendingStatus === s.key
                              ? { background: `${s.color}15`, border: `1px solid ${s.color}50` }
                              : { border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }
                          }
                          onMouseEnter={(e) => { if (pendingStatus !== s.key) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                          onMouseLeave={(e) => { if (pendingStatus !== s.key) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                          {s.label}
                        </button>
                      ))
                    }
                  </div>
                </div>

                {pendingStatus && pendingStatus !== order.status && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={() => setPendingStatus(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setStatusPwError(''); setStatusConfirmOpen(true) }}
                    >
                      Confirmar
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cotizaciones del cliente */}
          {order?.client_id && (
            <div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
                onClick={() => setQuotationsModal(true)}
              >
                <FileDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                Ver cotizaciones del cliente
                {clientQuotations.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-bold"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    {clientQuotations.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Items */}
          <Card
            title="Items del pedido"
            action={
              <Button size="sm" onClick={openAddItem}>
                <Plus className="h-3.5 w-3.5" /> Agregar item
              </Button>
            }
          >
            <Table
              columns={[
                {
                  key: 'piece_type',
                  header: 'Pieza',
                  render: (r: any) => (
                    <div>
                      <span className="font-semibold text-gray-900">{r.piece_type || r.uniform_type}</span>
                      {r.model && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          Mod. #{r.model.number} {r.model.season}{r.model.season_year}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'fabric',
                  header: 'Tela',
                  render: (r: any) => r.fabric
                    ? <span className="text-sm text-gray-700">{r.fabric.name}{r.fabric.code ? ` (${r.fabric.code})` : ''}</span>
                    : <span className="text-xs text-gray-300">—</span>,
                },
                { key: 'quantity', header: 'Cant.' },
                {
                  key: 'price_per_unit',
                  header: 'P. unit.',
                  render: (r: any) => `$${Number(r.price_per_unit).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                },
                {
                  key: 'subtotal',
                  header: 'Subtotal',
                  render: (r: any) => (
                    <span className="font-medium">
                      ${(r.quantity * r.price_per_unit).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  render: (r: any) => (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditItem(r)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Eliminar este ítem?')) deleteItemMutation.mutate(r.id) }}
                        disabled={deleteItemMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={order.order_items || []}
              emptyMessage="Sin ítems"
            />
            {deleteItemError && (
              <p className="mt-2 text-sm text-red-500">{deleteItemError}</p>
            )}
          </Card>

          {/* Material check */}
          {materialCheck && (
            <Card title="Verificacion de materiales">
              {materialCheck.can_produce ? (
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Materiales suficientes para producir</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 text-amber-600 mb-4">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Faltan materiales</span>
                  </div>
                  <Table
                    columns={[
                      { key: 'material_name', header: 'Material' },
                      { key: 'quantity_needed', header: 'Necesario' },
                      { key: 'quantity_available', header: 'Disponible' },
                      { key: 'shortage', header: 'Faltante', render: (r: any) => r.shortage > 0 ? <span className="text-red-600 font-medium">{r.shortage} {r.unit}</span> : '-' },
                      { key: 'sufficient', header: 'Estado', render: (r: any) => r.sufficient ? <StatusBadge status="recibida" /> : <StatusBadge status="cancelado" /> },
                    ]}
                    data={materialCheck.checks || []}
                  />
                </div>
              )}
            </Card>
          )}

          {/* Purchase orders */}
          <Card
            title="Pedidos a proveedores"
            action={
              <Button size="sm" onClick={() => setPoModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Nueva orden
              </Button>
            }
          >
            {purchaseOrders.length === 0 ? (
              <p className="text-sm text-gray-400">Sin pedidos a proveedores registrados</p>
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((po: any) => (
                  <div key={po.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{po.suppliers?.name}</span>
                        <StatusBadge status={po.status} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 mr-1">
                          {new Date(po.created_at).toLocaleDateString()}
                        </span>
                        {po.status === 'pendiente' && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updatePoStatusMutation.mutate({ poId: po.id, status: 'enviada' })}
                              disabled={updatePoStatusMutation.isPending}
                            >
                              Enviada
                            </Button>
                            <button
                              onClick={() => {
                                if (confirm('¿Cancelar esta orden de compra?'))
                                  updatePoStatusMutation.mutate({ poId: po.id, status: 'cancelada' })
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {po.status === 'enviada' && (
                          <Button
                            size="sm"
                            onClick={() => updatePoStatusMutation.mutate({ poId: po.id, status: 'recibida' })}
                            disabled={updatePoStatusMutation.isPending}
                          >
                            Recibida
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {po.purchase_order_items?.map((item: any) => (
                        <div key={item.id} className="px-4 py-2 flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.materials?.name}</span>
                          <span className="text-gray-500">
                            {item.quantity} {item.materials?.unit}
                            {item.unit_price ? ` · $${Number(item.unit_price).toLocaleString()}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Employees */}
          {(() => {
            const PIECE_LABELS = [
              { key: 'chaleco',  label: 'Chaleco' },
              { key: 'blusa',    label: 'Blusa' },
              { key: 'pantalon', label: 'Pantalón' },
            ] as const

            const allEmployees: any[] = order.employees || []

            const filteredEmps = allEmployees.filter((emp) => {
              const m = emp.measurements?.[0] || emp.measurements || {}
              const matchName = !empSearch || emp.name?.toLowerCase().includes(empSearch.toLowerCase())
              const matchPiece = !empPieceFilter || !!m[`${empPieceFilter}_talla`]
              return matchName && matchPiece
            })

            return (
              <Card
                title={`Empleados de la empresa${allEmployees.length > 0 ? ` (${allEmployees.length})` : ''}`}
                action={
                  <Button size="sm" onClick={() => setEmployeeModal(true)}>
                    <UserPlus className="h-3.5 w-3.5" /> Agregar
                  </Button>
                }
              >
                {allEmployees.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    {/* Búsqueda por nombre */}
                    <div className="relative flex-1 max-w-xs">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                      <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 border rounded-lg text-[13px] outline-none transition-all"
                        style={{
                          borderColor: 'var(--color-border-strong)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    {/* Filtros por pieza */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setEmpPieceFilter('')}
                        className="h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
                        style={
                          empPieceFilter === ''
                            ? { background: 'var(--color-text-primary)', color: '#fff' }
                            : { background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                        }
                      >
                        Todos
                      </button>
                      {PIECE_LABELS.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setEmpPieceFilter(empPieceFilter === key ? '' : key)}
                          className="h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
                          style={
                            empPieceFilter === key
                              ? { background: 'var(--color-accent)', color: '#fff' }
                              : { background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Table
                  columns={[
                    {
                      key: 'folio',
                      header: 'Folio',
                      render: (r: any) => r.folio
                        ? <span className="font-mono text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>{r.folio}</span>
                        : <span className="text-xs text-gray-300">—</span>,
                    },
                    { key: 'name', header: 'Nombre', render: (r: any) => <span className="font-medium">{r.name}</span> },
                    { key: 'department', header: 'Depto.' },
                    {
                      key: 'measurements',
                      header: 'Tallas (Ch / Bl / Pt)',
                      render: (r: any) => {
                        const m = r.measurements?.[0] || r.measurements || {}
                        const parts = [
                          { short: 'Ch', talla: m.chaleco_talla, notas: m.chaleco_notas },
                          { short: 'Bl', talla: m.blusa_talla,   notas: m.blusa_notas },
                          { short: 'Pt', talla: m.pantalon_talla, notas: m.pantalon_notas },
                        ]
                        const anyTalla = parts.some((p) => p.talla)
                        if (!anyTalla) return <span className="text-xs text-gray-400">Sin tallas</span>
                        return (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {parts.map(({ short, talla, notas }) =>
                              talla ? (
                                <span key={short} className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }} title={notas || undefined}>
                                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{short}:</span> {talla}
                                  {notas ? <span className="text-gray-400"> · {notas}</span> : null}
                                </span>
                              ) : null
                            )}
                          </div>
                        )
                      },
                    },
                    {
                      key: 'actions', header: '', render: (r: any) => (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/empleados/${r.id}`) }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`¿Eliminar a ${r.name} del pedido?`)) {
                                deleteEmployeeMutation.mutate(r.id)
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={filteredEmps}
                  emptyMessage={
                    (empSearch || empPieceFilter)
                      ? 'Ningún empleado coincide con los filtros'
                      : 'Sin empleados de la empresa registrados'
                  }
                />
              </Card>
            )
          })()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumen financiero */}
          <Card title="Resumen financiero">
            {(() => {
              const subtotal = (order.order_items || []).reduce(
                (sum: number, i: any) => sum + i.quantity * i.price_per_unit, 0
              )
              const applyIva = order.apply_iva !== false
              const iva = applyIva ? subtotal * 0.16 : 0
              const total = subtotal + iva
              const anticipo = total * 0.5
              const retIsr = (total / 1.16) * 0.0125
              const deposito = anticipo - retIsr
              const fmt = (n: number) =>
                n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={applyIva}
                        onChange={(e) => updateMutation.mutate({ apply_iva: e.target.checked })}
                      />
                      IVA (16%)
                    </label>
                    <span>${fmt(iva)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total</span>
                    <span className="text-lg">${fmt(total)}</span>
                  </div>
                  <div className="bg-primary-50 rounded-lg px-3 py-2.5 mt-1 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-700 font-medium">Anticipo (50%)</span>
                      <span className="text-primary-800 font-bold text-base">${fmt(anticipo)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-primary-600">
                      <span>Ret. ISR (1.25%)</span>
                      <span>−${fmt(retIsr)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-primary-100 pt-1">
                      <span className="text-primary-700 font-semibold text-xs">Depósito anticipo</span>
                      <span className="text-primary-900 font-bold">${fmt(deposito)}</span>
                    </div>
                    <p className="text-[10px] text-primary-400">ISR ret. calculado sobre subtotal · 1.25%</p>
                  </div>
                </div>
              )
            })()}
          </Card>

          {/* Datos del pedido */}
          <Card title="Datos del pedido">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Temporada</p>
                <select
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                  value={order.season || ''}
                  onChange={(e) => updateMutation.mutate({ season: e.target.value })}
                >
                  <option value="">— Seleccionar —</option>
                  <option value="OI">Otoño / Invierno</option>
                  <option value="PV">Primavera / Verano</option>
                </select>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Días de entrega (hábiles)</p>
                <Input
                  type="number"
                  defaultValue={order.delivery_days ?? 45}
                  min="1"
                  onBlur={(e) => updateMutation.mutate({ delivery_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <p className="text-gray-500 mb-1">Fecha toma de medidas</p>
                <Input
                  type="date"
                  defaultValue={order.measurements_date || ''}
                  onBlur={(e) => updateMutation.mutate({ measurements_date: e.target.value })}
                />
              </div>
              <div>
                <p className="text-gray-500 mb-1">Fecha de entrega</p>
                <Input
                  type="date"
                  defaultValue={order.delivery_date || ''}
                  onBlur={(e) => updateMutation.mutate({ delivery_date: e.target.value })}
                />
              </div>
              <div>
                <p className="text-gray-500 mb-1">Información adicional</p>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)] resize-none"
                  rows={3}
                  placeholder="Notas, especificaciones, ajustes..."
                  defaultValue={order.additional_info || ''}
                  onBlur={(e) => updateMutation.mutate({ additional_info: e.target.value })}
                />
              </div>
              <div className="pt-1 text-xs text-gray-400">
                Creado: {new Date(order.created_at).toLocaleDateString('es-MX')}
              </div>
            </div>
          </Card>

          <div>
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#C00000' }}
              onClick={handleDownloadPurchaseOrder}
              disabled={downloading}
            >
              <FileDown className="h-4 w-4" />
              {downloading ? 'Generando...' : 'Descargar orden de compra'}
            </button>
          </div>


        </div>
      </div>

      {/* Quotations modal */}
      <Modal
        open={quotationsModal}
        onClose={() => setQuotationsModal(false)}
        title="Cotizaciones del cliente"
      >
        {clientQuotations.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Este cliente no tiene cotizaciones registradas aún.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {clientQuotations.map((q: any) => {
              const qDate = new Date(q.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
              const createdAt = new Date(q.created_at).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
              const qTotal = Number(q.total).toLocaleString('es-MX', {
                style: 'currency', currency: 'MXN',
              })
              return (
                <div
                  key={q.id}
                  className="rounded-xl px-4 py-3.5"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
                        {q.temporada_label}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        Fecha: {qDate} · Creada el {createdAt}
                      </p>
                    </div>
                    <p className="font-bold text-[15px] flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                      {qTotal}
                    </p>
                  </div>
                  {Array.isArray(q.items) && q.items.length > 0 && (
                    <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--color-border)' }}>
                      {(q.items as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[13px]">
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {item.cantidad}× {item.descripcion}
                          </span>
                          <span className="font-medium ml-4 flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                            {Number(item.precio_unitario).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      {/* Add item modal */}
      <Modal
        open={itemModal}
        onClose={closeItemModal}
        title={editingItem ? 'Editar pieza del pedido' : 'Agregar pieza al pedido'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const payload = {
              piece_type: itemForm.piece_type,
              fabric_id: itemMode === 'libre' ? null : (itemForm.fabric_id || null),
              model_id: itemMode === 'libre' ? null : (itemForm.model_id || null),
              quantity: Number(itemForm.quantity),
              price_per_unit: Number(itemForm.price_per_unit),
              item_notes: itemForm.item_notes || null,
            }
            if (editingItem) {
              updateItemMutation.mutate(payload)
            } else {
              addItemMutation.mutate(payload)
            }
          }}
          className="space-y-4"
        >
          {/* Toggle modo */}
          {!editingItem && (
            <div className="flex rounded-lg p-1 gap-1" style={{ background: 'var(--color-surface-2)' }}>
              {([
                { key: 'catalogo', label: 'Desde catálogo' },
                { key: 'libre',    label: 'Forma libre' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setItemMode(key); setItemForm(emptyItemForm) }}
                  className="flex-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all"
                  style={
                    itemMode === key
                      ? { background: 'var(--color-surface)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                      : { color: 'var(--color-text-muted)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── FORMA LIBRE ─────────────────────────────────────────── */}
          {itemMode === 'libre' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del producto *
              </label>
              <input
                required
                type="text"
                value={itemForm.piece_type}
                onChange={(e) => setItemForm({ ...itemForm, piece_type: e.target.value })}
                placeholder="Ej: Camisa manga larga azul marino, Gorra bordada, Chaleco de seguridad..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)]"
              />
            </div>
          )}

          {/* ── DESDE CATÁLOGO ──────────────────────────────────────── */}
          {itemMode === 'catalogo' && (<>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo / Maqueta <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              value={itemForm.model_id}
              onChange={(e) => {
                const modelId = e.target.value
                if (!modelId) {
                  setItemForm({ ...itemForm, model_id: '' })
                  return
                }
                const model = (models as any[]).find((m) => m.id === modelId)
                if (!model) return
                const pieceToFabric: Record<string, string> = {
                  'Blusa': model.blusa_material_id || '',
                  'Camisa': model.blusa_material_id || '',
                  'Chaleco': model.chaleco_material_id || '',
                  'Saco': model.chaleco_material_id || '',
                  'Pantalón': model.pantalon_material_id || '',
                  'Falda': model.pantalon_material_id || '',
                }
                const suggestedFabric = itemForm.piece_type
                  ? (pieceToFabric[itemForm.piece_type] || '')
                  : ''
                setItemForm({ ...itemForm, model_id: modelId, fabric_id: suggestedFabric })
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)]"
            >
              <option value="">— Sin modelo base —</option>
              {(models as any[]).map((m: any) => (
                <option key={m.id} value={m.id}>
                  Modelo #{m.number} · {m.season === 'OI' ? 'Otoño/Invierno' : 'Primavera/Verano'} {m.season_year}
                </option>
              ))}
            </select>
            {itemForm.model_id && (() => {
              const m = (models as any[]).find((x) => x.id === itemForm.model_id)
              if (!m) return null
              return (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
                  {m.blusa_material && <div><span className="text-gray-400">Blusa:</span> {m.blusa_material.name}</div>}
                  {m.chaleco_material && <div><span className="text-gray-400">Chaleco:</span> {m.chaleco_material.name}</div>}
                  {m.pantalon_material && <div><span className="text-gray-400">Pantalón:</span> {m.pantalon_material.name}</div>}
                </div>
              )
            })()}
          </div>

          {/* Tipo de pieza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pieza *</label>
            <select
              required
              value={itemForm.piece_type}
              onChange={(e) => {
                const pieceType = e.target.value
                const model = (models as any[]).find((m) => m.id === itemForm.model_id)
                let suggestedFabric = itemForm.fabric_id
                if (model) {
                  const map: Record<string, string> = {
                    'Blusa': model.blusa_material_id || '',
                    'Camisa': model.blusa_material_id || '',
                    'Chaleco': model.chaleco_material_id || '',
                    'Saco': model.chaleco_material_id || '',
                    'Pantalón': model.pantalon_material_id || '',
                    'Falda': model.pantalon_material_id || '',
                  }
                  suggestedFabric = map[pieceType] || ''
                }
                setItemForm({ ...itemForm, piece_type: pieceType, fabric_id: suggestedFabric })
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)]"
            >
              <option value="">— Seleccionar pieza —</option>
              <option value="Blusa">Blusa</option>
              <option value="Camisa">Camisa</option>
              <option value="Chaleco">Chaleco</option>
              <option value="Saco">Saco</option>
              <option value="Pantalón">Pantalón</option>
              <option value="Falda">Falda</option>
              <option value="Conjunto">Conjunto completo</option>
            </select>
          </div>

          {/* Tela */}
          {(() => {
            const pt = itemForm.piece_type
            const pieceMap: Record<string, string[]> = {
              'Blusa': ['blusa'], 'Camisa': ['blusa'],
              'Chaleco': ['chaleco', 'Ch/P'], 'Saco': ['chaleco', 'Ch/P'],
              'Pantalón': ['pantalon', 'Ch/P'], 'Falda': ['pantalon', 'Ch/P'],
            }
            const allowed = pieceMap[pt]
            const fabricList = allowed
              ? (fabrics as any[]).filter((f: any) => allowed.includes(f.piece_type))
              : (fabrics as any[])
            const fabricOptions = fabricList.map((f: any) => ({
              value: f.id,
              label: [
                f.name,
                f.color || null,
                f.fabric_type === 'temporada' ? `(${f.season}${f.season_year})` : null,
              ].filter(Boolean).join(' · '),
            }))
            return (
              <div>
                <SearchSelect
                  label="Tela (del catálogo)"
                  value={itemForm.fabric_id}
                  onChange={(val) => setItemForm({ ...itemForm, fabric_id: val })}
                  options={fabricOptions}
                  placeholder="Buscar tela..."
                />
                {allowed && fabricList.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay telas registradas para este tipo de pieza.
                  </p>
                )}
              </div>
            )
          })()}
          </>)}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad *"
              type="number"
              value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
              required
              min="1"
            />
            <Input
              label="Precio unitario *"
              type="number"
              value={itemForm.price_per_unit}
              onChange={(e) => setItemForm({ ...itemForm, price_per_unit: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          {itemForm.quantity && itemForm.price_per_unit && (
            <div className="bg-primary-50 rounded-lg px-3 py-2 text-sm flex justify-between">
              <span className="text-primary-700">Subtotal</span>
              <span className="font-semibold text-primary-800">
                ${(Number(itemForm.quantity) * Number(itemForm.price_per_unit))
                  .toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={itemForm.item_notes}
              onChange={(e) => setItemForm({ ...itemForm, item_notes: e.target.value })}
              rows={2}
              placeholder="Especificaciones, ajustes, detalles adicionales..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeItemModal}>Cancelar</Button>
            <Button type="submit" disabled={addItemMutation.isPending || updateItemMutation.isPending}>
              {addItemMutation.isPending || updateItemMutation.isPending
                ? 'Guardando...'
                : editingItem ? 'Guardar cambios' : 'Agregar pieza'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add employee modal */}
      <Modal open={employeeModal} onClose={() => { setEmployeeModal(false); setEmpForm(emptyEmpForm) }} title="Agregar empleado" size="md">
        <form onSubmit={handleAddEmployee} className="space-y-5">
          {/* Datos básicos */}
          {(() => {
            const existingDepts = [...new Set((order.employees || []).map((e: any) => e.department).filter(Boolean))] as string[]
            const existingPositions = [...new Set((order.employees || []).map((e: any) => e.position).filter(Boolean))] as string[]
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_140px] gap-4">
                  <Input label="Nombre completo *" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} required />
                  <Input label="Folio interno" value={empForm.folio} onChange={(e) => setEmpForm({ ...empForm, folio: e.target.value })} placeholder="Ej: EMP-001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input label="Departamento" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} list="dept-suggestions" />
                    <datalist id="dept-suggestions">{existingDepts.map((d) => <option key={d} value={d} />)}</datalist>
                  </div>
                  <div>
                    <Input label="Cargo" value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })} list="position-suggestions" />
                    <datalist id="position-suggestions">{existingPositions.map((p) => <option key={p} value={p} />)}</datalist>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Medidas */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-[12px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Tallas por pieza <span className="font-normal normal-case">(opcional)</span>
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>
            <div className="space-y-3">
              {([
                { key: 'chaleco',  label: 'Chaleco' },
                { key: 'blusa',    label: 'Blusa' },
                { key: 'pantalon', label: 'Pantalón' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[80px_1fr] gap-3 items-end">
                  <Input
                    label={label}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Talla"
                    value={empForm[`${key}_talla` as keyof typeof empForm]}
                    onChange={(e) => setEmpForm({ ...empForm, [`${key}_talla`]: e.target.value })}
                  />
                  <Input
                    label="Notas"
                    placeholder="Ej: manga corta, ajustado..."
                    value={empForm[`${key}_notas` as keyof typeof empForm]}
                    onChange={(e) => setEmpForm({ ...empForm, [`${key}_notas`]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setEmployeeModal(false); setEmpForm(emptyEmpForm) }}>Cancelar</Button>
            <Button type="submit" disabled={addEmployeeMutation.isPending}>
              {addEmployeeMutation.isPending ? 'Guardando...' : 'Agregar empleado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create purchase order modal */}
      <Modal open={poModal} onClose={closePoModal} title="Nueva orden de compra">
        <div className="space-y-4">
          <Select
            label="Proveedor *"
            value={poSupplierId}
            onChange={(e) => setPoSupplierId(e.target.value)}
            options={suppliers.map((s: any) => ({ value: s.id, label: s.name }))}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Materiales *</label>
              <button
                type="button"
                onClick={() => setPoRows((r) => [...r, { material_id: '', quantity: '', unit_price: '' }])}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                + Agregar fila
              </button>
            </div>
            <div className="space-y-2">
              {poRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_90px_24px] gap-2 items-center">
                  <Select
                    value={row.material_id}
                    onChange={(e) =>
                      setPoRows((rows) => rows.map((r, j) => j === i ? { ...r, material_id: e.target.value } : r))
                    }
                    options={materials.map((m: any) => ({ value: m.id, label: `${m.name} (${m.unit})` }))}
                  />
                  <Input
                    type="number"
                    placeholder="Cant."
                    value={row.quantity}
                    onChange={(e) =>
                      setPoRows((rows) => rows.map((r, j) => j === i ? { ...r, quantity: e.target.value } : r))
                    }
                    min="0.01"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="$ Unit."
                    value={row.unit_price}
                    onChange={(e) =>
                      setPoRows((rows) => rows.map((r, j) => j === i ? { ...r, unit_price: e.target.value } : r))
                    }
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => setPoRows((rows) => rows.filter((_, j) => j !== i))}
                    disabled={poRows.length === 1}
                    className="text-gray-300 hover:text-red-500 disabled:opacity-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {createPoMutation.isError && (
            <p className="text-sm text-red-500">
              {(createPoMutation.error as any)?.message || 'Error al crear la orden'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closePoModal}>Cancelar</Button>
            <Button
              onClick={handleCreatePo}
              disabled={createPoMutation.isPending || !poSupplierId || poRows.every((r) => !r.material_id)}
            >
              {createPoMutation.isPending ? 'Creando...' : 'Crear orden'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status change confirmation */}
      <PasswordConfirmModal
        open={statusConfirmOpen}
        onClose={() => { setStatusConfirmOpen(false); setStatusPwError('') }}
        onConfirm={(password) => {
          if (pendingStatus) statusMutation.mutate({ status: pendingStatus, password })
        }}
        title="Confirmar cambio de estado"
        description={`El pedido cambiará de "${order.status}" a "${pendingStatus}". Esta accion requiere autorización del administrador.`}
        confirmLabel="Confirmar cambio"
        isPending={statusMutation.isPending}
        error={statusPwError}
      />
    </div>
  )
}
