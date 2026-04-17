import { useQuery } from '@tanstack/react-query'
import { getTransactionsApi, type TransactionFilters } from '../api/transaction.api'

export const TRANSACTIONS_QUERY_KEY = ['transactions'] as const

export function useTransactionsQuery(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, filters ?? {}],
    queryFn: () => getTransactionsApi(filters),
  })
}
