import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, UserPlus, AlertTriangle, CheckCircle, FileDown, Truck, X } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { PasswordConfirmModal } from '../../components/ui/PasswordConfirmModal'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, post, put, patch, del, download } = useApi()
  const queryClient = useQueryClient()
  const [downloading, setDownloading] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [employeeModal, setEmployeeModal] = useState(false)
  const [itemForm, setItemForm] = useState({ uniform_type: '', quantity: '', price_per_unit: '' })
  const [empForm, setEmpForm] = useState({ name: '', department: '', position: '' })
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [statusPwError, setStatusPwError] = useState('')
  const [poModal, setPoModal] = useState(false)
  const [poSupplierId, setPoSupplierId] = useState('')
  const [poRows, setPoRows] = useState([{ material_id: '', quantity: '', unit_price: '' }])

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

  const { data: catalogProducts = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => get<any[]>('/api/products'),
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
    },
    onError: (err: any) => {
      setStatusPwError(err?.message || 'Contraseña incorrecta o sin permisos suficientes')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => put(`/api/orders/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', id] }),
  })

  const addItemMutation = useMutation({
    mutationFn: (data: any) => post(`/api/orders/${id}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'check'] })
      setItemModal(false)
      setItemForm({ uniform_type: '', quantity: '', price_per_unit: '' })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => del(`/api/order-items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'check'] })
    },
  })

  const addEmployeeMutation = useMutation({
    mutationFn: (data: any) => post(`/api/orders/${id}/employees`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      setEmployeeModal(false)
      setEmpForm({ name: '', department: '', position: '' })
    },
  })

  const createPoMutation = useMutation({
    mutationFn: (data: any) => post('/api/purchase-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'purchase-orders'] })
      closePoModal()
    },
  })

  const updatePoStatusMutation = useMutation({
    mutationFn: ({ poId, status }: { poId: string; status: string }) =>
      patch(`/api/purchase-orders/${poId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id, 'purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const handleDownloadQuotation = async () => {
    setDownloading(true)
    try {
      const blob = await download(`/api/orders/${id}/quotation`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cotizacion-${id?.slice(0, 8).toUpperCase()}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err?.message || 'Error al generar la cotización')
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

  const statusOptions = [
    'cotizacion', 'aprobado', 'anticipo_pagado', 'en_produccion', 'terminado', 'entregado', 'cancelado',
  ]

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
        action={<Badge status={order.status} />}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card
            title="Items del pedido"
            action={
              <Button size="sm" onClick={() => setItemModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Agregar item
              </Button>
            }
          >
            <Table
              columns={[
                { key: 'uniform_type', header: 'Tipo de uniforme', render: (r: any) => <span className="font-medium">{r.uniform_type}</span> },
                { key: 'quantity', header: 'Cantidad' },
                { key: 'price_per_unit', header: 'Precio unit.', render: (r: any) => `$${Number(r.price_per_unit).toLocaleString()}` },
                { key: 'subtotal', header: 'Subtotal', render: (r: any) => `$${(r.quantity * r.price_per_unit).toLocaleString()}` },
                {
                  key: 'actions', header: '', render: (r: any) => (
                    <button onClick={() => { if (confirm('Eliminar item?')) deleteItemMutation.mutate(r.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              data={order.order_items || []}
              emptyMessage="Sin items"
            />
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
                      { key: 'sufficient', header: 'Estado', render: (r: any) => r.sufficient ? <Badge status="recibida" /> : <Badge status="cancelado" /> },
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
                        <Badge status={po.status} />
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
          <Card
            title="Empleados"
            action={
              <Button size="sm" onClick={() => setEmployeeModal(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Agregar
              </Button>
            }
          >
            <Table
              columns={[
                { key: 'name', header: 'Nombre', render: (r: any) => <span className="font-medium">{r.name}</span> },
                { key: 'department', header: 'Departamento' },
                { key: 'position', header: 'Cargo' },
                {
                  key: 'measurements', header: 'Medidas', render: (r: any) =>
                    r.measurements?.length > 0
                      ? <Badge status="recibida" />
                      : <span className="text-xs text-gray-400">Pendiente</span>
                },
              ]}
              data={order.employees || []}
              onRowClick={(r: any) => navigate(`/empleados/${r.id}`)}
              emptyMessage="Sin empleados registrados"
            />
          </Card>
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
                  <div className="bg-primary-50 rounded-lg px-3 py-2.5 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-700 font-medium">Anticipo (50%)</span>
                      <span className="text-primary-800 font-bold text-base">${fmt(anticipo)}</span>
                    </div>
                    <p className="text-xs text-primary-500 mt-0.5">Calculado automáticamente · no editable</p>
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
                <Input
                  placeholder="Ej: Otoño Invierno 2026"
                  defaultValue={order.season || ''}
                  onBlur={(e) => updateMutation.mutate({ season: e.target.value })}
                />
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleDownloadQuotation}
              disabled={downloading}
            >
              <FileDown className="h-4 w-4" />
              {downloading ? 'Generando...' : 'Descargar cotización'}
            </Button>
          </div>

          <Card title="Cambiar estado">
            <div className="space-y-2">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (order.status === s) return
                    setPendingStatus(pendingStatus === s ? null : s)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    order.status === s
                      ? 'bg-primary-50 text-primary-700 font-medium cursor-default'
                      : pendingStatus === s
                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-300'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Badge status={s} />
                </button>
              ))}
            </div>
            {pendingStatus && pendingStatus !== order.status && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500">
                  Cambiando a: <span className="font-medium text-gray-700">{pendingStatus}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingStatus(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setStatusPwError(''); setStatusConfirmOpen(true) }}
                    className="flex-1"
                  >
                    Confirmar cambio
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add item modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title="Agregar item">
        <form onSubmit={(e) => { e.preventDefault(); addItemMutation.mutate({ uniform_type: itemForm.uniform_type, quantity: Number(itemForm.quantity), price_per_unit: Number(itemForm.price_per_unit) }) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar del catálogo</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value=""
              onChange={(e) => {
                if (e.target.value) setItemForm({ ...itemForm, uniform_type: e.target.value })
              }}
            >
              <option value="">— Elegir producto —</option>
              {catalogProducts.map((p: any) => (
                <option key={p.id} value={`${p.name}${p.model_ref ? ` (${p.model_ref})` : ''}`}>
                  {p.product_categories?.name} · {p.name}{p.model_ref ? ` — ${p.model_ref}` : ''}
                </option>
              ))}
            </select>
          </div>
          <Input label="Descripción del uniforme *" value={itemForm.uniform_type} onChange={(e) => setItemForm({ ...itemForm, uniform_type: e.target.value })} required placeholder="Se rellena al elegir del catálogo o escribe manualmente" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Cantidad *" type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} required min="1" />
            <Input label="Precio unitario *" type="number" value={itemForm.price_per_unit} onChange={(e) => setItemForm({ ...itemForm, price_per_unit: e.target.value })} required min="0" step="0.01" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setItemModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={addItemMutation.isPending}>Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Add employee modal */}
      <Modal open={employeeModal} onClose={() => setEmployeeModal(false)} title="Agregar empleado">
        <form onSubmit={(e) => { e.preventDefault(); addEmployeeMutation.mutate(empForm) }} className="space-y-4">
          <Input label="Nombre completo *" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Departamento" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
            <Input label="Cargo" value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEmployeeModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={addEmployeeMutation.isPending}>Agregar</Button>
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
