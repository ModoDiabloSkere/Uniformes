import { useState } from 'react'
import { Lock, AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'

interface PasswordConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (password: string) => void
  title: string
  description: string
  confirmLabel?: string
  isPending?: boolean
  error?: string
}

export function PasswordConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  isPending,
  error,
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState('')

  const handleClose = () => {
    setPassword('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    onConfirm(password)
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        <Input
          label="Contraseña del administrador"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          placeholder="Ingresa tu contraseña"
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!password || isPending}>
            <Lock className="h-4 w-4" />
            {isPending ? 'Verificando...' : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
