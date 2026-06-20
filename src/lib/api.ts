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

  // Respaldo cross-origin: solo el access_token (1h). El refresh_token vive
  // únicamente en la cookie HttpOnly (no accesible por JS) y viaja con
  // credentials:'include', por lo que el refresh sigue funcionando por cookie.
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  // Si el middleware renovó el access_token, actualizarlo en localStorage.
  // El nuevo refresh_token se ignora aquí: ya viene en la cookie HttpOnly.
  const newAccessToken = res.headers.get('X-New-Access-Token')
  if (newAccessToken) localStorage.setItem('access_token', newAccessToken)

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.error || 'Error en la peticion') as Error & { status: number }
    err.status = res.status
    throw err
  }

  return data as T
}
