import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  type CreateTransactionPayload,
  type UpdateTransactionPayload,
} from '@/entities/transaction'
import { createReceivableApi, convertToInstallmentApi, type CreateReceivablePayload, type ConvertInstallmentPayload } from '@/entities/obligation'
import { TRANSACTIONS_QUERY_KEY } from '@/entities/transaction'
import { INSTALLMENTS_QUERY_KEY, RECEIVABLES_QUERY_KEY } from '@/entities/obligation'

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTransactionApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionPayload }) =>
      updateTransactionApi(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransactionApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
  })
}

export function useCreateReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateReceivablePayload) => createReceivableApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RECEIVABLES_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export function useConvertToInstallment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConvertInstallmentPayload) => convertToInstallmentApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
    },
  })
}

export type { CreateTransactionPayload, UpdateTransactionPayload, CreateReceivablePayload, ConvertInstallmentPayload }
