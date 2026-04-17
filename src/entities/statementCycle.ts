/**
 * Chu kỳ sao kê: từ ngày (statementDay+1) tháng trước đến hết ngày statementDay tháng hiện tại.
 * Ví dụ statementDay=20: 21/03–20/04 thuộc kỳ "2026-04".
 */

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Parse yyyy-mm-dd as local date */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Kỳ sao kê dạng YYYY-MM (tháng của ngày chốt) */
export function getStatementPeriodForDate(
  occurredAt: string,
  statementDay: number,
): string {
  const d = parseISODate(occurredAt)
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()

  let periodY = y
  let periodM = m

  if (day > statementDay) {
    periodM = m + 1
    if (periodM > 11) {
      periodM = 0
      periodY += 1
    }
  }

  return `${periodY}-${pad2(periodM + 1)}`
}

export function periodEndDate(period: string, statementDay: number): Date {
  const [ys, ms] = period.split('-')
  const y = Number(ys)
  const m = Number(ms) - 1
  return new Date(y, m, statementDay)
}

export function formatPeriodVi(period: string): string {
  const [y, m] = period.split('-')
  return `Tháng ${Number(m)}/${y}`
}

/** Giao dịch có thuộc kỳ period (YYYY-MM) không */
export function isInStatementPeriod(
  occurredAt: string,
  period: string,
  statementDay: number,
): boolean {
  return getStatementPeriodForDate(occurredAt, statementDay) === period
}

type BnplPeriodSource = {
  occurredAt: string
  bnplDeferredToPeriod?: string
}

/**
 * Kỳ sao kê hiệu dụng cho BNPL: nếu đã hoãn thì dùng kỳ đích, không thì theo ngày giao dịch.
 */
export function getEffectiveBnplStatementPeriod(
  t: BnplPeriodSource,
  statementDay: number,
): string {
  if (t.bnplDeferredToPeriod) return t.bnplDeferredToPeriod
  return getStatementPeriodForDate(t.occurredAt, statementDay)
}

/** Kỳ kế tiếp sau period */
export function nextPeriod(period: string): string {
  const [ys, ms] = period.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const next = new Date(y, m, 1)
  next.setMonth(next.getMonth() + 1)
  return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`
}

/**
 * Hạn thanh toán thẻ: ngày `paymentDueDay` của tháng sau kỳ sao kê (YYYY-MM).
 * Ví dụ kỳ sao kê 2026-04, hạn ngày 5 → 05/05/2026.
 */
export function dueDateLabelForPeriod(period: string, paymentDueDay: number): string {
  const [ys, ms] = period.split('-')
  const y = Number(ys)
  const m = Number(ms) - 1
  const due = new Date(y, m + 1, paymentDueDay)
  return `${pad2(due.getDate())}/${pad2(due.getMonth() + 1)}/${due.getFullYear()}`
}
