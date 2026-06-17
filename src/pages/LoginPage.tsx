import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api<{
        user: { id: string; email: string; role: string }
        access_token: string
        refresh_token: string
      }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      setAuth(data.user as any, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Panel izquierdo — identidad de marca */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden"
        style={{ background: 'var(--color-accent-light)' }}
      >
        {/* Patrón de cuadrícula sutil */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#4F52D6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10">
          <img src="/images/logo.png" alt="Uniformes D'Johanna" className="h-14 w-auto object-contain" />
        </div>

        <div className="relative z-10">
          <h1 className="text-[32px] font-bold leading-tight mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Sistema de gestión<br />D'Johanna
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
            Control de pedidos, producción e inventario para el taller de confección.
          </p>
        </div>

        <div className="relative z-10 flex gap-6">
          {[
            { value: 'Pedidos', label: 'en control total' },
            { value: 'Producción', label: 'en tiempo real' },
            { value: 'Inventario', label: 'siempre actualizado' },
          ].map((stat) => (
            <div key={stat.value}>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                {stat.value}
              </p>
              <p className="text-caption">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12"
      >
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <img src="/images/logo.png" alt="Uniformes D'Johanna" className="h-16 w-auto object-contain mx-auto" />
        </div>

        <div
          className="w-full max-w-[420px] bg-white rounded-2xl p-8"
          style={{ boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-[20px] font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Iniciar sesión
          </h2>
          <p className="text-caption mb-7">Accede al panel de control del taller.</p>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={`space-y-5 ${shake ? 'shake' : ''}`}
          >
            {error && (
              <div
                className="p-3 rounded-lg text-[13px]"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
                className="w-full h-10 px-3 border rounded-lg text-[14px] bg-white outline-none transition-all border-[var(--color-border-strong)] focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)]"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className="w-full h-10 px-3 pr-10 border rounded-lg text-[14px] bg-white outline-none transition-all border-[var(--color-border-strong)] focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,82,214,0.12)]"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-medium text-[14px] text-white transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent)' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = 'var(--color-accent-dark)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
