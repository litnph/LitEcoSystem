/** Nguồn mua trước trả sau (thẻ Visa, ShopeePay, Momo trả sau...) */
export type BnplProvider = {
  id: string
  name: string
  /** Ngày chốt sao kê hàng tháng (1–28) */
  statementDay: number
}

export const DEFAULT_STATEMENT_DAY = 20
