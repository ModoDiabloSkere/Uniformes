import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Sidebar } from './Sidebar'
import { MobileNavSheet } from './MobileNavSheet'

export function AppLayout() {
  const token = useAuthStore((s) => s.token)
  const [navOpen, setNavOpen] = useState(false)

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Top bar — solo movil */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <img
          src="/images/logo.jpg"
          alt="Uniformes D'Johanna"
          className="h-8 w-auto object-contain"
        />
        <button
          onClick={() => setNavOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sheet de navegacion — solo movil */}
      <MobileNavSheet open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Contenido principal */}
      <main className="md:ml-64 p-4 sm:p-6 lg:p-8 pt-18 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
