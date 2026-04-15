import type { CalendarRules, PfmState } from './pfmState'
import type {
  BnplProvider,
  MonthlyClose,
  SpendingPeriod,
  Transaction,
} from '../../entities'
import {
  computeMonthlyPrincipal,
  dueDateLabelForPeriod,
  getEffectiveBnplStatementPeriod,
  getStatementPeriodForDate,
  installmentChargeForPeriod,
  isBnplExpense,
  nextPeriod,
  totalInstallmentChargesForPeriod,
  type InstallmentPlan,
} from '../../entities'
import { resolveReferenceDate } from '../../shared/config/referenceDate'

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export type MasterListKey = 'categories' | 'paymentSources' | 'paymentChannels'

function upsertBnplProviderBySource(
  providers: BnplProvider[],
  sourceName: string,
  statementDay: number,
): BnplProvider[] {
  const idx = providers.findIndex((p) => p.name === sourceName)
  if (idx < 0) {
    return [...providers, { id: newId('bnpl'), name: sourceName, statementDay }]
  }
  return providers.map((p, i) => (i === idx ? { ...p, statementDay } : p))
}

export type PfmAction =
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> & { id?: string } }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: { id: string } }
  | { type: 'TOGGLE_STATEMENT_LINE'; payload: { transactionId: string } }
  | { type: 'SET_STATEMENT_SELECTION'; payload: Record<string, boolean> }
  | {
      type: 'CONFIRM_STATEMENT'
      payload: {
        providerId: string
        period: string
        statementDay: number
        /** Nếu có: chỉ các id này được chốt (bỏ qua statementSelectedIds) */
        transactionIds?: string[]
      }
    }
  | {
      type: 'CONFIRM_BNPL_STATEMENT_WITH_DEFERRALS'
      payload: {
        providerId: string
        period: string
        statementDay: number
        includeTransactionIds: string[]
        /** Giao dịch bỏ khỏi kỳ này → hoãn sang kỳ sao kê tiếp theo */
        deferTransactionIds: string[]
        deferToPeriod: string
      }
    }
  | { type: 'UNCONFIRM_STATEMENT'; payload: { statementId: string } }
  | { type: 'PAY_CONFIRMED_STATEMENT'; payload: { statementId: string } }
  | {
      type: 'CREATE_INSTALLMENT'
      payload: {
        transactionId: string
        tenorMonths: number
        conversionFee: number
        statementDay: number
      }
    }
  | { type: 'SET_ACTIVE_BNPL_PROVIDER'; payload: string }
  | {
      type: 'ADD_DEBT'
      payload: { title: string; lender: string; principal: number; dueDate: string }
    }
  | { type: 'ADD_DEBT_PAYMENT'; payload: { debtId: string; amount: number } }
  | { type: 'SET_NET_WORTH'; payload: number }
  // Master data
  | { type: 'ADD_MASTER_ITEM'; payload: { list: MasterListKey; value: string } }
  | { type: 'REMOVE_MASTER_ITEM'; payload: { list: MasterListKey; value: string } }
  | { type: 'RENAME_MASTER_ITEM'; payload: { list: MasterListKey; old: string; next: string } }
  | {
      type: 'SET_PAYMENT_SOURCE_MODE'
      payload: { source: string; mode: 'direct' | 'bnpl' }
    }
  | { type: 'SET_PAYMENT_SOURCE_STATEMENT_DAY'; payload: { source: string; statementDay: number | null } }
  | { type: 'SET_PAYMENT_SOURCE_DUE_DAY'; payload: { source: string; dueDay: number | null } }
  | { type: 'SET_CALENDAR_RULES'; payload: CalendarRules }
  | { type: 'ADD_BNPL_PROVIDER'; payload: { name: string; statementDay: number } }
  | { type: 'REMOVE_BNPL_PROVIDER'; payload: { id: string } }
  | { type: 'UPDATE_BNPL_PROVIDER'; payload: BnplProvider }
  | {
      type: 'ADD_SPENDING_PERIOD'
      payload: { id: string; name: string; startDate: string; endDate: string }
    }
  | {
      type: 'UPDATE_SPENDING_PERIOD'
      payload: { id: string; name: string; startDate: string; endDate: string }
    }
  | { type: 'REMOVE_SPENDING_PERIOD'; payload: { id: string } }
  | { type: 'CLEAR_CYCLE_DATA' }
  | {
      type: 'CLOSE_MONTHLY_PERIOD'
      payload: {
        period: string
        directTransactionIds: string[]
        incomeTransactionIds: string[]
        confirmedStatementIds: string[]
        totalDirect: number
        totalIncome: number
        totalBnpl: number
        net: number
      }
    }

