import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Sidebar } from './Sidebar'
import { MobileNavSheet } from './MobileNavSheet'

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const [navOpen, setNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — solo desktop */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Top bar — solo movil */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <img
          src="/images/logo.png"
          alt="Uniformes D'Johanna"
          className="h-10 w-auto object-contain"
        />
        <button
          onClick={() => setNavOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sheet de navegacion — solo movil */}
      <MobileNavSheet open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Contenido principal */}
      <main
        className={`transition-[margin-left] duration-300 ease-in-out p-4 sm:p-6 lg:p-8 pt-18 md:pt-8 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
