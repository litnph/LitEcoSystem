import { useQuery } from '@tanstack/react-query'
import { getSpendingPeriodsApi, getConfirmedStatementsApi } from '../api/spending-cycle.api'

export const SPENDING_PERIODS_QUERY_KEY = ['spending-periods'] as const
export const STATEMENTS_QUERY_KEY = ['statements'] as const

export function useSpendingPeriodsQuery() {
  return useQuery({
    queryKey: SPENDING_PERIODS_QUERY_KEY,
    queryFn: getSpendingPeriodsApi,
  })
}

export function useStatementsQuery() {
  return useQuery({
    queryKey: STATEMENTS_QUERY_KEY,
    queryFn: getConfirmedStatementsApi,
  })
}
