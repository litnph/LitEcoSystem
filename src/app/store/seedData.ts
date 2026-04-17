import type { PfmState } from './pfmState'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_KINDS,
  DEFAULT_PAYMENT_CHANNELS,
  DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
  DEFAULT_PAYMENT_SOURCE_INSTALLMENT_LIMITS,
  DEFAULT_PAYMENT_SOURCE_MODES,
  DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  DEFAULT_PAYMENT_SOURCES,
} from './pfmState'
import type { Transaction } from '../../entities'
import { DEFAULT_CALENDAR_RULES } from './pfmState'

export function buildSeedState(): PfmState {
  const transactions: Transaction[] = []

  return {
    transactions,
    bnplProviders: [],
    confirmedStatements: [],
    installmentPlans: [],
    debts: [],
    receivables: [],
    monthlyCloses: [],
    spendingPeriods: [],
    netWorth: 0,
    activeBnplProviderId: '',
    statementSelectedIds: {},
    categories: DEFAULT_CATEGORIES,
    categoryKinds: DEFAULT_CATEGORY_KINDS,
    paymentSources: DEFAULT_PAYMENT_SOURCES,
    paymentSourceModes: DEFAULT_PAYMENT_SOURCE_MODES,
    paymentSourceStatementDays: DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
    paymentSourceDueDays: DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
    paymentSourceInstallmentLimits: DEFAULT_PAYMENT_SOURCE_INSTALLMENT_LIMITS,
    paymentChannels: DEFAULT_PAYMENT_CHANNELS,
    installmentMinAmount: 0,
    calendarRules: DEFAULT_CALENDAR_RULES,
  }
}
