import { clearSession, loadSession, saveSession } from '../lib/auth-storage'

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://litecosysapi.onrender.com/api'
const API_BASE = RAW_API_BASE.replace(/\/+$/, '')
const API_V1_BASE = `${API_BASE}/v1`

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  auth?: boolean
}

export class ApiError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

let _refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    const session = loadSession()
    if (!session?.refreshToken) return false
    try {
      const res = await fetch(`${API_V1_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
      if (!res.ok) return false
      const data = await res.json() as { accessToken: string; refreshToken: string; accessTokenExpiry: string }
      saveSession({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken, accessTokenExpiry: data.accessTokenExpiry })
      return true
    } catch {
      return false
    } finally {
      _refreshPromise = null
    }
  })()
  return _refreshPromise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await _doRequest<T>(path, options)
  return result
}

async function _doRequest<T>(path: string, options: RequestOptions, isRetry = false): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const session = loadSession()
  if (options.auth !== false && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }

  const response = await fetch(`${API_V1_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  // Token expired — try refresh once
  if (response.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return _doRequest<T>(path, options, true)
    // Refresh failed → force logout
    clearSession()
    window.location.reload()
    throw new ApiError('Session expired', 401)
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}
