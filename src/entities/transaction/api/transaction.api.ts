import { apiRequest } from '@/shared/api/client'
import type { PaymentMode, Transaction, TransactionBusinessType, TransactionType } from '../model/transaction.types'

export type TransactionApiDto = {
  id: string
  type: string
  amount: number
  occurredAt: string
  merchant: string
  channel: string
  category: string
  source: string
  paymentMode: string
  businessType: string
  counterpartyName: string | null
  bnplProviderId: string | null
  installmentConverted: boolean
  installmentPlanId: string | null
  settledInStatementPeriod: string | null
  bnplDeferredToPeriod: string | null
  manuallyIncludedInStatementPeriod: string | null
  relatedReceivableId: string | null
  relatedDebtId: string | null
  note: string | null
  createdAt: string
}

function mapPaymentMode(m: string): PaymentMode {
  const MAP: Record<string, string> = {
    installmentpayment: 'installment_payment',
    debtpayment: 'debt_payment',
  }
  return (MAP[m] ?? m) as PaymentMode
}

function mapBusinessType(b: string): TransactionBusinessType {
  const MAP: Record<string, string> = {
    advancepayment: 'advance_payment',
    loangiven: 'loan_given',
    loanborrowed: 'loan_borrowed',
    receivablecollection: 'receivable_collection',
  }
  return (MAP[b] ?? b) as TransactionBusinessType
}

export function mapTransactionDto(dto: TransactionApiDto): Transaction {
  return {
    id: dto.id,
    type: dto.type as TransactionType,
    amount: dto.amount,
    occurredAt: dto.occurredAt,
    merchant: dto.merchant,
    channel: dto.channel,
    category: dto.category,
    source: dto.source,
    paymentMode: mapPaymentMode(dto.paymentMode),
    businessType: mapBusinessType(dto.businessType),
    counterpartyName: dto.counterpartyName ?? undefined,
    bnplProviderId: dto.bnplProviderId ?? undefined,
    installmentConverted: dto.installmentConverted,
    installmentPlanId: dto.installmentPlanId ?? undefined,
    settledInStatementPeriod: dto.settledInStatementPeriod ?? undefined,
    bnplDeferredToPeriod: dto.bnplDeferredToPeriod ?? undefined,
    manuallyIncludedInStatementPeriod: dto.manuallyIncludedInStatementPeriod ?? undefined,
    relatedReceivableId: dto.relatedReceivableId ?? undefined,
    relatedDebtId: dto.relatedDebtId ?? undefined,
    note: dto.note ?? undefined,
  }
}

export type TransactionFilters = {
  from?: string
  to?: string
  type?: string
  category?: string
  source?: string
  paymentMode?: string
  search?: string
}

export async function getTransactionsApi(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const q = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v) })
  const qs = q.toString() ? `?${q.toString()}` : ''
  const dtos = await apiRequest<TransactionApiDto[]>(`/transactions${qs}`, { auth: true })
  return dtos.map(mapTransactionDto)
}

export type CreateTransactionPayload = {
  type: string
  amount: number
  occurredAt: string
  merchant: string
  channel: string
  category: string
  source: string
  paymentMode: string
  businessType?: string
  counterpartyName?: string
  bnplProviderId?: string
  relatedReceivableId?: string
  relatedDebtId?: string
  note?: string
}

export async function createTransactionApi(payload: CreateTransactionPayload): Promise<Transaction> {
  const dto = await apiRequest<TransactionApiDto>('/transactions', {
    method: 'POST',
    auth: true,
    body: payload,
  })
  return mapTransactionDto(dto)
}

export type UpdateTransactionPayload = {
  type: string
  amount: number
  occurredAt: string
  merchant: string
  channel: string
  category: string
  source: string
  note?: string
}

export async function updateTransactionApi(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
  const dto = await apiRequest<TransactionApiDto>(`/transactions/${id}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  })
  return mapTransactionDto(dto)
}

export async function deleteTransactionApi(id: string): Promise<void> {
  await apiRequest<void>(`/transactions/${id}`, { method: 'DELETE', auth: true })
}
