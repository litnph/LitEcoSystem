/**
 * Trả góp: chuyển từ giao dịch BNPL.
 * Sao kê kỳ đầu tiên sau khi tạo plan phải gồm: phí chuyển đổi + kỳ trả góp đầu tiên.
 */

export type InstallmentPlan = {
  id: string
  sourceTransactionId: string
  providerId: string
  principal: number
  tenorMonths: number
  conversionFee: number
  /** Gốc / số tháng, làm tròn */
  monthlyPrincipal: number
  /** Kỳ sao kê đầu tiên có phí + trả góp tháng 1 (YYYY-MM) */
  firstBillingPeriod: string
  paidMonths: number
  status: 'active' | 'completed'
}

export function computeMonthlyPrincipal(
  principal: number,
  tenorMonths: number,
): number {
  if (tenorMonths <= 0) return 0
  return Math.round(principal / tenorMonths)
}
