import type {
  BnplProvider,
  ConfirmedStatement,
  DebtRecord,
  InstallmentPlan,
  MonthlyClose,
  ReceivableRecord,
  SpendingPeriod,
  Transaction,
} from '../../entities'

/** Lịch theo quy tắc cá nhân (sao kê thẻ, hạn trả, cửa sổ lương). */
export type CalendarRules = {
  /** Ngày chốt sao kê hàng tháng (vd 20 → 21 tháng trước → 20 tháng này) */
  statementClosingDay: number
  /** Ngày hạn thanh toán thẻ mỗi tháng (vd 5, tháng sau kỳ sao kê) */
  paymentDueDay: number
  salaryFromDay: number
  salaryToDay: number
  /** yyyy-mm-dd để cố định “hôm nay” khi demo; null = dùng ngày máy */
  referenceDateIso: string | null
}

export const DEFAULT_CALENDAR_RULES: CalendarRules = {
  statementClosingDay: 20,
  paymentDueDay: 5,
  salaryFromDay: 25,
  salaryToDay: 30,
  referenceDateIso: null,
}

export type PfmState = {
  transactions: Transaction[]
  bnplProviders: BnplProvider[]
  confirmedStatements: ConfirmedStatement[]
  installmentPlans: InstallmentPlan[]
  debts: DebtRecord[]
  receivables: ReceivableRecord[]
  monthlyCloses: MonthlyClose[]
  spendingPeriods: SpendingPeriod[]
  netWorth: number
  activeBnplProviderId: string
  statementSelectedIds: Record<string, boolean>
  calendarRules: CalendarRules

  /** Master data — user-editable */
  categories: string[]
  categoryKinds: Record<string, 'income' | 'expense'>
  paymentSources: string[]
  paymentSourceModes: Record<string, 'direct' | 'bnpl'>
  paymentSourceStatementDays: Record<string, number | null>
  paymentSourceDueDays: Record<string, number | null>
  /** Hạn mức (VND) tối đa chấp nhận chuyển đổi trả góp; null = không giới hạn */
  paymentSourceInstallmentLimits: Record<string, number | null>
  paymentChannels: string[]
  /** Số tiền tối thiểu (VND) để được hiển thị nút chuyển trả góp; 0 = không giới hạn */
  installmentMinAmount: number
}

export const DEFAULT_CATEGORIES: string[] = []
export const DEFAULT_CATEGORY_KINDS: Record<string, 'income' | 'expense'> = {}
export const DEFAULT_PAYMENT_SOURCES = [
  'Cash',
  'Vietcombank',
  'Techcombank',
  'Vietcombank Visa',
  'Techcombank Visa',
  'ShopeePay',
]
export const DEFAULT_PAYMENT_SOURCE_MODES: Record<string, 'direct' | 'bnpl'> = {
  Cash: 'direct',
  Vietcombank: 'direct',
  Techcombank: 'direct',
  'Vietcombank Visa': 'bnpl',
  'Techcombank Visa': 'bnpl',
  ShopeePay: 'bnpl',
}
export const DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS: Record<string, number | null> = {
  Cash: null,
  Vietcombank: null,
  Techcombank: null,
  'Vietcombank Visa': 20,
  'Techcombank Visa': 20,
  ShopeePay: 20,
}
export const DEFAULT_PAYMENT_SOURCE_DUE_DAYS: Record<string, number | null> = {
  Cash: null,
  Vietcombank: null,
  Techcombank: null,
  'Vietcombank Visa': 5,
  'Techcombank Visa': 5,
  ShopeePay: 5,
}
export const DEFAULT_PAYMENT_SOURCE_INSTALLMENT_LIMITS: Record<string, number | null> = {
  Cash: null,
  Vietcombank: null,
  Techcombank: null,
  'Vietcombank Visa': null,
  'Techcombank Visa': null,
  ShopeePay: null,
}
export function buildBnplProvidersFromConfig(
  sources: string[],
  modes: Record<string, 'direct' | 'bnpl'>,
  statementDays: Record<string, number | null>,
) {
  return sources
    .filter((source) => modes[source] === 'bnpl')
    .map((source) => ({
      id: `bnpl-${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: source,
      statementDay: statementDays[source] ?? DEFAULT_CALENDAR_RULES.statementClosingDay,
    }))
}
export const DEFAULT_PAYMENT_CHANNELS = [
  'TikTok',
  'Shopee',
  'KinhFood',
  'BHX',
  'Revi',
  'Grab',
  'Be',
  'Khác',
]

export const initialPfmState: PfmState = {
  transactions: [],
  bnplProviders: buildBnplProvidersFromConfig(
    DEFAULT_PAYMENT_SOURCES,
    DEFAULT_PAYMENT_SOURCE_MODES,
    DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  ),
  confirmedStatements: [],
  installmentPlans: [],
  debts: [],
  receivables: [],
  monthlyCloses: [],
  spendingPeriods: [],
  netWorth: 0,
  activeBnplProviderId: '',
  statementSelectedIds: {},
  calendarRules: DEFAULT_CALENDAR_RULES,
  categories: DEFAULT_CATEGORIES,
  categoryKinds: DEFAULT_CATEGORY_KINDS,
  paymentSources: DEFAULT_PAYMENT_SOURCES,
  paymentSourceModes: DEFAULT_PAYMENT_SOURCE_MODES,
  paymentSourceStatementDays: DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  paymentSourceDueDays: DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
  paymentSourceInstallmentLimits: DEFAULT_PAYMENT_SOURCE_INSTALLMENT_LIMITS,
  paymentChannels: DEFAULT_PAYMENT_CHANNELS,
  installmentMinAmount: 0,
}
