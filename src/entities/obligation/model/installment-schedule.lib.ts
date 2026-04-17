import type { InstallmentPlan } from './obligation.types'

export function monthsBetweenPeriods(fromPeriod: string, toPeriod: string): number {
  const [fy, fm] = fromPeriod.split('-').map(Number)
  const [ty, tm] = toPeriod.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

export function installmentChargeForPeriod(plan: InstallmentPlan, period: string): number {
  if (plan.status === 'completed') return 0
  const idx = monthsBetweenPeriods(plan.firstBillingPeriod, period)
  if (idx < 0 || idx >= plan.tenorMonths) return 0
  if (idx !== plan.paidMonths) return 0
  if (idx === 0) return plan.conversionFee + plan.monthlyPrincipal
  return plan.monthlyPrincipal
}

export function totalInstallmentChargesForPeriod(
  plans: InstallmentPlan[],
  providerId: string,
  period: string,
): number {
  return plans
    .filter((p) => p.providerId === providerId)
    .reduce((sum, p) => sum + installmentChargeForPeriod(p, period), 0)
}
