import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const measurementFields = [
  { key: 'chest', label: 'Pecho (cm)' },
  { key: 'waist', label: 'Cintura (cm)' },
  { key: 'hips', label: 'Cadera (cm)' },
  { key: 'height', label: 'Estatura (cm)' },
  { key: 'sleeve', label: 'Manga (cm)' },
  { key: 'shoulder', label: 'Hombro (cm)' },
  { key: 'neck', label: 'Cuello (cm)' },
  { key: 'inseam', label: 'Entrepierna (cm)' },
]

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, put } = useApi()
  const queryClient = useQueryClient()

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => get<any>(`/api/employees/${id}`),
  })

  const updateEmployee = useMutation({
    mutationFn: (data: any) => put(`/api/employees/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', id] }),
  })

  const saveMeasurements = useMutation({
    mutationFn: (data: any) => put(`/api/employees/${id}/measurements`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', id] }),
  })

  if (isLoading) return <div className="text-gray-400">Cargando...</div>
  if (!employee) return <div className="text-gray-400">Empleado no encontrado</div>

  const measurements = employee.measurements?.[0] || employee.measurements || {}

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
        subtitle={`${employee.department || ''} ${employee.position ? `- ${employee.position}` : ''}`}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Datos del empleado">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              updateEmployee.mutate(Object.fromEntries(fd))
            }}
            className="space-y-4"
          >
            <Input label="Nombre" name="name" defaultValue={employee.name} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Departamento" name="department" defaultValue={employee.department || ''} />
              <Input label="Cargo" name="position" defaultValue={employee.position || ''} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateEmployee.isPending}>
                Guardar
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Medidas">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const data: any = {}
              for (const [key, value] of fd.entries()) {
                if (value) data[key] = Number(value)
              }
              const notes = fd.get('notes') as string
              if (notes) data.notes = notes
              saveMeasurements.mutate(data)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {measurementFields.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  name={f.key}
                  type="number"
                  step="0.1"
                  defaultValue={measurements[f.key] || ''}
                />
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={measurements.notes || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saveMeasurements.isPending}>
                {saveMeasurements.isPending ? 'Guardando...' : 'Guardar medidas'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
