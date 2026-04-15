export type MonthlyClose = {
  id: string
  /** Calendar month YYYY-MM being closed (e.g. "2026-04") */
  period: string
  /** ISO timestamp when close was created */
  closedAt: string
  /** IDs of direct expense transactions included */
  directTransactionIds: string[]
  /** IDs of income transactions included */
  incomeTransactionIds: string[]
  /** IDs of confirmed BNPL statements included */
  confirmedStatementIds: string[]
  /** Sum of direct expense amounts */
  totalDirect: number
  /** Sum of income amounts */
  totalIncome: number
  /** Sum of BNPL statement totals */
  totalBnpl: number
  /** net = totalIncome - totalDirect - totalBnpl */
  net: number
}
