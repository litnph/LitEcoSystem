import { createContext } from 'react'

export type ApiErrorDetailItem = { field?: string; message?: string } | string

export type ApiErrorInfo = {
  title?: string
  message: string
  code?: string
  status?: number
  details?: ApiErrorDetailItem[]
}

export type ApiErrorContextValue = {
  error: ApiErrorInfo | null
  showError: (info: ApiErrorInfo) => void
  dismiss: () => void
}

export const ApiErrorContext = createContext<ApiErrorContextValue | null>(null)
