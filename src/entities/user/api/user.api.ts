import { apiRequest } from '@/shared/api/client'

export type CalendarRulesApiDto = {
  statementClosingDay: number
  paymentDueDay: number
  salaryFromDay: number
  salaryToDay: number
}

export type MasterDataApiDto = {
  categories: string[]
  categoryKinds: Record<string, string>
  paymentSources: string[]
  paymentSourceModes: Record<string, string>
  paymentSourceStatementDays: Record<string, number>
  paymentSourceDueDays: Record<string, number>
  paymentSourceInstallmentLimits: Record<string, number | null>
  paymentChannels: string[]
}

export type UserConfigurationApiDto = {
  calendarRules: CalendarRulesApiDto
  masterData: MasterDataApiDto
}

export async function getUserConfigurationApi(): Promise<UserConfigurationApiDto> {
  return apiRequest<UserConfigurationApiDto>('/configuration', { auth: true })
}

export async function updateCalendarRulesApi(data: CalendarRulesApiDto): Promise<CalendarRulesApiDto> {
  return apiRequest<CalendarRulesApiDto>('/configuration/calendar-rules', {
    method: 'PUT',
    auth: true,
    body: data,
  })
}

export async function updateMasterDataApi(data: MasterDataApiDto): Promise<MasterDataApiDto> {
  return apiRequest<MasterDataApiDto>('/configuration/master-data', {
    method: 'PUT',
    auth: true,
    body: data,
  })
}
