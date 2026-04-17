export type SpendingPeriod = {
  id: string
  /** Display name, defaults to "Tháng X/YYYY" */
  name: string
  /** Inclusive start date (yyyy-mm-dd) */
  startDate: string
  /** Inclusive end date (yyyy-mm-dd) */
  endDate: string
}

export type MonthlyClose = {
  id: string
  /** Calendar month YYYY-MM being closed (e.g. "2026-04") */
  period: string
  /** ISO timestamp when close was created */
  closedAt: string
  directTransactionIds: string[]
  incomeTransactionIds: string[]
  confirmedStatementIds: string[]
  totalDirect: number
  totalIncome: number
  totalBnpl: number
  net: number
}
