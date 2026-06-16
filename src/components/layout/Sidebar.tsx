import { NavLink } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { navItems } from "./navItems";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col">
      <div className="px-4 py-5 border-b border-gray-100">
        <img
          src="/images/logo.jpg"
          alt="Uniformes D'Johanna"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-gray-100">
        <div
          className={`overflow-hidden transition-[opacity,max-height] duration-300 ${
            collapsed ? "opacity-0 max-h-0" : "opacity-100 max-h-20"
          }`}
        >
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
