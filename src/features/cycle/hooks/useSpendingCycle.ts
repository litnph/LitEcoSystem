import { useMemo, useState } from 'react'
import { usePfmDispatch, usePfmState } from '../../../app/PfmProvider'
import { resolveReferenceDate } from '../../../shared/config/referenceDate'
import { getEffectiveBnplStatementPeriod } from '../../../entities'
import { useCycleMutations } from '../../../shared/hooks/useCycleMutations'

function inRange(dateISO: string, from: string, to: string): boolean {
  return dateISO >= from && dateISO <= to
}

function defaultPeriodNameFromEnd(endDate: string): string {
  const [y, m] = endDate.split('-')
  return `Tháng ${Number(m)}/${y}`
}

export function useSpendingCycle() {
  const state = usePfmState()
  const dispatch = usePfmDispatch()
  const cycleMutations = useCycleMutations()
  const ref = resolveReferenceDate(state.calendarRules.referenceDateIso)

  const periods = useMemo(
    () =>
      [...state.spendingPeriods].sort((a, b) =>
        b.startDate.localeCompare(a.startDate),
      ),
    [state.spendingPeriods],
  )

  const currentPeriod = useMemo(
    () => periods.find((p) => inRange(ref, p.startDate, p.endDate)) ?? periods[0],
    [periods, ref],
  )

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    currentPeriod?.id ?? '',
  )

  const selectedPeriod =
    periods.find((p) => p.id === selectedPeriodId) ?? currentPeriod ?? null

  const nextPeriod = useMemo(() => {
    if (!selectedPeriod) return null
    const idx = periods.findIndex((p) => p.id === selectedPeriod.id)
    return idx > 0 ? periods[idx - 1] : null
  }, [periods, selectedPeriod])

  const directTxs = useMemo(
    () =>
      selectedPeriod
        ? state.transactions.filter(
            (t) =>
              t.type === 'expense' &&
              t.paymentMode === 'direct' &&
              inRange(t.occurredAt, selectedPeriod.startDate, selectedPeriod.endDate),
          )
        : [],
    [state.transactions, selectedPeriod],
  )

  const incomeTxs = useMemo(
    () =>
      selectedPeriod
        ? state.transactions.filter(
            (t) =>
              t.type === 'income' &&
              inRange(t.occurredAt, selectedPeriod.startDate, selectedPeriod.endDate),
          )
        : [],
    [state.transactions, selectedPeriod],
  )

  const selectedPeriodKey = selectedPeriod?.id ?? ''
  const existingClose = state.monthlyCloses.find((c) => c.period === selectedPeriodKey)

  const confirmedForPeriod = useMemo(
    () =>
      selectedPeriod
        ? state.confirmedStatements.filter((s) => s.period === selectedPeriod.id)
        : [],
    [state.confirmedStatements, selectedPeriod],
  )

  const bnplByProvider = useMemo(() => {
    if (!selectedPeriod) return []
    return state.bnplProviders.map((provider) => {
      const txs = state.transactions.filter(
        (t) =>
          t.bnplProviderId === provider.id &&
          t.paymentMode === 'bnpl' &&
          t.type === 'expense' &&
          !t.installmentConverted &&
          getEffectiveBnplStatementPeriod(t, provider.statementDay) === selectedPeriod.id,
      )
      const pendingTxs = txs.filter((t) => !t.settledInStatementPeriod)
      const subtotal = txs.reduce((s, t) => s + t.amount, 0)
      const pendingSubtotal = pendingTxs.reduce((s, t) => s + t.amount, 0)
      const stmt = state.confirmedStatements.find(
        (s) => s.providerId === provider.id && s.period === selectedPeriod.id,
      )
      const installmentPlans = state.installmentPlans.filter(
        (pl) => pl.providerId === provider.id,
      )
      return {
        provider,
        txs,
        pendingTxs,
        subtotal,
        pendingSubtotal,
        stmtExists: !!stmt,
        stmtStatus: stmt?.status,
        installmentPlans,
      }
    })
  }, [
    state.transactions,
    state.bnplProviders,
    state.confirmedStatements,
    state.installmentPlans,
    selectedPeriod,
  ])

  const totalDirect = directTxs.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomeTxs.reduce((s, t) => s + t.amount, 0)
  const totalBnpl = confirmedForPeriod.reduce((s, x) => s + x.total, 0)
  const net = totalIncome - totalDirect - totalBnpl

  function closeMonth() {
    if (!selectedPeriod || existingClose) return
    dispatch({
      type: 'CLOSE_MONTHLY_PERIOD',
      payload: {
        period: selectedPeriod.id,
        directTransactionIds: directTxs.map((t) => t.id),
        incomeTransactionIds: incomeTxs.map((t) => t.id),
        confirmedStatementIds: confirmedForPeriod.map((s) => s.id),
        totalDirect,
        totalIncome,
        totalBnpl,
        net,
      },
    })
  }

  function addSpendingPeriod(input: { id: string; name?: string; startDate: string; endDate: string }) {
    const id = input.id.trim()
    const startDate = input.startDate
    const endDate = input.endDate
    if (!id) return { ok: false as const, error: 'Vui lòng nhập mã kỳ.' }
    if (!startDate || !endDate) {
      return { ok: false as const, error: 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.' }
    }
    if (startDate > endDate) {
      return { ok: false as const, error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.' }
    }
    if (state.spendingPeriods.some((p) => p.id === id)) {
      return { ok: false as const, error: 'Mã kỳ đã tồn tại, vui lòng dùng mã khác.' }
    }
    const overlap = state.spendingPeriods.some(
      (p) => !(endDate < p.startDate || startDate > p.endDate),
    )
    if (overlap) {
      return {
        ok: false as const,
        error: 'Khoảng ngày bị trùng với kỳ đã có. Vui lòng chọn khoảng khác.',
      }
    }
    const name = input.name?.trim() || defaultPeriodNameFromEnd(endDate)
    // Call API async and also update local state immediately for responsiveness
    void cycleMutations.addPeriod({ name, startDate, endDate })
    dispatch({ type: 'ADD_SPENDING_PERIOD', payload: { id, name, startDate, endDate } })
    setSelectedPeriodId(id)
    return { ok: true as const }
  }

  function updateSpendingPeriod(input: { id: string; name?: string; startDate: string; endDate: string }) {
    const id = input.id.trim()
    const startDate = input.startDate
    const endDate = input.endDate
    if (!id || !state.spendingPeriods.some((p) => p.id === id)) {
      return { ok: false as const, error: 'Kỳ chi tiêu không hợp lệ.' }
    }
    if (!startDate || !endDate) {
      return { ok: false as const, error: 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.' }
    }
    if (startDate > endDate) {
      return { ok: false as const, error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.' }
    }
    const overlap = state.spendingPeriods.some(
      (p) => p.id !== id && !(endDate < p.startDate || startDate > p.endDate),
    )
    if (overlap) {
      return {
        ok: false as const,
        error: 'Khoảng ngày bị trùng với kỳ đã có. Vui lòng chọn khoảng khác.',
      }
    }
    const name = input.name?.trim() || defaultPeriodNameFromEnd(endDate)
    void cycleMutations.updatePeriod(id, { name, startDate, endDate })
    dispatch({ type: 'UPDATE_SPENDING_PERIOD', payload: { id, name, startDate, endDate } })
    return { ok: true as const }
  }

  function removeSpendingPeriod(periodId: string) {
    if (!state.spendingPeriods.some((p) => p.id === periodId)) {
      return { ok: false as const, error: 'Kỳ chi tiêu không tồn tại.' }
    }
    if (state.monthlyCloses.some((x) => x.period === periodId)) {
      return { ok: false as const, error: 'Không thể xóa kỳ đã chốt.' }
    }
    if (state.confirmedStatements.some((x) => x.period === periodId)) {
      return { ok: false as const, error: 'Không thể xóa kỳ đã có sao kê được xác nhận.' }
    }
    const sorted = [...state.spendingPeriods].sort((a, b) => b.startDate.localeCompare(a.startDate))
    const idx = sorted.findIndex((p) => p.id === periodId)
    void cycleMutations.deletePeriod(periodId)
    dispatch({ type: 'REMOVE_SPENDING_PERIOD', payload: { id: periodId } })
    if (selectedPeriodId === periodId) {
      const fallback = sorted[idx + 1]?.id ?? sorted[idx - 1]?.id ?? ''
      setSelectedPeriodId(fallback)
    }
    return { ok: true as const }
  }

  function confirmBnplWithDeferrals(
    providerId: string,
    statementDay: number,
    includeTransactionIds: string[],
    deferTransactionIds: string[],
  ) {
    if (!selectedPeriod) return
    const providerName = state.bnplProviders.find((p) => p.id === providerId)?.name ?? ''
    const includedTotal = (state.transactions ?? [])
      .filter((t) => includeTransactionIds.includes(t.id))
      .reduce((s, t) => s + t.amount, 0)
    // Call API async + update local state immediately
    void cycleMutations.confirmStatement({
      providerId,
      providerName,
      period: selectedPeriod.id,
      total: includedTotal,
      dueDateLabel: '',
    })
    dispatch({
      type: 'CONFIRM_BNPL_STATEMENT_WITH_DEFERRALS',
      payload: {
        providerId,
        period: selectedPeriod.id,
        statementDay,
        includeTransactionIds,
        deferTransactionIds,
        deferToPeriod: nextPeriod?.id ?? selectedPeriod.id,
      },
    })
  }

  function createInstallment(
    providerStatementDay: number,
    p: { transactionId: string; tenorMonths: number; conversionFee: number },
  ) {
    dispatch({ type: 'CREATE_INSTALLMENT', payload: { ...p, statementDay: providerStatementDay } })
  }

  return {
    cycleDay: state.calendarRules.statementClosingDay,
    periods,
    currentPeriod,
    selectedPeriod,
    selectedPeriodId,
    setSelectedPeriodId,
    nextPeriod,
    addSpendingPeriod,
    updateSpendingPeriod,
    removeSpendingPeriod,
    directTxs,
    incomeTxs,
    existingClose,
    confirmedForPeriod,
    bnplByProvider,
    totalDirect,
    totalIncome,
    totalBnpl,
    net,
    closeMonth,
    confirmBnplWithDeferrals,
    createInstallment,
  }
}
