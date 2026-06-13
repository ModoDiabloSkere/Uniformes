import { create } from 'zustand'

export type UserRole = 'admin' | 'ventas' | 'almacen' | 'confeccion'

interface User {
  id: string
  email: string
  role: UserRole
}

interface AuthState {
  user: User | null
  setAuth: (user: User, tokens?: { access_token: string; refresh_token: string }) => void
  logout: () => void
}

const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null') as User | null
  } catch {
    return null
  }
})()

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,

  setAuth: (user, tokens) => {
    localStorage.setItem('user', JSON.stringify(user))
    if (tokens) {
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
    }
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => { })
    set({ user: null })
  },
}))
