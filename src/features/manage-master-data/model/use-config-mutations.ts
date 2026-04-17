import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateCalendarRulesApi,
  updateMasterDataApi,
  type CalendarRulesApiDto,
  type MasterDataApiDto,
} from '@/entities/user'
import { CONFIGURATION_QUERY_KEY } from '@/entities/user'

export function useSaveCalendarRules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CalendarRulesApiDto) => updateCalendarRulesApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGURATION_QUERY_KEY }),
  })
}

export function useSaveMasterData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MasterDataApiDto) => updateMasterDataApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGURATION_QUERY_KEY }),
  })
}

export type { CalendarRulesApiDto, MasterDataApiDto }
