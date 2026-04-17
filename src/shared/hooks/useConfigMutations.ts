import { useCallback, useState } from 'react'
import { usePfm } from '../../app/PfmProvider'
import { updateCalendarRulesApi, updateMasterDataApi, type CalendarRulesApiDto, type MasterDataApiDto } from '../api/configuration'

export function useConfigMutations() {
  const { dispatch, state, reloadApiData } = usePfm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveCalendarRules = useCallback(
    async (data: CalendarRulesApiDto): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        const result = await updateCalendarRulesApi(data)
        dispatch({
          type: 'SET_CALENDAR_RULES',
          payload: {
            statementClosingDay: result.statementClosingDay,
            paymentDueDay: result.paymentDueDay,
            salaryFromDay: result.salaryFromDay,
            salaryToDay: result.salaryToDay,
            referenceDateIso: state.calendarRules.referenceDateIso,
          },
        })
        dispatch({ type: 'SET_INSTALLMENT_MIN_AMOUNT', payload: result.installmentMinAmount })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi lưu cấu hình lịch.')
        return false
      } finally { setLoading(false) }
    },
    [dispatch, state.calendarRules.referenceDateIso],
  )

  const saveMasterData = useCallback(
    async (data: MasterDataApiDto): Promise<boolean> => {
      setLoading(true); setError(null)
      try {
        await updateMasterDataApi(data)
        // Reload all data to sync with server
        await reloadApiData()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi khi lưu danh mục.')
        return false
      } finally { setLoading(false) }
    },
    [reloadApiData],
  )

  return { loading, error, saveCalendarRules, saveMasterData }
}
