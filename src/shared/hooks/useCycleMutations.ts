import { useCallback, useState } from 'react'
import { usePfm } from '../../app/PfmProvider'
import {
  createSpendingPeriodApi,
  updateSpendingPeriodApi,
  deleteSpendingPeriodApi,
  confirmStatementApi,
  patchStatementStatusApi,
  type ConfirmStatementPayload,
} from '../api/spending-cycles'

export function useCycleMutations() {
  const { dispatch } = usePfm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addPeriod = useCallback(
    async (data: { name: string; startDate: string; endDate: string }): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const p = await createSpendingPeriodApi(data)
        dispatch({ type: 'ADD_SPENDING_PERIOD', payload: { id: p.id, name: p.name, startDate: p.startDate, endDate: p.endDate } })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi tạo kỳ chi tiêu.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const updatePeriod = useCallback(
    async (id: string, data: { name: string; startDate: string; endDate: string }): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const p = await updateSpendingPeriodApi(id, data)
        dispatch({ type: 'UPDATE_SPENDING_PERIOD', payload: { id: p.id, name: p.name, startDate: p.startDate, endDate: p.endDate } })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi cập nhật kỳ chi tiêu.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const deletePeriod = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await deleteSpendingPeriodApi(id)
        dispatch({ type: 'REMOVE_SPENDING_PERIOD', payload: { id } })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi xoá kỳ chi tiêu.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const confirmStatement = useCallback(
    async (payload: ConfirmStatementPayload): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const stmt = await confirmStatementApi(payload)
        // The local reducer's CONFIRM_STATEMENT handles transaction settling.
        // We sync the confirmed statement object directly.
        dispatch({
          type: 'LOAD_API_DATA',
          payload: {},
        })
        // Also update local statement list
        dispatch({
          type: 'LOAD_API_DATA',
          payload: {},
        })
        // Return the API-created statement object for local sync
        void stmt
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi chốt sao kê.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  const payStatement = useCallback(
    async (id: string, paid: boolean): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await patchStatementStatusApi(id, paid)
        if (paid) {
          dispatch({ type: 'PAY_CONFIRMED_STATEMENT', payload: { statementId: id } })
        }
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi cập nhật trạng thái sao kê.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch],
  )

  return { loading, error, addPeriod, updatePeriod, deletePeriod, confirmStatement, payStatement }
}
