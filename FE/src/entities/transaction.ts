export type TransactionType = 'income' | 'expense'

export type PaymentMode =
  | 'direct'
  | 'bnpl'
  | 'installment_payment'
  | 'debt_payment'

/** Giao dịch thu/chi */
export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  /** ISO date yyyy-mm-dd */
  occurredAt: string
  merchant: string
  channel: string
  category: string
  /** Nguồn chi / nhận: cash, atm, visa, momo... */
  source: string
  paymentMode: PaymentMode
  /** BNPL: ví/thẻ trả sau */
  bnplProviderId?: string
  /** Đã chuyển sang trả góp — không còn nợ trong sao kê mở */
  installmentConverted?: boolean
  installmentPlanId?: string
  /** Đã ghi vào sao kê kỳ (YYYY-MM) sau khi chốt */
  settledInStatementPeriod?: string
  /**
   * Hoãn gộp vào kỳ sao kê sau (YYYY-MM). Dùng khi bỏ chọn ở màn chốt:
   * giao dịch được tính sang kỳ chi tiêu / sao kê tháng sau.
   */
  bnplDeferredToPeriod?: string
  /** Kỳ sao kê đã thêm tay giao dịch ngoài kỳ chuẩn */
  manuallyIncludedInStatementPeriod?: string
  note?: string
}

export function isExpense(t: Transaction): boolean {
  return t.type === 'expense'
}

export function isBnplExpense(t: Transaction): boolean {
  return t.type === 'expense' && t.paymentMode === 'bnpl' && !t.installmentConverted
}
