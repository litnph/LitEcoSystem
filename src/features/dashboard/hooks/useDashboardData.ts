import { useMemo } from 'react'
import { usePfm } from '../../../app/PfmProvider'
import {
  getEffectiveBnplStatementPeriod,
  getStatementPeriodForDate,
  isBnplExpense,
} from '../../../entities'
import { resolveReferenceDate } from '../../../shared/config/referenceDate'

const CHART_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#CA8A04', '#7C3AED']

export function useDashboardData() {
  const { state } = usePfm()

  const ref = resolveReferenceDate(state.calendarRules.referenceDateIso)

  const pendingBnplAlerts = useMemo(() => {
    const alerts: { providerName: string; period: string; count: number }[] = []
    for (const p of state.bnplProviders) {
      const period = getStatementPeriodForDate(ref, p.statementDay)
      const count = state.transactions.filter(
        (t) =>
          t.bnplProviderId === p.id &&
          isBnplExpense(t) &&
          !t.settledInStatementPeriod &&
          getEffectiveBnplStatementPeriod(t, p.statementDay) === period,
      ).length
      if (count > 0) {
        alerts.push({ providerName: p.name, period, count })
      }
    }
    return alerts
  }, [state.transactions, state.bnplProviders, state.calendarRules.referenceDateIso, ref])

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of state.transactions) {
      if (t.type !== 'expense') continue
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1])
    return entries.map(([label, value], i) => ({
      label,
      value: Math.round((value / total) * 100),
      amount: value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [state.transactions])

  const recentTransactions = useMemo(() => {
    return [...state.transactions]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 8)
  }, [state.transactions])

  const unpaidStatements = useMemo(
    () => state.confirmedStatements.filter((s) => s.status === 'unpaid'),
    [state.confirmedStatements],
  )

  const urgentDebts = useMemo(() => {
    return state.debts.filter((d) => d.status === 'active')
  }, [state.debts])

  return {
    netWorth: state.netWorth,
    pendingBnplAlerts,
    spendingByCategory,
    recentTransactions,
    unpaidStatements,
    urgentDebts,
  }
}
