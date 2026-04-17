import { apiRequest } from '@/shared/api/client'
import type { SpendingPeriod } from '../model/spending-period.types'

export type ConfirmedStatementStatus = 'unpaid' | 'paid'

export type ConfirmedStatement = {
  id: string
  providerId: string
  providerName: string
  period: string
  total: number
  dueDateLabel: string
  status: ConfirmedStatementStatus
}

// ── Spending periods ──────────────────────────────────────────
type SpendingPeriodDto = { id: string; name: string; startDate: string; endDate: string; createdAt: string }

function mapPeriod(d: SpendingPeriodDto): SpendingPeriod {
  return { id: d.id, name: d.name, startDate: d.startDate, endDate: d.endDate }
}

export async function getSpendingPeriodsApi(): Promise<SpendingPeriod[]> {
  const dtos = await apiRequest<SpendingPeriodDto[]>('/spending-cycles/periods', { auth: true })
  return dtos.map(mapPeriod)
}

export async function createSpendingPeriodApi(data: { name: string; startDate: string; endDate: string }): Promise<SpendingPeriod> {
  const dto = await apiRequest<SpendingPeriodDto>('/spending-cycles/periods', { method: 'POST', auth: true, body: data })
  return mapPeriod(dto)
}

export async function updateSpendingPeriodApi(id: string, data: { name: string; startDate: string; endDate: string }): Promise<SpendingPeriod> {
  const dto = await apiRequest<SpendingPeriodDto>(`/spending-cycles/periods/${id}`, { method: 'PUT', auth: true, body: data })
  return mapPeriod(dto)
}

export async function deleteSpendingPeriodApi(id: string): Promise<void> {
  await apiRequest<void>(`/spending-cycles/periods/${id}`, { method: 'DELETE', auth: true })
}

// ── Confirmed statements ──────────────────────────────────────
type StatementDto = {
  id: string; providerId: string; providerName: string; period: string
  total: number; dueDateLabel: string; status: string; createdAt: string
}

function mapStatement(d: StatementDto): ConfirmedStatement {
  return {
    id: d.id,
    providerId: d.providerId,
    providerName: d.providerName,
    period: d.period,
    total: d.total,
    dueDateLabel: d.dueDateLabel,
    status: d.status as 'unpaid' | 'paid',
  }
}

export async function getConfirmedStatementsApi(): Promise<ConfirmedStatement[]> {
  const dtos = await apiRequest<StatementDto[]>('/spending-cycles/statements', { auth: true })
  return dtos.map(mapStatement)
}

export type ConfirmStatementPayload = {
  providerId: string
  providerName: string
  period: string
  total: number
  dueDateLabel: string
}

export async function confirmStatementApi(data: ConfirmStatementPayload): Promise<ConfirmedStatement> {
  const dto = await apiRequest<StatementDto>('/spending-cycles/statements', { method: 'POST', auth: true, body: data })
  return mapStatement(dto)
}

export async function patchStatementStatusApi(id: string, paid: boolean): Promise<ConfirmedStatement> {
  const dto = await apiRequest<StatementDto>(`/spending-cycles/statements/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: { paid },
  })
  return mapStatement(dto)
}
