import { useCallback, useState } from 'react'
import { usePfm } from '../../app/PfmProvider'
import {
  createDebtApi,
  updateDebtApi,
  payDebtApi,
  deleteDebtApi,
  collectReceivableApi,
  deleteReceivableApi,
  type CreateDebtPayload,
} from '../api/obligations'
import type { DebtRecord, ReceivableRecord } from '../../entities'

export function useObligationMutations() {
  const { dispatch, reloadApiData } = usePfm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDebt = useCallback(
    async (data: CreateDebtPayload): Promise<DebtRecord | null> => {
      setLoading(true); setError(null)
      try {
        const d = await createDebtApi(data)
        dispatch({ type: 'ADD_DEBT', payload: { title: d.title, lender: d.lender, principal: d.principal, dueDate: d.dueDate } })
        return d
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi tạo khoản nợ.')
        return null
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const updateDebt = useCallback(
    async (id: string, data: CreateDebtPayload): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await updateDebtApi(id, data)
        // reload to get fresh server data
        await reloadApiData()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi cập nhật khoản nợ.')
        return false
      } finally { setLoading(false) }
    },
    [reloadApiData],
  )

  const payDebt = useCallback(
    async (id: string, amount: number): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await payDebtApi(id, amount)
        dispatch({ type: 'ADD_DEBT_PAYMENT', payload: { debtId: id, amount } })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi ghi nhận trả nợ.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const deleteDebt = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await deleteDebtApi(id)
        await reloadApiData()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi xoá khoản nợ.')
        return false
      } finally { setLoading(false) }
    },
    [reloadApiData],
  )

  const collectReceivable = useCallback(
    async (receivable: ReceivableRecord, amount: number, occurredAt: string, source: string, channel: string): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await collectReceivableApi(receivable.id, amount)
        dispatch({
          type: 'ADD_RECEIVABLE_COLLECTION',
          payload: { receivableId: receivable.id, amount, occurredAt, source, channel },
        })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi thu hồi công nợ.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const deleteReceivable = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await deleteReceivableApi(id)
        await reloadApiData()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi xoá khoản cần thu.')
        return false
      } finally { setLoading(false) }
    },
    [reloadApiData],
  )

  return { loading, error, createDebt, updateDebt, payDebt, deleteDebt, collectReceivable, deleteReceivable }
}
