import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL

export function useApi() {
  const token = useAuthStore((s) => s.token)

  return {
    get: <T = unknown>(path: string) =>
      api<T>(path, { token: token || undefined }),

    post: <T = unknown>(path: string, body: unknown) =>
      api<T>(path, { method: 'POST', body, token: token || undefined }),

    put: <T = unknown>(path: string, body: unknown) =>
      api<T>(path, { method: 'PUT', body, token: token || undefined }),

    patch: <T = unknown>(path: string, body: unknown) =>
      api<T>(path, { method: 'PATCH', body, token: token || undefined }),

    del: <T = unknown>(path: string) =>
      api<T>(path, { method: 'DELETE', token: token || undefined }),

    download: async (path: string): Promise<Blob> => {
      const res = await fetch(`${API_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as any).error || 'Error al descargar el archivo')
      }
      return res.blob()
    },
  }
}
