import type { PfmState } from './pfmState'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_CHANNELS,
  DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
  DEFAULT_PAYMENT_SOURCE_MODES,
  DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  DEFAULT_PAYMENT_SOURCES,
} from './pfmState'
import { computeMonthlyPrincipal, dueDateLabelForPeriod, type Transaction } from '../../entities'
import { DEFAULT_CALENDAR_RULES } from './pfmState'

const spId = 'bnpl-shopeepay'
const tcbVisaId = 'bnpl-techcom-visa'
const vcbVisaId = 'bnpl-vietcom-visa'

function t(partial: Omit<Transaction, 'id'> & { id: string }): Transaction {
  return { ...partial }
}

export function buildSeedState(): PfmState {
  const principal = 2_000_000
  const tenor = 6
  const convFee = 50_000
  const monthly = computeMonthlyPrincipal(principal, tenor)

  const transactions: Transaction[] = [
    t({
      id: 'tx-1',
      type: 'expense',
      amount: 485_000,
      occurredAt: '2026-04-03',
      merchant: 'Grab',
      channel: 'Grab',
      category: 'Ăn uống/Đi chợ',
      source: 'Cash',
      paymentMode: 'direct',
    }),
    t({
      id: 'tx-2',
      type: 'income',
      amount: 23_500_000,
      occurredAt: '2026-04-05',
      merchant: 'Lương tháng 4',
      channel: 'Khác',
      category: 'Khác/Khác',
      source: 'Techcombank',
      paymentMode: 'direct',
    }),
    t({
      id: 'tx-3',
      type: 'expense',
      amount: 650_000,
      occurredAt: '2026-04-05',
      merchant: 'Shopee',
      channel: 'Shopee',
      category: 'Nhà ở/Sửa chữa',
      source: 'ShopeePay',
      paymentMode: 'bnpl',
      bnplProviderId: spId,
    }),
    t({
      id: 'tx-4',
      type: 'expense',
      amount: 210_000,
      occurredAt: '2026-04-06',
      merchant: 'CGV',
      channel: 'Revi',
      category: 'Cá nhân/Giải trí',
      source: 'Techcombank Visa',
      paymentMode: 'bnpl',
      bnplProviderId: tcbVisaId,
    }),
    t({
      id: 'tx-5',
      type: 'expense',
      amount: 125_000,
      occurredAt: '2026-03-19',
      merchant: 'Circle K',
      channel: 'Khác',
      category: 'Ăn uống/Đi chợ',
      source: 'ShopeePay',
      paymentMode: 'bnpl',
      bnplProviderId: spId,
    }),
    t({
      id: 'tx-6',
      type: 'expense',
      amount: 89_000,
      occurredAt: '2026-03-21',
      merchant: 'Highlands',
      channel: 'Grab',
      category: 'Ăn uống/Ăn ngoài',
      source: 'ShopeePay',
      paymentMode: 'bnpl',
      bnplProviderId: spId,
    }),
    t({
      id: 'tx-seed-plan',
      type: 'expense',
      amount: principal,
      occurredAt: '2026-04-01',
      merchant: 'Điện máy',
      channel: 'Shopee',
      category: 'Nhà ở/Sửa chữa',
      source: 'Vietcombank Visa',
      paymentMode: 'bnpl',
      bnplProviderId: vcbVisaId,
      installmentConverted: true,
      installmentPlanId: 'plan-1',
    }),
  ]

  return {
    transactions,
    bnplProviders: [
      { id: spId, name: 'ShopeePay', statementDay: DEFAULT_CALENDAR_RULES.statementClosingDay },
      { id: tcbVisaId, name: 'Techcombank Visa', statementDay: DEFAULT_CALENDAR_RULES.statementClosingDay },
      { id: vcbVisaId, name: 'Vietcombank Visa', statementDay: DEFAULT_CALENDAR_RULES.statementClosingDay },
    ],
    confirmedStatements: [
      {
        id: 'cs-1',
        providerId: spId,
        providerName: 'ShopeePay',
        period: '2026-03',
        total: 1_345_000,
        dueDateLabel: dueDateLabelForPeriod('2026-03', DEFAULT_CALENDAR_RULES.paymentDueDay),
        status: 'unpaid',
      },
      {
        id: 'cs-2',
        providerId: tcbVisaId,
        providerName: 'Techcombank Visa',
        period: '2026-04',
        total: 2_780_000,
        dueDateLabel: dueDateLabelForPeriod('2026-04', DEFAULT_CALENDAR_RULES.paymentDueDay),
        status: 'unpaid',
      },
    ],
    installmentPlans: [
      {
        id: 'plan-1',
        sourceTransactionId: 'tx-seed-plan',
        providerId: vcbVisaId,
        principal,
        tenorMonths: tenor,
        conversionFee: convFee,
        monthlyPrincipal: monthly,
        firstBillingPeriod: '2026-05',
        paidMonths: 0,
        status: 'active',
      },
    ],
    debts: [
      {
        id: 'debt-1',
        title: 'Vay mượn bạn A',
        lender: 'Bạn A',
        principal: 10_000_000,
        paidAmount: 2_000_000,
        dueDate: '2026-06-30',
        status: 'active',
      },
    ],
    monthlyCloses: [],
    spendingPeriods: [],
    netWorth: 0,
    activeBnplProviderId: spId,
    statementSelectedIds: {},
    categories: DEFAULT_CATEGORIES,
    paymentSources: DEFAULT_PAYMENT_SOURCES,
    paymentSourceModes: DEFAULT_PAYMENT_SOURCE_MODES,
    paymentSourceStatementDays: DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
    paymentSourceDueDays: DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
    paymentChannels: DEFAULT_PAYMENT_CHANNELS,
    calendarRules: DEFAULT_CALENDAR_RULES,
  }
}
