import { useStatementsQuery } from '@/entities/spending-cycle'
import { usePaymentModal } from '@/features/pay-statement'
import { currencyVnd } from '@/shared/lib/format'

export function PaymentsBoard() {
  const { data: statements = [] } = useStatementsQuery()
  const modal = usePaymentModal()

  const paying = modal.selectedStatement
  const unpaid = statements.filter((s) => s.status === 'unpaid')
  const paid = statements.filter((s) => s.status === 'paid')

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-metric bg-gradient-to-br from-red-500 to-red-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-200">Cần thanh toán</p>
          <p className="mt-2 text-2xl font-bold">{currencyVnd(unpaid.reduce((s, x) => s + x.total, 0))}</p>
          <p className="mt-1 text-xs text-red-300">{unpaid.length} sao kê đang chờ</p>
        </div>
        <div className="card-metric bg-gradient-to-br from-emerald-500 to-emerald-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Đã thanh toán</p>
          <p className="mt-2 text-2xl font-bold">{currencyVnd(paid.reduce((s, x) => s + x.total, 0))}</p>
          <p className="mt-1 text-xs text-emerald-300">{paid.length} sao kê hoàn tất</p>
        </div>
        <div className="card-metric bg-gradient-to-br from-[#8B6F4E] to-[#4E3420] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D9CCB8]">Tổng sao kê</p>
          <p className="mt-2 text-2xl font-bold">{currencyVnd(statements.reduce((s, x) => s + x.total, 0))}</p>
          <p className="mt-1 text-xs text-[#C4B5A5]">{statements.length} sao kê</p>
        </div>
      </div>

      {unpaid.length === 0 ? (
        <div className="card flex min-h-40 flex-col items-center justify-center gap-3 text-center">
          <span className="text-4xl">🎉</span>
          <p className="font-semibold text-[#3E3025]">Không có sao kê nào cần thanh toán</p>
          <p className="text-sm text-[#9E8E7C]">Sao kê đã chốt sẽ hiển thị tại đây</p>
        </div>
      ) : (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Chưa thanh toán</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unpaid.map((item) => (
              <div key={item.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E8E7C]">{item.providerName}</p>
                    <p className="mt-1.5 text-2xl font-bold text-[#2C2215]">{currencyVnd(item.total)}</p>
                  </div>
                  <span className="badge-red shrink-0">Chưa trả</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-[#9E8E7C]">
                  <p>Kỳ sao kê: <span className="font-medium text-[#3E3025]">{item.period}</span></p>
                  <p>Hạn: <span className="font-semibold text-red-600">{item.dueDateLabel}</span></p>
                </div>
                <button type="button" onClick={() => modal.openModal(item)} className="btn-primary mt-4">
                  Thanh toán
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {paid.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Đã thanh toán</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paid.map((item) => (
              <div key={item.id} className="card flex flex-col p-5 opacity-75">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E8E7C]">{item.providerName}</p>
                    <p className="mt-1.5 text-xl font-bold text-[#2C2215]">{currencyVnd(item.total)}</p>
                  </div>
                  <span className="badge-green shrink-0">Đã trả</span>
                </div>
                <p className="mt-3 text-xs text-[#9E8E7C]">Kỳ: {item.period}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {paying && (
        <div className="modal-backdrop">
          <div className="modal-panel-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#2C2215]">Thanh toán sao kê</h3>
                <p className="mt-0.5 text-sm text-[#6B5B48]">{paying.providerName} · {paying.period}</p>
              </div>
              <button type="button" onClick={modal.closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#9E8E7C] hover:bg-[#EDE6DC]">
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F5F0E8] p-4 text-center">
              <p className="text-xs text-[#9E8E7C]">Số tiền cần thanh toán</p>
              <p className="mt-1 text-3xl font-bold text-[#2C2215]">{currencyVnd(paying.total)}</p>
              <p className="mt-0.5 text-xs text-red-600">Hạn: {paying.dueDateLabel}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="form-field">
                <label className="form-label">Số tiền thanh toán</label>
                <input type="number" value={modal.form.amount}
                  onChange={(e) => modal.updateForm('amount', e.target.value)}
                  className="form-input text-lg font-semibold" />
              </div>
              <div className="form-field">
                <label className="form-label">Ngày thanh toán</label>
                <input type="date" value={modal.form.paidAt}
                  onChange={(e) => modal.updateForm('paidAt', e.target.value)}
                  className="form-input" />
              </div>
            </div>

            {modal.error && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{modal.error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={modal.closeModal} className="btn-ghost flex-1">Hủy</button>
              <button type="button" disabled={modal.submitting} onClick={() => { void modal.submitPayment() }} className="btn-success flex-1">
                {modal.submitting ? '...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
