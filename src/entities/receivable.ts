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
