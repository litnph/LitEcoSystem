import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSpendingPeriodApi,
  updateSpendingPeriodApi,
  deleteSpendingPeriodApi,
  confirmStatementApi,
  patchStatementStatusApi,
  type ConfirmStatementPayload,
} from '@/entities/spending-cycle'
import { SPENDING_PERIODS_QUERY_KEY, STATEMENTS_QUERY_KEY } from '@/entities/spending-cycle'
import { TRANSACTIONS_QUERY_KEY } from '@/entities/transaction'

export function useCreateSpendingPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSpendingPeriodApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: SPENDING_PERIODS_QUERY_KEY }),
  })
}

export function useUpdateSpendingPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; startDate: string; endDate: string } }) =>
      updateSpendingPeriodApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SPENDING_PERIODS_QUERY_KEY }),
  })
}

export function useDeleteSpendingPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSpendingPeriodApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SPENDING_PERIODS_QUERY_KEY }),
  })
}

export function useConfirmStatement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConfirmStatementPayload) => confirmStatementApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STATEMENTS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export function usePatchStatementStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => patchStatementStatusApi(id, paid),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATEMENTS_QUERY_KEY }),
  })
}

export type { ConfirmStatementPayload }
