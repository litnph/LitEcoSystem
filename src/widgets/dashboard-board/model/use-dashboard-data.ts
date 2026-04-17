import { useMemo } from 'react'
import { useTransactionsQuery, isBnplExpense } from '@/entities/transaction'
import { useStatementsQuery, getStatementPeriodForDate, getEffectiveBnplStatementPeriod } from '@/entities/spending-cycle'
import { useDebtsQuery } from '@/entities/obligation'
import { useConfigurationQuery } from '@/entities/user'

const CHART_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#CA8A04', '#7C3AED']

export function useDashboardData() {
  const { data: transactions = [] } = useTransactionsQuery()
  const { data: statements = [] } = useStatementsQuery()
  const { data: debts = [] } = useDebtsQuery()
  const { data: config } = useConfigurationQuery()

  const bnplProviders = config?.bnplProviders ?? []
  const ref = new Date().toISOString().slice(0, 10)

  const pendingBnplAlerts = useMemo(() => {
    const alerts: { providerName: string; period: string; count: number }[] = []
    for (const p of bnplProviders) {
      const period = getStatementPeriodForDate(ref, p.statementDay)
      const count = transactions.filter(
        (t) =>
          t.bnplProviderId === p.id &&
          isBnplExpense(t) &&
          !t.settledInStatementPeriod &&
          getEffectiveBnplStatementPeriod(t, p.statementDay) === period,
      ).length
      if (count > 0) alerts.push({ providerName: p.name, period, count })
    }
    return alerts
  }, [transactions, bnplProviders, ref])

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
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
  }, [transactions])

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8),
    [transactions],
  )

  const unpaidStatements = useMemo(() => statements.filter((s) => s.status === 'unpaid'), [statements])
  const urgentDebts = useMemo(() => debts.filter((d) => d.status === 'active'), [debts])

  return {
    netWorth: 0,
    pendingBnplAlerts,
    spendingByCategory,
    recentTransactions,
    unpaidStatements,
    urgentDebts,
  }
}
