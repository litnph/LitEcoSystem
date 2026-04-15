export type ConfirmedStatementStatus = 'unpaid' | 'paid'

export type ConfirmedStatement = {
  id: string
  providerId: string
  providerName: string
  period: string
  total: number
  /** Hạn thanh toán hiển thị (dd/mm/yyyy) */
  dueDateLabel: string
  status: ConfirmedStatementStatus
}
