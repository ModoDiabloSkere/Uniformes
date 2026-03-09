const colors: Record<string, string> = {
  cotizacion: 'bg-gray-100 text-gray-700',
  aprobado: 'bg-blue-100 text-blue-700',
  anticipo_pagado: 'bg-indigo-100 text-indigo-700',
  en_produccion: 'bg-amber-100 text-amber-700',
  terminado: 'bg-emerald-100 text-emerald-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  enviada: 'bg-blue-100 text-blue-700',
  recibida: 'bg-green-100 text-green-700',
}

const labels: Record<string, string> = {
  cotizacion: 'Cotizacion',
  aprobado: 'Aprobado',
  anticipo_pagado: 'Anticipo pagado',
  en_produccion: 'En produccion',
  terminado: 'Terminado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pendiente: 'Pendiente',
  enviada: 'Enviada',
  recibida: 'Recibida',
}

interface BadgeProps {
  status: string
}

export function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {labels[status] || status}
    </span>
  )
}
