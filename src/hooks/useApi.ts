import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

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
  }
}
