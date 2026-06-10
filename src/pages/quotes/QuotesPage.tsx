import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Users, Mail, Phone, Building2, Calendar, MessageSquare } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'

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

const STATUS_LABELS: Record<LandingContact['status'], string> = {
  nueva: 'Nueva',
  vista: 'Vista',
  contactada: 'Contactada',
  convertida: 'Convertida',
}

const STATUS_COLORS: Record<LandingContact['status'], string> = {
  nueva: 'bg-primary-50 text-primary-700 ring-primary-200',
  vista: 'bg-gray-100 text-gray-600 ring-gray-200',
  contactada: 'bg-blue-50 text-blue-700 ring-blue-200',
  convertida: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const STATUS_OPTIONS: LandingContact['status'][] = ['nueva', 'vista', 'contactada', 'convertida']

const TABS: { label: string; value: string }[] = [
  { label: 'Todas', value: '' },
  { label: 'Nuevas', value: 'nueva' },
  { label: 'Vistas', value: 'vista' },
  { label: 'Contactadas', value: 'contactada' },
  { label: 'Convertidas', value: 'convertida' },
]

function StatusBadge({ status }: { status: LandingContact['status'] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function ContactRow({ contact }: { contact: LandingContact }) {
  const [expanded, setExpanded] = useState(false)
  const { patch } = useApi()
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (status: LandingContact['status']) =>
      patch(`/api/landing-contacts/${contact.id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-contacts'] })
    },
  })

  const date = new Date(contact.created_at).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
          {contact.name[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{contact.name}</p>
            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              {contact.company}
            </p>
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-sm text-gray-600 truncate flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              {contact.email}
            </p>
            {contact.phone && (
              <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                {contact.phone}
              </p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500">
            {contact.employees && (
              <>
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span>{contact.employees} empleados</span>
              </>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={contact.status} />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50">
          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Datos de contacto
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary-600 transition-colors">
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${contact.phone}`} className="hover:text-primary-600 transition-colors">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.employees && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{contact.employees} empleados aproximados</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{date}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Mensaje
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {contact.message}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-400">Actualizar estado:</p>
            <div className="flex gap-2 flex-wrap justify-end">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => statusMutation.mutate(s)}
                  disabled={statusMutation.isPending || contact.status === s}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    contact.status === s
                      ? `${STATUS_COLORS[s]} ring-1 cursor-default`
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function QuotesPage() {
  const { get } = useApi()
  const [activeTab, setActiveTab] = useState('')

  const { data: contacts = [], isLoading } = useQuery<LandingContact[]>({
    queryKey: ['landing-contacts', activeTab],
    queryFn: () =>
      get<LandingContact[]>(
        activeTab ? `/api/landing-contacts?status=${activeTab}` : '/api/landing-contacts'
      ),
  })

  const newCount = contacts.filter((c) => c.status === 'nueva').length

  return (
    <div>
      <PageHeader
        title="Solicitudes de cotizacion"
        subtitle={`${contacts.length} solicitud${contacts.length !== 1 ? 'es' : ''}${activeTab ? ` · ${STATUS_LABELS[activeTab as LandingContact['status']]}` : ''}`}
      />

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.value === 'nueva' && newCount > 0 && activeTab !== 'nueva' && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">Cargando...</div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">No hay solicitudes{activeTab ? ` con estado "${STATUS_LABELS[activeTab as LandingContact['status']]}"` : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
