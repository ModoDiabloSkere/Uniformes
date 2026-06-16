const API_URL = import.meta.env.VITE_API_URL

interface RequestOptions {
  method?: string
  body?: unknown
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Enviar tokens desde localStorage como respaldo cuando
  // las cookies cross-origin son bloqueadas por el navegador
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    headers['X-Refresh-Token'] = refreshToken
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  // Si el middleware renovó los tokens, actualizarlos en localStorage
  const newAccessToken = res.headers.get('X-New-Access-Token')
  const newRefreshToken = res.headers.get('X-New-Refresh-Token')
  if (newAccessToken) localStorage.setItem('access_token', newAccessToken)
  if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken)

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.error || 'Error en la peticion') as Error & { status: number }
    err.status = res.status
    throw err
  }

  return data as T
}
