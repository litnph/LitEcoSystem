import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import {
  DEFAULT_CALENDAR_RULES,
  DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
  DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  DEFAULT_PAYMENT_SOURCE_MODES,
  initialPfmState,
} from './store/pfmState'
import { buildSeedState } from './store/seedData'
import { type PfmAction, pfmReducer } from './store/pfmReducer'
import { loadFromLocalStorage, saveToLocalStorage } from '../shared/lib/localStorage'

type PfmContextValue = {
  state: ReturnType<typeof buildSeedState>
  dispatch: React.Dispatch<PfmAction>
}

const PfmContext = createContext<PfmContextValue | null>(null)

function initState() {
  const saved = loadFromLocalStorage()
  if (saved) {
    // Merge initialPfmState first so any newly added fields always have defaults,
    // then overwrite with saved user data (migration guard for schema changes).
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
    // User-requested reset: clear all existing spending periods and net worth.
    merged.spendingPeriods = []
    merged.netWorth = 0
    return merged
  }
  return buildSeedState()
}

export function PfmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pfmReducer, undefined, initState)

  useEffect(() => {
    saveToLocalStorage(state)
  }, [state])

  return (
    <PfmContext.Provider value={{ state, dispatch }}>
      {children}
    </PfmContext.Provider>
  )
}

export function usePfm() {
  const ctx = useContext(PfmContext)
  if (!ctx) throw new Error('usePfm must be used within PfmProvider')
  return { state: ctx.state, dispatch: ctx.dispatch }
}

export function usePfmState() {
  return usePfm().state
}

export function usePfmDispatch() {
  return usePfm().dispatch
}

export type { PfmAction }
