import type {
  BnplProvider,
  ConfirmedStatement,
  DebtRecord,
  InstallmentPlan,
  MonthlyClose,
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
  monthlyCloses: MonthlyClose[]
  spendingPeriods: SpendingPeriod[]
  netWorth: number
  activeBnplProviderId: string
  statementSelectedIds: Record<string, boolean>
  calendarRules: CalendarRules

  /** Master data — user-editable */
  categories: string[]
  paymentSources: string[]
  paymentSourceModes: Record<string, 'direct' | 'bnpl'>
  paymentSourceStatementDays: Record<string, number | null>
  paymentSourceDueDays: Record<string, number | null>
  paymentChannels: string[]
}

export const DEFAULT_CATEGORIES = [
  'Ăn uống/Đi chợ',
  'Ăn uống/Ăn ngoài',
  'Di chuyển/Xăng xe',
  'Di chuyển/Gọi xe',
  'Nhà ở/Điện nước',
  'Nhà ở/Sửa chữa',
  'Cá nhân/Sức khỏe',
  'Cá nhân/Giải trí',
  'Tài chính/Trả nợ',
  'Tài chính/Tiết kiệm',
  'Khác/Khác',
]
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
  bnplProviders: [],
  confirmedStatements: [],
  installmentPlans: [],
  debts: [],
  monthlyCloses: [],
  spendingPeriods: [],
  netWorth: 0,
  activeBnplProviderId: '',
  statementSelectedIds: {},
  calendarRules: DEFAULT_CALENDAR_RULES,
  categories: DEFAULT_CATEGORIES,
  paymentSources: DEFAULT_PAYMENT_SOURCES,
  paymentSourceModes: DEFAULT_PAYMENT_SOURCE_MODES,
  paymentSourceStatementDays: DEFAULT_PAYMENT_SOURCE_STATEMENT_DAYS,
  paymentSourceDueDays: DEFAULT_PAYMENT_SOURCE_DUE_DAYS,
  paymentChannels: DEFAULT_PAYMENT_CHANNELS,
}
