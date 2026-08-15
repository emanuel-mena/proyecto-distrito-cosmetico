const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export const SESSION_KEY = 'dcApiSessionV1'

const sessionToken = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.token || ''
  } catch {
    return ''
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const api = async (path, options = {}) => {
  const headers = new Headers(options.headers || {})
  const token = sessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body:
        options.body === undefined || options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('No fue posible conectar con el servidor.', 0)
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new CustomEvent('api:unauthorized'))
    throw new ApiError(data?.error || 'La solicitud no pudo completarse.', response.status, data)
  }
  return data
}
