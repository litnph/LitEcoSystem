import { useQuery } from '@tanstack/react-query'
import { getInstallmentsApi, getDebtsApi, getReceivablesApi } from '../api/obligation.api'

export const INSTALLMENTS_QUERY_KEY = ['installments'] as const
export const DEBTS_QUERY_KEY = ['debts'] as const
export const RECEIVABLES_QUERY_KEY = ['receivables'] as const

export function useInstallmentsQuery(status?: string) {
  return useQuery({
    queryKey: status ? [...INSTALLMENTS_QUERY_KEY, status] : INSTALLMENTS_QUERY_KEY,
    queryFn: () => getInstallmentsApi(status),
  })
}

export function useDebtsQuery(status?: string) {
  return useQuery({
    queryKey: status ? [...DEBTS_QUERY_KEY, status] : DEBTS_QUERY_KEY,
    queryFn: () => getDebtsApi(status),
  })
}

export function useReceivablesQuery(status?: string) {
  return useQuery({
    queryKey: status ? [...RECEIVABLES_QUERY_KEY, status] : RECEIVABLES_QUERY_KEY,
    queryFn: () => getReceivablesApi(status),
  })
}
