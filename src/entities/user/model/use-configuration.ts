import { useQuery } from '@tanstack/react-query'
import { getUserConfigurationApi } from '../api/user.api'
import { buildBnplProvidersFromConfig } from '@/entities/bnpl'

export const CONFIGURATION_QUERY_KEY = ['configuration'] as const

export function useConfigurationQuery() {
  return useQuery({
    queryKey: CONFIGURATION_QUERY_KEY,
    queryFn: getUserConfigurationApi,
    select: (data) => {
      const bnplProviders = buildBnplProvidersFromConfig(
        data.masterData.paymentSources,
        data.masterData.paymentSourceModes as Record<string, string>,
        data.masterData.paymentSourceStatementDays,
      )
      return { ...data, bnplProviders }
    },
  })
}

export type ConfigurationData = NonNullable<ReturnType<typeof useConfigurationQuery>['data']>
