/** Danh mục cố định — có thể mở rộng */
export const PAYMENT_SOURCES = [
  'Cash',
  'Vietcombank',
  'Techcombank',
  'Vietcombank Visa',
  'Techcombank Visa',
  'ShopeePay',
] as const

export const PAYMENT_CHANNELS = [
  'TikTok',
  'Shopee',
  'KinhFood',
  'BHX',
  'Revi',
  'Grab',
  'Be',
  'Khác',
] as const

export const EXPENSE_CATEGORIES = [
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
] as const

export type PaymentSource = (typeof PAYMENT_SOURCES)[number]
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number]
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
