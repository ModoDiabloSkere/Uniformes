import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, CheckSquare, Square, ExternalLink, Wand2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PasswordConfirmModal } from '../../components/ui/PasswordConfirmModal'

export function ProductionPage() {
  const { get, post, patch } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [selectedPieces, setSelectedPieces] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pwError, setPwError] = useState('')

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['orders', 'en_produccion'],
    queryFn: () => get('/api/orders?status=en_produccion'),
  })

  const { data: pieces = [], isLoading: piecesLoading } = useQuery<any[]>({
    queryKey: ['pieces', expandedOrder],
    queryFn: () => get(`/api/orders/${expandedOrder}/pieces`),
    enabled: !!expandedOrder,
  })

  const generatePiecesMutation = useMutation({
    mutationFn: (orderId: string) =>
      post(`/api/orders/${orderId}/pieces/generate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces', expandedOrder] })
    },
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ pieceIds, password }: { pieceIds: string[]; password: string }) =>
      Promise.all(
        pieceIds.map((id) => patch(`/api/pieces/${id}/status`, { status: 'terminada', password }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces', expandedOrder] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setSelectedPieces([])
      setConfirmOpen(false)
      setPwError('')
    },
    onError: (err: any) => {
      setPwError(err?.message || 'Contraseña incorrecta o sin permisos suficientes')
    },
  })

  const toggleOrder = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
      setSelectedPieces([])
    } else {
      setExpandedOrder(orderId)
      setSelectedPieces([])
    }
  }

  const togglePiece = (id: string) => {
    setSelectedPieces((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const pendingPieces = pieces.filter((p: any) => p.status === 'por_terminar')
  const allPendingSelected =
    pendingPieces.length > 0 && selectedPieces.length === pendingPieces.length

  const toggleAllPending = () => {
    if (allPendingSelected) {
      setSelectedPieces([])
    } else {
      setSelectedPieces(pendingPieces.map((p: any) => p.id))
    }
  }

  const donePieces = pieces.filter((p: any) => p.status === 'terminada').length
  const progress = pieces.length > 0 ? (donePieces / pieces.length) * 100 : 0

  return (
    <div>
      <PageHeader
        title="Produccion"
        subtitle={`${orders.length} pedido${orders.length !== 1 ? 's' : ''} en produccion`}
      />

      {isLoading ? (
        <Card>
          <div className="py-12 text-center text-gray-400">Cargando...</div>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">No hay pedidos en produccion</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const isExpanded = expandedOrder === order.id
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200">
                {/* Order header row */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded
                      ? <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      : <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    }
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {order.clients?.company_name}
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {order.order_items
                          ?.map((i: any) => `${i.quantity}x ${i.uniform_type}`)
                          .join(' · ') || 'Sin items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.delivery_date && (
                      <span className="hidden sm:block text-sm text-gray-500">
                        Entrega: {new Date(order.delivery_date).toLocaleDateString('es-MX')}
                      </span>
                    )}
                    <Badge status={order.status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/pedidos/${order.id}`)
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors"
                      title="Ver detalle del pedido"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded pieces view */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    {piecesLoading ? (
                      <div className="py-8 text-center text-gray-400">Cargando piezas...</div>
                    ) : pieces.length === 0 ? (
                      <div className="py-8 flex flex-col items-center gap-3 text-gray-400">
                        <p className="text-sm">Sin piezas registradas para este pedido</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => generatePiecesMutation.mutate(order.id)}
                          disabled={generatePiecesMutation.isPending}
                        >
                          <Wand2 className="h-4 w-4" />
                          {generatePiecesMutation.isPending ? 'Generando...' : 'Generar piezas'}
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 space-y-4">
                        {/* Progress + actions bar */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">
                              <span className="font-semibold text-emerald-600">{donePieces}</span>
                              {' / '}
                              <span className="font-medium">{pieces.length}</span>
                              {' terminadas'}
                            </span>
                            {selectedPieces.length > 0 && (
                              <span className="text-primary-600 font-medium">
                                {selectedPieces.length} seleccionada{selectedPieces.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {pendingPieces.length > 0 && (
                              <Button size="sm" variant="ghost" onClick={toggleAllPending}>
                                {allPendingSelected ? 'Deseleccionar todo' : 'Seleccionar pendientes'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={selectedPieces.length === 0}
                              onClick={() => { setPwError(''); setConfirmOpen(true) }}
                            >
                              <CheckSquare className="h-4 w-4" />
                              Marcar terminadas ({selectedPieces.length})
                            </Button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Pieces grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {pieces.map((piece: any) => {
                            const isTerminada = piece.status === 'terminada'
                            const isSelected = selectedPieces.includes(piece.id)
                            return (
                              <div
                                key={piece.id}
                                onClick={() => !isTerminada && togglePiece(piece.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  isTerminada
                                    ? 'bg-emerald-50 border-emerald-200 opacity-70'
                                    : isSelected
                                    ? 'bg-primary-50 border-primary-300 cursor-pointer'
                                    : 'bg-white border-gray-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {isTerminada ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                ) : isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-primary-600 flex-shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    Pieza #{piece.piece_number}
                                  </p>
                                  {piece.employee_name && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {piece.employee_name}
                                    </p>
                                  )}
                                  {piece.uniform_type && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {piece.uniform_type}
                                    </p>
                                  )}
                                </div>
                                <Badge status={piece.status} />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <PasswordConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPwError('') }}
        onConfirm={(password) =>
          changeStatusMutation.mutate({ pieceIds: selectedPieces, password })
        }
        title="Confirmar cambio de estado"
        description={`Se marcarán ${selectedPieces.length} pieza${selectedPieces.length !== 1 ? 's' : ''} como terminadas. Esta accion requiere autorización del administrador.`}
        confirmLabel="Confirmar terminadas"
        isPending={changeStatusMutation.isPending}
        error={pwError}
      />
    </div>
  )
}
