/**
 * Ngày tham chiếu cho “hôm nay” trong app.
 * - Nếu `iso` là `yyyy-mm-dd` hợp lệ (từ Cấu hình) thì dùng để demo / soát lỗi.
 * - Ngược lại dùng ngày hệ thống.
 */
export function resolveReferenceDate(iso: string | null | undefined): string {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return new Date().toISOString().slice(0, 10)
}
