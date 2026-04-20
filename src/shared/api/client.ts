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

/**
 * Envelope chuẩn từ BE:
 *   { success: true, data: ... }
 *   { success: false, error: { code, message, details? } }
 */
export type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  payload?: unknown

  constructor(message: string, status: number, code = 'ERROR', details?: unknown, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
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
      type RefreshTokenResult = { accessToken: string; refreshToken: string; accessTokenExpiry: string }
      const raw = await res.json() as ApiEnvelope<RefreshTokenResult> | RefreshTokenResult
      const data = unwrapEnvelope<RefreshTokenResult>(raw)
      if (!data) return false
      saveSession({
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiry: data.accessTokenExpiry,
      })
      return true
    } catch {
      return false
    } finally {
      _refreshPromise = null
    }
  })()
  return _refreshPromise
}

function isEnvelope<T>(v: unknown): v is ApiEnvelope<T> {
  return !!v && typeof v === 'object' && 'success' in (v as Record<string, unknown>)
}

function unwrapEnvelope<T>(payload: unknown): T | undefined {
  if (isEnvelope<T>(payload)) {
    return payload.success ? (payload.data as T) : undefined
  }
  return payload as T
}

function buildErrorFromPayload(payload: unknown, status: number): ApiError {
  // Envelope mới: { success: false, error: { code, message, details } }
  if (isEnvelope(payload) && payload.success === false && payload.error) {
    return new ApiError(payload.error.message || `Yêu cầu thất bại (${status})`, status, payload.error.code || 'ERROR', payload.error.details, payload)
  }
  // ProblemDetails kiểu cũ: { title, errors, status }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    const title = typeof obj.title === 'string' ? obj.title : undefined
    const detail = typeof obj.detail === 'string' ? obj.detail : undefined
    const message = typeof obj.message === 'string' ? obj.message : undefined
    const text = message || title || detail
    if (text) return new ApiError(text, status, 'ERROR', obj.errors, payload)
  }
  return new ApiError(`Yêu cầu thất bại (${status})`, status, 'ERROR', undefined, payload)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return _doRequest<T>(path, options)
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
  if (response.status === 401 && !isRetry && session?.accessToken) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return _doRequest<T>(path, options, true)
    clearSession()
    window.location.reload()
    throw new ApiError('Phiên làm việc đã hết hạn.', 401, 'UNAUTHORIZED')
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  // HTTP failure → build ApiError
  if (!response.ok) {
    throw buildErrorFromPayload(payload, response.status)
  }

  // HTTP ok nhưng envelope đánh dấu thất bại → vẫn là ApiError
  if (isEnvelope(payload) && payload.success === false) {
    throw buildErrorFromPayload(payload, response.status)
  }

  // Trả về data đã unwrap (envelope) hoặc raw payload nếu BE chưa wrap
  return (unwrapEnvelope<T>(payload) ?? (undefined as T))
}
