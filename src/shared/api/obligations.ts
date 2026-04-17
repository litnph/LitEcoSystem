import { apiRequest } from './client'
import type { DebtRecord, InstallmentPlan, ReceivableRecord } from '../../entities'

// ── Installment plans ─────────────────────────────────────────
type InstallmentDto = {
  id: string; sourceTransactionId: string; providerId: string
  principal: number; tenorMonths: number; conversionFee: number
  monthlyPrincipal: number; firstBillingPeriod: string; paidMonths: number
  status: string; createdAt: string
}

function mapInstallment(d: InstallmentDto): InstallmentPlan {
  return {
    id: d.id,
    sourceTransactionId: d.sourceTransactionId,
    providerId: d.providerId,
    principal: d.principal,
    tenorMonths: d.tenorMonths,
    conversionFee: d.conversionFee,
    monthlyPrincipal: d.monthlyPrincipal,
    firstBillingPeriod: d.firstBillingPeriod,
    paidMonths: d.paidMonths,
    status: d.status as 'active' | 'completed',
  }
}

export async function getInstallmentsApi(status?: string): Promise<InstallmentPlan[]> {
  const qs = status ? `?status=${status}` : ''
  const dtos = await apiRequest<InstallmentDto[]>(`/obligations/installments${qs}`, { auth: true })
  return dtos.map(mapInstallment)
}

export type ConvertInstallmentPayload = {
  sourceTransactionId: string
  providerId: string
  tenorMonths: number
  conversionFee: number
  firstBillingPeriod: string
}

export async function convertToInstallmentApi(data: ConvertInstallmentPayload): Promise<InstallmentPlan> {
  const dto = await apiRequest<InstallmentDto>('/obligations/installments', { method: 'POST', auth: true, body: data })
  return mapInstallment(dto)
}

export async function payInstallmentMonthApi(id: string): Promise<InstallmentPlan> {
  const dto = await apiRequest<InstallmentDto>(`/obligations/installments/${id}/pay-month`, { method: 'POST', auth: true })
  return mapInstallment(dto)
}

// ── Debts ─────────────────────────────────────────────────────
type DebtDto = {
  id: string; title: string; lender: string; principal: number
  paidAmount: number; remaining: number; dueDate: string; status: string; note: string | null
}

function mapDebt(d: DebtDto): DebtRecord {
  return {
    id: d.id, title: d.title, lender: d.lender,
    principal: d.principal, paidAmount: d.paidAmount,
    dueDate: d.dueDate, status: d.status as 'active' | 'settled',
  }
}

export async function getDebtsApi(status?: string): Promise<DebtRecord[]> {
  const qs = status ? `?status=${status}` : ''
  const dtos = await apiRequest<DebtDto[]>(`/obligations/debts${qs}`, { auth: true })
  return dtos.map(mapDebt)
}

export type CreateDebtPayload = { title: string; lender: string; principal: number; dueDate: string; note?: string }

export async function createDebtApi(data: CreateDebtPayload): Promise<DebtRecord> {
  const dto = await apiRequest<DebtDto>('/obligations/debts', { method: 'POST', auth: true, body: data })
  return mapDebt(dto)
}

export async function updateDebtApi(id: string, data: CreateDebtPayload): Promise<DebtRecord> {
  const dto = await apiRequest<DebtDto>(`/obligations/debts/${id}`, { method: 'PUT', auth: true, body: data })
  return mapDebt(dto)
}

export async function payDebtApi(id: string, amount: number): Promise<DebtRecord> {
  const dto = await apiRequest<DebtDto>(`/obligations/debts/${id}/pay`, { method: 'POST', auth: true, body: { amount } })
  return mapDebt(dto)
}

export async function deleteDebtApi(id: string): Promise<void> {
  await apiRequest<void>(`/obligations/debts/${id}`, { method: 'DELETE', auth: true })
}

// ── Receivables ───────────────────────────────────────────────
type ReceivableDto = {
  id: string; title: string; borrower: string; principal: number
  collectedAmount: number; remaining: number; dueDate: string; status: string
  kind: string; sourceTransactionId: string | null; note: string | null
}

function mapReceivable(d: ReceivableDto): ReceivableRecord {
  const kindMap: Record<string, 'advance' | 'loan_given'> = { loangiven: 'loan_given' }
  return {
    id: d.id, title: d.title, borrower: d.borrower,
    principal: d.principal, collectedAmount: d.collectedAmount,
    dueDate: d.dueDate, status: d.status as 'active' | 'settled',
    kind: (kindMap[d.kind] ?? d.kind) as 'advance' | 'loan_given',
    sourceTransactionId: d.sourceTransactionId ?? undefined,
  }
}

export async function getReceivablesApi(status?: string): Promise<ReceivableRecord[]> {
  const qs = status ? `?status=${status}` : ''
  const dtos = await apiRequest<ReceivableDto[]>(`/obligations/receivables${qs}`, { auth: true })
  return dtos.map(mapReceivable)
}

export type CreateReceivablePayload = {
  title: string; borrower: string; principal: number; dueDate: string
  kind?: string; sourceTransactionId?: string; note?: string
}

export async function createReceivableApi(data: CreateReceivablePayload): Promise<ReceivableRecord> {
  const dto = await apiRequest<ReceivableDto>('/obligations/receivables', { method: 'POST', auth: true, body: data })
  return mapReceivable(dto)
}

export async function collectReceivableApi(id: string, amount: number): Promise<ReceivableRecord> {
  const dto = await apiRequest<ReceivableDto>(`/obligations/receivables/${id}/collect`, {
    method: 'POST', auth: true, body: { amount },
  })
  return mapReceivable(dto)
}

export async function deleteReceivableApi(id: string): Promise<void> {
  await apiRequest<void>(`/obligations/receivables/${id}`, { method: 'DELETE', auth: true })
}