/** Adjust net worth for a transaction being added or removed */
function deltaNetWorth(tx: Transaction, sign: 1 | -1): number {
  if (tx.type === 'income') return sign * tx.amount
  if (tx.paymentMode === 'direct') return -sign * tx.amount
  return 0
}

export function pfmReducer(state: PfmState, action: PfmAction): PfmState {
  switch (action.type) {

    case 'ADD_TRANSACTION': {
      const id = action.payload.id ?? newId('tx')
      const tx: Transaction = { ...action.payload, id }
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        netWorth: state.netWorth + deltaNetWorth(tx, 1),
      }
    }

    case 'UPDATE_TRANSACTION': {
      const next = action.payload
      const prev = state.transactions.find((t) => t.id === next.id)
      if (!prev) return state
      const netWorth =
        state.netWorth + deltaNetWorth(prev, -1) + deltaNetWorth(next, 1)
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === next.id ? next : t)),
        netWorth,
      }
    }

    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.payload.id)
      if (!tx) return state
      const sel = { ...state.statementSelectedIds }
      delete sel[tx.id]
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload.id),
        netWorth: state.netWorth + deltaNetWorth(tx, -1),
        statementSelectedIds: sel,
      }
    }

    case 'TOGGLE_STATEMENT_LINE': {
      const { transactionId } = action.payload
      const cur = state.statementSelectedIds[transactionId] ?? false
      return {
        ...state,
        statementSelectedIds: { ...state.statementSelectedIds, [transactionId]: !cur },
      }
    }

    case 'SET_STATEMENT_SELECTION':
      return { ...state, statementSelectedIds: action.payload }

    case 'SET_ACTIVE_BNPL_PROVIDER':
      return { ...state, activeBnplProviderId: action.payload }

    case 'CREATE_INSTALLMENT': {
      const { transactionId, tenorMonths, conversionFee, statementDay } = action.payload
      const tx = state.transactions.find((t) => t.id === transactionId)
      if (!tx || !isBnplExpense(tx) || tx.installmentConverted) return state
      const providerId = tx.bnplProviderId
      if (!providerId) return state

      const firstBillingPeriod = nextPeriod(
        getEffectiveBnplStatementPeriod(tx, statementDay),
      )
      const principal = tx.amount
      const plan: InstallmentPlan = {
        id: newId('plan'),
        sourceTransactionId: transactionId,
        providerId,
        principal,
        tenorMonths,
        conversionFee,
        monthlyPrincipal: computeMonthlyPrincipal(principal, tenorMonths),
        firstBillingPeriod,
        paidMonths: 0,
        status: 'active',
      }

      const sel = { ...state.statementSelectedIds }
      delete sel[transactionId]

      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === transactionId
            ? { ...t, installmentConverted: true, installmentPlanId: plan.id }
            : t,
        ),
        installmentPlans: [...state.installmentPlans, plan],
        statementSelectedIds: sel,
      }
    }

    case 'CONFIRM_BNPL_STATEMENT_WITH_DEFERRALS': {
      const {
        providerId,
        period,
        statementDay,
        includeTransactionIds,
        deferTransactionIds,
        deferToPeriod,
      } = action.payload
      const provider = state.bnplProviders.find((p) => p.id === providerId)
      if (!provider) return state

      const dup = state.confirmedStatements.some(
        (s) => s.providerId === providerId && s.period === period,
      )
      if (dup) return state

      const includeSet = new Set(includeTransactionIds)
      const deferFiltered = deferTransactionIds.filter((id) => !includeSet.has(id))

      let txs = state.transactions.map((t) => {
        if (!deferFiltered.includes(t.id)) return t
        if (t.bnplProviderId !== providerId || !isBnplExpense(t)) return t
        if (t.settledInStatementPeriod || t.installmentConverted) return t
        if (getEffectiveBnplStatementPeriod(t, statementDay) !== period) return t
        return { ...t, bnplDeferredToPeriod: deferToPeriod }
      })

      const selectedTx = txs.filter(
        (t) =>
          includeSet.has(t.id) &&
          t.bnplProviderId === providerId &&
          isBnplExpense(t) &&
          !t.installmentConverted &&
          !t.settledInStatementPeriod,
      )

      const subtotal = selectedTx.reduce((s, t) => s + t.amount, 0)
      const inst = totalInstallmentChargesForPeriod(
        state.installmentPlans,
        providerId,
        period,
      )
      const total = subtotal + inst
      if (total <= 0 && selectedTx.length === 0 && inst <= 0) return state

      const clearedSel = { ...state.statementSelectedIds }
      selectedTx.forEach((t) => {
        delete clearedSel[t.id]
      })

      txs = txs.map((t) =>
        selectedTx.some((s) => s.id === t.id)
          ? {
              ...t,
              settledInStatementPeriod: period,
              bnplDeferredToPeriod: undefined,
              manuallyIncludedInStatementPeriod:
                getEffectiveBnplStatementPeriod(t, statementDay) !== period
                  ? period
                  : undefined,
            }
          : t,
      )

      return {
        ...state,
        transactions: txs,
        confirmedStatements: [
          {
            id: newId('cs'),
            providerId,
            providerName: provider.name,
            period,
            total,
            dueDateLabel: dueDateLabelForPeriod(
              period,
              state.paymentSourceDueDays[provider.name] ?? state.calendarRules.paymentDueDay,
            ),
            status: 'unpaid',
          },
          ...state.confirmedStatements,
        ],
        statementSelectedIds: clearedSel,
      }
    }

    case 'CONFIRM_STATEMENT': {
      const { providerId, period, statementDay, transactionIds: explicitIds } =
        action.payload
      const provider = state.bnplProviders.find((p) => p.id === providerId)
      if (!provider) return state

      if (
        state.confirmedStatements.some(
          (s) => s.providerId === providerId && s.period === period,
        )
      ) {
        return state
      }

      const selectedIds =
        explicitIds && explicitIds.length > 0
          ? explicitIds
          : Object.entries(state.statementSelectedIds)
              .filter(([, v]) => v)
              .map(([k]) => k)

      const selectedTx = state.transactions.filter(
        (t) =>
          selectedIds.includes(t.id) &&
          t.bnplProviderId === providerId &&
          isBnplExpense(t) &&
          !t.installmentConverted &&
          getEffectiveBnplStatementPeriod(t, statementDay) === period &&
          !t.settledInStatementPeriod,
      )

      const subtotal = selectedTx.reduce((s, t) => s + t.amount, 0)
      const inst = totalInstallmentChargesForPeriod(
        state.installmentPlans,
        providerId,
        period,
      )
      const total = subtotal + inst
      if (total <= 0 && selectedTx.length === 0 && inst <= 0) return state

      const clearedSel = { ...state.statementSelectedIds }
      selectedTx.forEach((t) => { delete clearedSel[t.id] })

      return {
        ...state,
        transactions: state.transactions.map((t) =>
          selectedTx.some((s) => s.id === t.id)
            ? {
                ...t,
                settledInStatementPeriod: period,
                bnplDeferredToPeriod: undefined,
                manuallyIncludedInStatementPeriod:
                  getEffectiveBnplStatementPeriod(t, statementDay) !== period
                    ? period
                    : undefined,
              }
            : t,
        ),
        confirmedStatements: [
          {
            id: newId('cs'),
            providerId,
            providerName: provider.name,
            period,
            total,
            dueDateLabel: dueDateLabelForPeriod(
              period,
              state.paymentSourceDueDays[provider.name] ?? state.calendarRules.paymentDueDay,
            ),
            status: 'unpaid',
          },
          ...state.confirmedStatements,
        ],
        statementSelectedIds: clearedSel,
      }
    }

    case 'PAY_CONFIRMED_STATEMENT': {
      const stmt = state.confirmedStatements.find((s) => s.id === action.payload.statementId)
      if (!stmt || stmt.status === 'paid') return state

      const updatedPlans = state.installmentPlans.map((p) => {
        if (p.providerId !== stmt.providerId) return p
        const charge = installmentChargeForPeriod(p, stmt.period)
        if (charge <= 0) return p
        const paidMonths = p.paidMonths + 1
        const completed = paidMonths >= p.tenorMonths
        return {
          ...p,
          paidMonths,
          status: completed ? ('completed' as const) : ('active' as const),
        }
      })

      return {
        ...state,
        netWorth: state.netWorth - stmt.total,
        confirmedStatements: state.confirmedStatements.map((s) =>
          s.id === stmt.id ? { ...s, status: 'paid' as const } : s,
        ),
        installmentPlans: updatedPlans,
      }
    }

    case 'UNCONFIRM_STATEMENT': {
      const stmt = state.confirmedStatements.find((s) => s.id === action.payload.statementId)
      if (!stmt) return state
      if (stmt.status === 'paid') return state
      if (state.monthlyCloses.some((close) => close.confirmedStatementIds.includes(stmt.id))) {
        return state
      }

      return {
        ...state,
        confirmedStatements: state.confirmedStatements.filter((s) => s.id !== stmt.id),
        transactions: state.transactions.map((t) => {
          if (
            t.type !== 'expense' ||
            t.paymentMode !== 'bnpl' ||
            t.bnplProviderId !== stmt.providerId ||
            t.settledInStatementPeriod !== stmt.period
          ) {
            return t
          }
          return {
            ...t,
            settledInStatementPeriod: undefined,
            manuallyIncludedInStatementPeriod: undefined,
          }
        }),
      }
    }

    case 'ADD_DEBT': {
      const d = action.payload
      return {
        ...state,
        debts: [
          ...state.debts,
          {
            id: newId('debt'),
            title: d.title,
            lender: d.lender,
            principal: d.principal,
            paidAmount: 0,
            dueDate: d.dueDate,
            status: 'active' as const,
          },
        ],
      }
    }

    case 'ADD_DEBT_PAYMENT': {
      const { debtId, amount } = action.payload
      return {
        ...state,
        netWorth: state.netWorth - amount,
        debts: state.debts.map((d) => {
          if (d.id !== debtId) return d
          const paidAmount = d.paidAmount + amount
          return {
            ...d,
            paidAmount,
            status: paidAmount >= d.principal ? ('settled' as const) : d.status,
          }
        }),
      }
    }

    case 'SET_NET_WORTH':
      return { ...state, netWorth: action.payload }

    // ── Master data ──────────────────────────────────────────────
    case 'ADD_MASTER_ITEM': {
      const { list, value } = action.payload
      const nextValue = value.trim()
      if (!nextValue || (state[list] as string[]).includes(nextValue)) return state
      const nextState: PfmState = { ...state, [list]: [...(state[list] as string[]), nextValue] }
      if (list === 'paymentSources') {
        nextState.paymentSourceModes = {
          ...state.paymentSourceModes,
          [nextValue]: state.paymentSourceModes[nextValue] ?? 'direct',
        }
        nextState.paymentSourceStatementDays = {
          ...state.paymentSourceStatementDays,
          [nextValue]: state.paymentSourceStatementDays[nextValue] ?? null,
        }
        nextState.paymentSourceDueDays = {
          ...state.paymentSourceDueDays,
          [nextValue]: state.paymentSourceDueDays[nextValue] ?? null,
        }
      }
      return nextState
    }

    case 'REMOVE_MASTER_ITEM': {
      const { list, value } = action.payload
      const nextState: PfmState = {
        ...state,
        [list]: (state[list] as string[]).filter((v) => v !== value),
      }
      if (list === 'paymentSources') {
        const modes = { ...state.paymentSourceModes }
        delete modes[value]
        nextState.paymentSourceModes = modes
        const days = { ...state.paymentSourceStatementDays }
        delete days[value]
        nextState.paymentSourceStatementDays = days
        const dueDays = { ...state.paymentSourceDueDays }
        delete dueDays[value]
        nextState.paymentSourceDueDays = dueDays
        nextState.bnplProviders = state.bnplProviders.filter((p) => p.name !== value)
      }
      return nextState
    }

    case 'RENAME_MASTER_ITEM': {
      const { list, old: oldVal, next } = action.payload
      const nextVal = next.trim()
      if (!nextVal || (state[list] as string[]).includes(nextVal)) return state
      const nextState: PfmState = {
        ...state,
        [list]: (state[list] as string[]).map((v) => (v === oldVal ? nextVal : v)),
      }
      if (list === 'paymentSources') {
        const oldMode = state.paymentSourceModes[oldVal] ?? 'direct'
        const modes = { ...state.paymentSourceModes }
        delete modes[oldVal]
        modes[nextVal] = oldMode
        nextState.paymentSourceModes = modes
        const oldDay = state.paymentSourceStatementDays[oldVal] ?? null
        const days = { ...state.paymentSourceStatementDays }
        delete days[oldVal]
        days[nextVal] = oldDay
        nextState.paymentSourceStatementDays = days
        const oldDue = state.paymentSourceDueDays[oldVal] ?? null
        const dueDays = { ...state.paymentSourceDueDays }
        delete dueDays[oldVal]
        dueDays[nextVal] = oldDue
        nextState.paymentSourceDueDays = dueDays
        nextState.bnplProviders = state.bnplProviders.map((p) =>
          p.name === oldVal ? { ...p, name: nextVal } : p,
        )
      }
      return nextState
    }

    case 'SET_PAYMENT_SOURCE_MODE': {
      const { source, mode } = action.payload
      if (!state.paymentSources.includes(source)) return state
      const nextState: PfmState = {
        ...state,
        paymentSourceModes: { ...state.paymentSourceModes, [source]: mode },
      }
      if (mode === 'bnpl') {
        const day =
          state.paymentSourceStatementDays[source] ?? state.calendarRules.statementClosingDay
        nextState.paymentSourceStatementDays = {
          ...state.paymentSourceStatementDays,
          [source]: day,
        }
        nextState.paymentSourceDueDays = {
          ...state.paymentSourceDueDays,
          [source]: state.paymentSourceDueDays[source] ?? state.calendarRules.paymentDueDay,
        }
        nextState.bnplProviders = upsertBnplProviderBySource(state.bnplProviders, source, day)
      } else {
        nextState.paymentSourceStatementDays = {
          ...state.paymentSourceStatementDays,
          [source]: null,
        }
        nextState.paymentSourceDueDays = {
          ...state.paymentSourceDueDays,
          [source]: null,
        }
      }
      return nextState
    }

    case 'SET_PAYMENT_SOURCE_STATEMENT_DAY': {
      const { source, statementDay } = action.payload
      if (!state.paymentSources.includes(source)) return state
      const day =
        statementDay == null
          ? null
          : Math.min(28, Math.max(1, Math.floor(Number(statementDay)) || 1))
      const nextState: PfmState = {
        ...state,
        paymentSourceStatementDays: { ...state.paymentSourceStatementDays, [source]: day },
      }
      if (day && state.paymentSourceModes[source] === 'bnpl') {
        nextState.bnplProviders = upsertBnplProviderBySource(state.bnplProviders, source, day)
      }
      return nextState
    }

    case 'SET_PAYMENT_SOURCE_DUE_DAY': {
      const { source, dueDay } = action.payload
      if (!state.paymentSources.includes(source)) return state
      const day =
        dueDay == null
          ? null
          : Math.min(28, Math.max(1, Math.floor(Number(dueDay)) || 1))
      return {
        ...state,
        paymentSourceDueDays: { ...state.paymentSourceDueDays, [source]: day },
      }
    }

    case 'SET_CALENDAR_RULES': {
      const p = action.payload
      const clamp = (n: number, lo: number, hi: number) =>
        Math.min(hi, Math.max(lo, Math.floor(Number(n)) || lo))
      let salaryFrom = clamp(p.salaryFromDay, 1, 31)
      let salaryTo = clamp(p.salaryToDay, 1, 31)
      if (salaryFrom > salaryTo) [salaryFrom, salaryTo] = [salaryTo, salaryFrom]
      const ref = p.referenceDateIso?.trim() || null
      const refOk = ref && /^\d{4}-\d{2}-\d{2}$/.test(ref) ? ref : null
      return {
        ...state,
        calendarRules: {
          statementClosingDay: clamp(p.statementClosingDay, 1, 28),
          paymentDueDay: clamp(p.paymentDueDay, 1, 28),
          salaryFromDay: salaryFrom,
          salaryToDay: salaryTo,
          referenceDateIso: refOk,
        },
      }
    }

    case 'ADD_BNPL_PROVIDER': {
      const { name, statementDay } = action.payload
      if (!name.trim()) return state
      return {
        ...state,
        bnplProviders: [
          ...state.bnplProviders,
          { id: newId('bnpl'), name: name.trim(), statementDay },
        ],
      }
    }

    case 'REMOVE_BNPL_PROVIDER': {
      const { id } = action.payload
      return {
        ...state,
        bnplProviders: state.bnplProviders.filter((p) => p.id !== id),
      }
    }

    case 'UPDATE_BNPL_PROVIDER': {
      const updated = action.payload
      return {
        ...state,
        bnplProviders: state.bnplProviders.map((p) =>
          p.id === updated.id ? updated : p,
        ),
      }
    }

    case 'ADD_SPENDING_PERIOD': {
      const { id, name, startDate, endDate } = action.payload
      if (!id.trim() || !name.trim() || startDate > endDate) return state
      if (state.spendingPeriods.some((p) => p.id === id)) return state
      const overlap = state.spendingPeriods.some(
        (p) => !(endDate < p.startDate || startDate > p.endDate),
      )
      if (overlap) return state
      const next: SpendingPeriod = { id, name: name.trim(), startDate, endDate }
      return {
        ...state,
        spendingPeriods: [...state.spendingPeriods, next].sort((a, b) =>
          b.startDate.localeCompare(a.startDate),
        ),
      }
    }

    case 'UPDATE_SPENDING_PERIOD': {
      const { id, name, startDate, endDate } = action.payload
      if (!id.trim() || !name.trim() || startDate > endDate) return state
      if (!state.spendingPeriods.some((p) => p.id === id)) return state
      const overlap = state.spendingPeriods.some(
        (p) => p.id !== id && !(endDate < p.startDate || startDate > p.endDate),
      )
      if (overlap) return state
      return {
        ...state,
        spendingPeriods: state.spendingPeriods
          .map((p) => (p.id === id ? { ...p, name: name.trim(), startDate, endDate } : p))
          .sort((a, b) => b.startDate.localeCompare(a.startDate)),
      }
    }

    case 'REMOVE_SPENDING_PERIOD': {
      const { id } = action.payload
      if (!state.spendingPeriods.some((p) => p.id === id)) return state
      return {
        ...state,
        spendingPeriods: state.spendingPeriods.filter((p) => p.id !== id),
      }
    }

    case 'CLEAR_CYCLE_DATA': {
      return {
        ...state,
        spendingPeriods: [],
        monthlyCloses: [],
        confirmedStatements: [],
        transactions: state.transactions.map((t) => ({
          ...t,
          settledInStatementPeriod: undefined,
          bnplDeferredToPeriod: undefined,
          manuallyIncludedInStatementPeriod: undefined,
        })),
      }
    }

    case 'CLOSE_MONTHLY_PERIOD': {
      const p = action.payload
      if (state.monthlyCloses.some((c) => c.period === p.period)) return state
      const close: MonthlyClose = {
        id: newId('mc'),
        period: p.period,
        closedAt: new Date().toISOString(),
        directTransactionIds: p.directTransactionIds,
        incomeTransactionIds: p.incomeTransactionIds,
        confirmedStatementIds: p.confirmedStatementIds,
        totalDirect: p.totalDirect,
        totalIncome: p.totalIncome,
        totalBnpl: p.totalBnpl,
        net: p.net,
      }
      return {
        ...state,
        monthlyCloses: [close, ...state.monthlyCloses],
      }
    }

    default:
      return state
  }
}

export function getOpenPeriodForProvider(
  state: PfmState,
  providerId: string,
): { period: string; statementDay: number } | null {
  const p = state.bnplProviders.find((x) => x.id === providerId)
  if (!p) return null
  const ref = resolveReferenceDate(state.calendarRules.referenceDateIso)
  const period = getStatementPeriodForDate(ref, p.statementDay)
  return { period, statementDay: p.statementDay }
}
