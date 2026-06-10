import { create } from 'zustand'

export type UserRole = 'admin' | 'ventas' | 'almacen' | 'confeccion'

interface User {
  id: string
  email: string
  role: UserRole
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // 10 segundos de margen para evitar race conditions
    return payload.exp * 1000 > Date.now() + 10_000
  } catch {
    return false
  }
}

const storedToken = localStorage.getItem('token')
const validToken = isTokenValid(storedToken) ? storedToken : null
if (!validToken) {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const useAuthStore = create<AuthState>((set) => ({
  token: validToken,
  user: validToken ? JSON.parse(localStorage.getItem('user') || 'null') : null,

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
}))
