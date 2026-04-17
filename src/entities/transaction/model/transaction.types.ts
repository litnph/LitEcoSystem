export type TransactionType = 'income' | 'expense'

export type PaymentMode =
  | 'direct'
  | 'bnpl'
  | 'installment_payment'
  | 'debt_payment'

export type TransactionBusinessType =
  | 'normal'
  | 'advance_payment'
  | 'loan_given'
  | 'loan_borrowed'
  | 'receivable_collection'

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  /** ISO date yyyy-mm-dd */
  occurredAt: string
  merchant: string
  channel: string
  category: string
  source: string
  paymentMode: PaymentMode
  businessType?: TransactionBusinessType
  counterpartyName?: string
  relatedReceivableId?: string
  relatedDebtId?: string
  bnplProviderId?: string
  installmentConverted?: boolean
  installmentPlanId?: string
  settledInStatementPeriod?: string
  bnplDeferredToPeriod?: string
  manuallyIncludedInStatementPeriod?: string
  note?: string
}

export function isExpense(t: Transaction): boolean {
  return t.type === 'expense'
}

export function isBnplExpense(t: Transaction): boolean {
  return t.type === 'expense' && t.paymentMode === 'bnpl' && !t.installmentConverted
}
