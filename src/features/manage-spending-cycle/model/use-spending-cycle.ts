import { useMemo } from 'react'
import { useTransactionsQuery } from '@/entities/transaction'
import { useSpendingPeriodsQuery, useStatementsQuery, getEffectiveBnplStatementPeriod } from '@/entities/spending-cycle'
import { useInstallmentsQuery } from '@/entities/obligation'
import { useConfigurationQuery } from '@/entities/user'
import { resolveReferenceDate } from '@/shared/config/referenceDate'
import {
  useCreateSpendingPeriod,
  useUpdateSpendingPeriod,
  useDeleteSpendingPeriod,
  useConfirmStatement,
} from './use-cycle-mutations'
import { useCycleUiStore } from './cycle-ui.store'
import type { ConfirmStatementPayload } from './use-cycle-mutations'

function inRange(dateISO: string, from: string, to: string): boolean {
  return dateISO >= from && dateISO <= to
}

function defaultPeriodNameFromEnd(endDate: string): string {
  const [y, m] = endDate.split('-')
  return `Tháng ${Number(m)}/${y}`
}

export function useSpendingCycle() {
  const { data: txData = [] } = useTransactionsQuery()
  const { data: periodsData = [] } = useSpendingPeriodsQuery()
  const { data: statementsData = [] } = useStatementsQuery()
  const { data: installmentsData = [] } = useInstallmentsQuery()
  const { data: config } = useConfigurationQuery()

  const bnplProviders = config?.bnplProviders ?? []
  const calendarRules = config?.calendarRules

  const cycleUi = useCycleUiStore()
  const createPeriod = useCreateSpendingPeriod()
  const updatePeriod = useUpdateSpendingPeriod()
  const deletePeriod = useDeleteSpendingPeriod()
  const confirmStatement = useConfirmStatement()

  const ref = resolveReferenceDate(null)

  const periods = useMemo(
    () => [...periodsData].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periodsData],
  )

  const currentPeriod = useMemo(
    () => periods.find((p) => inRange(ref, p.startDate, p.endDate)) ?? periods[0],
    [periods, ref],
  )

  const selectedPeriodId = cycleUi.selectedPeriodId || currentPeriod?.id || ''
  const setSelectedPeriodId = cycleUi.setSelectedPeriodId

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) ?? currentPeriod ?? null

  const nextPeriod = useMemo(() => {
    if (!selectedPeriod) return null
    const idx = periods.findIndex((p) => p.id === selectedPeriod.id)
    return idx > 0 ? periods[idx - 1] : null
  }, [periods, selectedPeriod])

  const directTxs = useMemo(
    () =>
      selectedPeriod
        ? txData.filter(
            (t) =>
              t.type === 'expense' &&
              t.paymentMode === 'direct' &&
              inRange(t.occurredAt, selectedPeriod.startDate, selectedPeriod.endDate),
          )
        : [],
    [txData, selectedPeriod],
  )

  const incomeTxs = useMemo(
    () =>
      selectedPeriod
        ? txData.filter(
            (t) => t.type === 'income' && inRange(t.occurredAt, selectedPeriod.startDate, selectedPeriod.endDate),
          )
        : [],
    [txData, selectedPeriod],
  )

  const existingClose = cycleUi.hasClose(selectedPeriod?.id ?? '')

  const confirmedForPeriod = useMemo(
    () => (selectedPeriod ? statementsData.filter((s) => s.period === selectedPeriod.id) : []),
    [statementsData, selectedPeriod],
  )

  const bnplByProvider = useMemo(() => {
    if (!selectedPeriod) return []
    return bnplProviders.map((provider) => {
      const txs = txData.filter(
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
      const stmt = statementsData.find((s) => s.providerId === provider.id && s.period === selectedPeriod.id)
      const installmentPlans = installmentsData.filter((pl) => pl.providerId === provider.id)
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
  }, [txData, bnplProviders, statementsData, installmentsData, selectedPeriod])

  const totalDirect = directTxs.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomeTxs.reduce((s, t) => s + t.amount, 0)
  const totalBnpl = confirmedForPeriod.reduce((s, x) => s + x.total, 0)
  const net = totalIncome - totalDirect - totalBnpl

  function closeMonth() {
    if (!selectedPeriod || existingClose) return
    cycleUi.addMonthlyClose({
      id: `close-${selectedPeriod.id}-${Date.now()}`,
      period: selectedPeriod.id,
      closedAt: new Date().toISOString(),
      directTransactionIds: directTxs.map((t) => t.id),
      incomeTransactionIds: incomeTxs.map((t) => t.id),
      confirmedStatementIds: confirmedForPeriod.map((s) => s.id),
      totalDirect,
      totalIncome,
      totalBnpl,
      net,
    })
  }

  async function addSpendingPeriod(input: { id: string; name?: string; startDate: string; endDate: string }) {
    const id = input.id.trim()
    if (!id) return { ok: false as const, error: 'Vui lòng nhập mã kỳ.' }
    if (!input.startDate || !input.endDate) return { ok: false as const, error: 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.' }
    if (input.startDate > input.endDate) return { ok: false as const, error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.' }
    if (periods.some((p) => p.id === id)) return { ok: false as const, error: 'Mã kỳ đã tồn tại, vui lòng dùng mã khác.' }
    const overlap = periods.some((p) => !(input.endDate < p.startDate || input.startDate > p.endDate))
    if (overlap) return { ok: false as const, error: 'Khoảng ngày bị trùng với kỳ đã có. Vui lòng chọn khoảng khác.' }
    const name = input.name?.trim() || defaultPeriodNameFromEnd(input.endDate)
    try {
      await createPeriod.mutateAsync({ name, startDate: input.startDate, endDate: input.endDate })
      setSelectedPeriodId(id)
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : 'Lỗi khi tạo kỳ chi tiêu.' }
    }
  }

  async function updateSpendingPeriod(input: { id: string; name?: string; startDate: string; endDate: string }) {
    const id = input.id.trim()
    if (!id || !periods.some((p) => p.id === id)) return { ok: false as const, error: 'Kỳ chi tiêu không hợp lệ.' }
    if (!input.startDate || !input.endDate) return { ok: false as const, error: 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.' }
    if (input.startDate > input.endDate) return { ok: false as const, error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.' }
    const overlap = periods.some((p) => p.id !== id && !(input.endDate < p.startDate || input.startDate > p.endDate))
    if (overlap) return { ok: false as const, error: 'Khoảng ngày bị trùng với kỳ đã có. Vui lòng chọn khoảng khác.' }
    const name = input.name?.trim() || defaultPeriodNameFromEnd(input.endDate)
    try {
      await updatePeriod.mutateAsync({ id, data: { name, startDate: input.startDate, endDate: input.endDate } })
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : 'Lỗi khi cập nhật kỳ chi tiêu.' }
    }
  }

  async function removeSpendingPeriod(periodId: string) {
    if (!periods.some((p) => p.id === periodId)) return { ok: false as const, error: 'Kỳ chi tiêu không tồn tại.' }
    if (cycleUi.hasClose(periodId)) return { ok: false as const, error: 'Không thể xóa kỳ đã chốt.' }
    if (statementsData.some((x) => x.period === periodId)) return { ok: false as const, error: 'Không thể xóa kỳ đã có sao kê được xác nhận.' }
    try {
      await deletePeriod.mutateAsync(periodId)
      if (selectedPeriodId === periodId) {
        const sorted = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate))
        const idx = sorted.findIndex((p) => p.id === periodId)
        const fallback = sorted[idx + 1]?.id ?? sorted[idx - 1]?.id ?? ''
        setSelectedPeriodId(fallback)
      }
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : 'Lỗi khi xoá kỳ chi tiêu.' }
    }
  }

  async function confirmBnplWithDeferrals(
    providerId: string,
    _statementDay: number,
    includeTransactionIds: string[],
    _deferTransactionIds: string[],
  ) {
    if (!selectedPeriod) return
    const providerName = bnplProviders.find((p) => p.id === providerId)?.name ?? ''
    const includedTotal = txData
      .filter((t) => includeTransactionIds.includes(t.id))
      .reduce((s, t) => s + t.amount, 0)
    const payload: ConfirmStatementPayload = {
      providerId,
      providerName,
      period: selectedPeriod.id,
      total: includedTotal,
      dueDateLabel: '',
    }
    await confirmStatement.mutateAsync(payload)
  }

  return {
    cycleDay: calendarRules?.statementClosingDay ?? 20,
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
  }
}
