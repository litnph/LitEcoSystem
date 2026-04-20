import { useContext } from 'react'
import { ApiErrorContext } from './error-context'

export function useApiError() {
  const ctx = useContext(ApiErrorContext)
  if (!ctx) throw new Error('useApiError must be used within ApiErrorProvider')
  return ctx
}
