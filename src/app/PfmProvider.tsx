import { createContext, useCallback, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import {
  buildBnplProvidersFromConfig,
  DEFAULT_CALENDAR_RULES,
  DEFAULT_CATEGORY_KINDS,
  DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
  DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  DEFAULT_PAYMENT_SOURCE_MODES,
  initialPfmState,
} from './store/pfmState'
import { buildSeedState } from './store/seedData'
import { type PfmAction, pfmReducer } from './store/pfmReducer'
import { loadFromLocalStorage, saveToLocalStorage } from '../shared/lib/localStorage'
import { loadSession } from './auth/authStorage'
import {
  getTransactionsApi,
  getSpendingPeriodsApi,
  getConfirmedStatementsApi,
  getInstallmentsApi,
  getDebtsApi,
  getReceivablesApi,
  getUserConfigurationApi,
} from './store/apiLoader'

type PfmContextValue = {
  state: ReturnType<typeof buildSeedState>
  dispatch: React.Dispatch<PfmAction>
  apiLoading: boolean
  apiError: string | null
  reloadApiData: () => Promise<void>
}

const PfmContext = createContext<PfmContextValue | null>(null)

function initState() {
  const saved = loadFromLocalStorage()
  if (saved) {
    const merged = { ...initialPfmState, ...saved }
    merged.paymentSourceModes = { ...DEFAULT_PAYMENT_SOURCE_MODES, ...(saved.paymentSourceModes ?? {}) }
    merged.paymentSourceStatementDays = {
      ...DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
      ...(saved.paymentSourceStatementDays ?? {}),
    }
    merged.paymentSourceDueDays = {
      ...DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
      ...(saved.paymentSourceDueDays ?? {}),
    }
    merged.calendarRules = { ...DEFAULT_CALENDAR_RULES, ...(saved.calendarRules ?? {}) }
    merged.categoryKinds = { ...DEFAULT_CATEGORY_KINDS, ...(saved.categoryKinds ?? {}) }
    for (const c of merged.categories) {
      merged.categoryKinds[c] = merged.categoryKinds[c] ?? 'expense'
    }
    // Finance data will be loaded from API
    merged.transactions = []
    merged.spendingPeriods = []
    merged.debts = []
    merged.receivables = []
    merged.installmentPlans = []
    merged.confirmedStatements = []
    merged.monthlyCloses = []
    merged.statementSelectedIds = {}
    merged.activeBnplProviderId = ''
    merged.netWorth = 0
    // Master data will also be loaded from API (reset here, loaded below)
    merged.categories = []
    merged.categoryKinds = {}
    merged.bnplProviders = buildBnplProvidersFromConfig(
      merged.paymentSources,
      merged.paymentSourceModes,
      merged.paymentSourceStatementDays,
    )
    return merged
  }
  return buildSeedState()
}

export function PfmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pfmReducer, undefined, initState)
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    saveToLocalStorage(state)
  }, [state])

  const reloadApiData = useCallback(async () => {
    const session = loadSession()
    if (!session?.accessToken) {
      setApiLoading(false)
      return
    }
    setApiLoading(true)
    setApiError(null)
    try {
      const [transactions, spendingPeriods, confirmedStatements, installmentPlans, debts, receivables, config] =
        await Promise.all([
          getTransactionsApi().catch(() => undefined),
          getSpendingPeriodsApi().catch(() => undefined),
          getConfirmedStatementsApi().catch(() => undefined),
          getInstallmentsApi().catch(() => undefined),
          getDebtsApi().catch(() => undefined),
          getReceivablesApi().catch(() => undefined),
          getUserConfigurationApi().catch(() => undefined),
        ])

      const md = config?.masterData
      const cal = config?.calendarRules

      dispatch({
        type: 'LOAD_API_DATA',
        payload: {
          ...(transactions && { transactions }),
          ...(spendingPeriods && { spendingPeriods }),
          ...(confirmedStatements && { confirmedStatements }),
          ...(installmentPlans && { installmentPlans }),
          ...(debts && { debts }),
          ...(receivables && { receivables }),
          ...(md && {
            categories: md.categories,
            categoryKinds: md.categoryKinds as Record<string, 'income' | 'expense'>,
            paymentSources: md.paymentSources,
            paymentSourceModes: md.paymentSourceModes as Record<string, 'direct' | 'bnpl'>,
            paymentSourceStatementDays: Object.fromEntries(
              Object.entries(md.paymentSourceStatementDays).map(([k, v]) => [k, v ?? null]),
            ),
            paymentSourceDueDays: Object.fromEntries(
              Object.entries(md.paymentSourceDueDays).map(([k, v]) => [k, v ?? null]),
            ),
            paymentChannels: md.paymentChannels,
          }),
          ...(cal && {
            calendarRules: {
              statementClosingDay: cal.statementClosingDay,
              paymentDueDay: cal.paymentDueDay,
              salaryFromDay: cal.salaryFromDay,
              salaryToDay: cal.salaryToDay,
              referenceDateIso: null,
            },
            installmentMinAmount: cal.installmentMinAmount,
          }),
        },
      })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Không thể tải dữ liệu từ server.')
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadApiData()
  }, [reloadApiData])

  return (
    <PfmContext.Provider value={{ state, dispatch, apiLoading, apiError, reloadApiData }}>
      {children}
    </PfmContext.Provider>
  )
}

export function usePfm() {
  const ctx = useContext(PfmContext)
  if (!ctx) throw new Error('usePfm must be used within PfmProvider')
  return { state: ctx.state, dispatch: ctx.dispatch, apiLoading: ctx.apiLoading, apiError: ctx.apiError, reloadApiData: ctx.reloadApiData }
}

export function usePfmState() {
  return usePfm().state
}

export function usePfmDispatch() {
  return usePfm().dispatch
}

export type { PfmAction }
