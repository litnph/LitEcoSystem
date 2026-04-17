import { useCallback, useState } from 'react'
import { usePfm } from '../../app/PfmProvider'
import {
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  type CreateTransactionPayload,
  type UpdateTransactionPayload,
} from '../api/transactions'
import { createReceivableApi, type CreateReceivablePayload } from '../api/obligations'
import { convertToInstallmentApi, type ConvertInstallmentPayload } from '../api/obligations'
import type { Transaction } from '../../entities'

export function useTransactionMutations() {
  const { dispatch } = usePfm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTransaction = useCallback(
    async (payload: CreateTransactionPayload): Promise<Transaction | null> => {
      setLoading(true); setError(null)
      try {
        const tx = await createTransactionApi(payload)
        dispatch({ type: 'ADD_TRANSACTION', payload: tx })
        return tx
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi thêm giao dịch.')
        return null
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  const updateTransaction = useCallback(
    async (id: string, payload: UpdateTransactionPayload): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const tx = await updateTransactionApi(id, payload)
        dispatch({ type: 'UPDATE_TRANSACTION', payload: tx })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi cập nhật giao dịch.')
        return false
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await deleteTransactionApi(id)
        dispatch({ type: 'DELETE_TRANSACTION', payload: { id } })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi xoá giao dịch.')
        return false
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  const addReceivable = useCallback(
    async (payload: CreateReceivablePayload): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const r = await createReceivableApi(payload)
        dispatch({
          type: 'ADD_RECEIVABLE',
          payload: {
            title: r.title,
            borrower: r.borrower,
            principal: r.principal,
            dueDate: r.dueDate,
            kind: r.kind,
            sourceTransactionId: r.sourceTransactionId,
          },
        })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi tạo khoản chi hộ.')
        return false
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  const convertToInstallment = useCallback(
    async (payload: ConvertInstallmentPayload): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const plan = await convertToInstallmentApi(payload)
        dispatch({
          type: 'CREATE_INSTALLMENT',
          payload: {
            transactionId: payload.sourceTransactionId,
            tenorMonths: plan.tenorMonths,
            conversionFee: plan.conversionFee,
            statementDay: 20,
            firstBillingPeriod: plan.firstBillingPeriod,
          },
        })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi chuyển trả góp.')
        return false
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  return { loading, error, addTransaction, updateTransaction, deleteTransaction, addReceivable, convertToInstallment }
}
