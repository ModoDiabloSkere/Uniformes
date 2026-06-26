import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const PIECES = [
  { key: 'chaleco',   label: 'Chaleco' },
  { key: 'blusa',     label: 'Blusa' },
  { key: 'pantalon',  label: 'Pantalón' },
] as const

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, put } = useApi()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => get<any>(`/api/employees/${id}`),
  })

  const updateEmployee = useMutation({
    mutationFn: (data: any) => put(`/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', id] })
      toast.success('Datos guardados')
    },
  })

  const saveMeasurements = useMutation({
    mutationFn: (data: any) => put(`/api/employees/${id}/measurements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', id] })
      toast.success('Tallas guardadas')
    },
  })

  if (isLoading) return <div className="text-gray-400">Cargando...</div>
  if (!employee) return <div className="text-gray-400">Empleado no encontrado</div>

  const measurements = employee.measurements?.[0] || employee.measurements || {}

  function handleSaveMeasurements(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data: Record<string, any> = {}
    for (const piece of PIECES) {
      const tallaKey = `${piece.key}_talla`
      const notasKey = `${piece.key}_notas`
      const tallaVal = fd.get(tallaKey) as string
      const notasVal = fd.get(notasKey) as string
      if (tallaVal !== '') data[tallaKey] = Number(tallaVal)
      if (notasVal !== '') data[notasKey] = notasVal
    }
    saveMeasurements.mutate(data)
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <PageHeader
        title={employee.name}
        subtitle={`${employee.department || ''}${employee.position ? ` · ${employee.position}` : ''}`}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Datos del empleado */}
        <Card title="Datos del empleado">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              updateEmployee.mutate(Object.fromEntries(fd))
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-[1fr_140px] gap-4">
              <Input label="Nombre" name="name" defaultValue={employee.name} />
              <Input label="Folio interno" name="folio" defaultValue={employee.folio || ''} placeholder="Ej: EMP-001" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Departamento" name="department" defaultValue={employee.department || ''} />
              <Input label="Cargo" name="position" defaultValue={employee.position || ''} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Tallas por pieza */}
        <Card title="Tallas por pieza">
          <form onSubmit={handleSaveMeasurements} className="space-y-5">
            {PIECES.map((piece) => {
              const tallaKey = `${piece.key}_talla`
              const notasKey = `${piece.key}_notas`
              return (
                <div key={piece.key}>
                  <p
                    className="text-[12px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {piece.label}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-[13px] font-medium mb-1"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Talla
                      </label>
                      <input
                        type="number"
                        name={tallaKey}
                        defaultValue={measurements[tallaKey] ?? ''}
                        min={0}
                        step="any"
                        className="w-full px-3 py-2 border rounded-lg text-[14px] outline-none transition-all"
                        style={{
                          borderColor: 'var(--color-border-strong)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,82,214,0.12)'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-[13px] font-medium mb-1"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Notas
                      </label>
                      <input
                        type="text"
                        name={notasKey}
                        defaultValue={measurements[notasKey] ?? ''}
                        placeholder="Ej: manga corta, ajustado..."
                        className="w-full px-3 py-2 border rounded-lg text-[14px] outline-none transition-all"
                        style={{
                          borderColor: 'var(--color-border-strong)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,82,214,0.12)'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={saveMeasurements.isPending}>
                {saveMeasurements.isPending ? 'Guardando...' : 'Guardar tallas'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
