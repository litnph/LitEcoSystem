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
