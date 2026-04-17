const numberFormat = new Intl.NumberFormat('vi-VN')

export function currencyVnd(value: number): string {
  return `${numberFormat.format(value)} đ`
}

export function formatISODateToVi(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}
