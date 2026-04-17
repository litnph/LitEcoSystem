import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDebtApi,
  updateDebtApi,
  payDebtApi,
  deleteDebtApi,
  collectReceivableApi,
  deleteReceivableApi,
  payInstallmentMonthApi,
  type CreateDebtPayload,
} from '@/entities/obligation'
import { DEBTS_QUERY_KEY, RECEIVABLES_QUERY_KEY, INSTALLMENTS_QUERY_KEY } from '@/entities/obligation'
import { TRANSACTIONS_QUERY_KEY } from '@/entities/transaction'

export function useCreateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDebtPayload) => createDebtApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEBTS_QUERY_KEY }),
  })
}

export function useUpdateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateDebtPayload }) => updateDebtApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEBTS_QUERY_KEY }),
  })
}

export function usePayDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => payDebtApi(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEBTS_QUERY_KEY }),
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDebtApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEBTS_QUERY_KEY }),
  })
}

export function useCollectReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => collectReceivableApi(id, amount),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RECEIVABLES_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export function useDeleteReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReceivableApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECEIVABLES_QUERY_KEY }),
  })
}

export function usePayInstallmentMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payInstallmentMonthApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY }),
  })
}

export type { CreateDebtPayload }
