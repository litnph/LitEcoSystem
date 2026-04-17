// ── Debts ─────────────────────────────────────────────────────
export type DebtRecord = {
  id: string
  title: string
  lender: string
  principal: number
  paidAmount: number
  dueDate: string
  status: 'active' | 'settled'
}

export function remainingDebt(d: DebtRecord): number {
  return Math.max(0, d.principal - d.paidAmount)
}

// ── Receivables ───────────────────────────────────────────────
export type ReceivableRecord = {
  id: string
  title: string
  borrower: string
  principal: number
  collectedAmount: number
  dueDate: string
  status: 'active' | 'settled'
  kind?: 'advance' | 'loan_given'
  sourceTransactionId?: string
}

export function remainingReceivable(r: ReceivableRecord): number {
  return Math.max(0, r.principal - r.collectedAmount)
}

// ── Installments ──────────────────────────────────────────────
export type InstallmentPlan = {
  id: string
  sourceTransactionId: string
  providerId: string
  principal: number
  tenorMonths: number
  conversionFee: number
  monthlyPrincipal: number
  firstBillingPeriod: string
  paidMonths: number
  status: 'active' | 'completed'
}

export function computeMonthlyPrincipal(principal: number, tenorMonths: number): number {
  if (tenorMonths <= 0) return 0
  return Math.round(principal / tenorMonths)
}
