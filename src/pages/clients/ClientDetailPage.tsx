import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, User } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'

export function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, put, post, del } = useApi()
  const queryClient = useQueryClient()
  const [contactModal, setContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
  })

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => get<any>(`/api/clients/${id}`),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => put(`/api/clients/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', id] }),
  })

  const addContactMutation = useMutation({
    mutationFn: (data: typeof contactForm) =>
      post(`/api/clients/${id}/contacts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
      setContactModal(false)
      setContactForm({ name: '', position: '', phone: '', email: '' })
    },
  })

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => del(`/api/contacts/${contactId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', id] }),
  })

  if (isLoading) {
    return <div className="text-gray-400">Cargando...</div>
  }

  if (!client) {
    return <div className="text-gray-400">Cliente no encontrado</div>
  }

  return (
    <div>
      <button
        onClick={() => navigate('/clientes')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </button>

      <PageHeader title={client.company_name} subtitle={client.industry} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Informacion del cliente">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                updateMutation.mutate(Object.fromEntries(fd))
              }}
              className="space-y-4"
            >
              <Input
                label="Empresa"
                name="company_name"
                defaultValue={client.company_name}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Industria"
                  name="industry"
                  defaultValue={client.industry || ''}
                />
                <Input
                  label="Telefono"
                  name="phone"
                  defaultValue={client.phone || ''}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  defaultValue={client.email || ''}
                />
                <Input
                  label="Direccion"
                  name="address"
                  defaultValue={client.address || ''}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </Card>

          <Card
            title="Contactos"
            action={
              <Button size="sm" onClick={() => setContactModal(true)}>
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            }
          >
            <Table
              columns={[
                {
                  key: 'name',
                  header: 'Nombre',
                  render: (row: any) => (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  ),
                },
                { key: 'position', header: 'Cargo' },
                { key: 'phone', header: 'Telefono' },
                { key: 'email', header: 'Email' },
                {
                  key: 'actions',
                  header: '',
                  render: (row: any) => (
                    <button
                      onClick={() => {
                        if (confirm('Eliminar contacto?'))
                          deleteContactMutation.mutate(row.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              data={client.client_contacts || []}
              emptyMessage="Sin contactos registrados"
            />
          </Card>
        </div>

        <div>
          <Card title="Resumen">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Contactos</p>
                <p className="font-semibold text-gray-900">
                  {client.client_contacts?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Registrado</p>
                <p className="font-semibold text-gray-900">
                  {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={contactModal}
        onClose={() => setContactModal(false)}
        title="Nuevo contacto"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addContactMutation.mutate(contactForm)
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre *"
            value={contactForm.name}
            onChange={(e) =>
              setContactForm({ ...contactForm, name: e.target.value })
            }
            required
          />
          <Input
            label="Cargo"
            value={contactForm.position}
            onChange={(e) =>
              setContactForm({ ...contactForm, position: e.target.value })
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefono"
              value={contactForm.phone}
              onChange={(e) =>
                setContactForm({ ...contactForm, phone: e.target.value })
              }
            />
            <Input
              label="Email"
              type="email"
              value={contactForm.email}
              onChange={(e) =>
                setContactForm({ ...contactForm, email: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setContactModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addContactMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
