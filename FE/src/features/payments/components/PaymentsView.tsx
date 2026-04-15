import { currencyVnd } from '../../../shared/lib/format'
import { usePfm } from '../../../app/PfmProvider'
import { usePaymentModal } from '../hooks/usePaymentModal'

export function PaymentsView() {
  const { state } = usePfm()
  const modal = usePaymentModal()

  const paying = state.confirmedStatements.find((s) => s.id === modal.payingId)
  const unpaid = state.confirmedStatements.filter((s) => s.status === 'unpaid')
  const paid = state.confirmedStatements.filter((s) => s.status === 'paid')

  return (
    <section className="space-y-6">
      {/* ── Header summary ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-metric bg-gradient-to-br from-red-500 to-red-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-200">
            Cần thanh toán
          </p>
          <p className="mt-2 text-2xl font-bold">
            {currencyVnd(unpaid.reduce((s, x) => s + x.total, 0))}
          </p>
          <p className="mt-1 text-xs text-red-300">{unpaid.length} sao kê đang chờ</p>
        </div>
        <div className="card-metric bg-gradient-to-br from-emerald-500 to-emerald-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
            Đã thanh toán
          </p>
          <p className="mt-2 text-2xl font-bold">
            {currencyVnd(paid.reduce((s, x) => s + x.total, 0))}
          </p>
          <p className="mt-1 text-xs text-emerald-300">{paid.length} sao kê hoàn tất</p>
        </div>
        <div className="card-metric bg-gradient-to-br from-slate-600 to-slate-800 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tổng sao kê
          </p>
          <p className="mt-2 text-2xl font-bold">
            {currencyVnd(
              state.confirmedStatements.reduce((s, x) => s + x.total, 0),
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">{state.confirmedStatements.length} sao kê</p>
        </div>
      </div>

      {/* ── Unpaid ── */}
      {unpaid.length === 0 ? (
        <div className="card flex min-h-40 flex-col items-center justify-center gap-3 text-center">
          <span className="text-4xl">🎉</span>
          <p className="font-semibold text-slate-700">Không có sao kê nào cần thanh toán</p>
          <p className="text-sm text-slate-400">Sao kê đã chốt sẽ hiển thị tại đây</p>
        </div>
      ) : (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Chưa thanh toán
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unpaid.map((item) => (
              <div key={item.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {item.providerName}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">
                      {currencyVnd(item.total)}
                    </p>
                  </div>
                  <span className="badge-red shrink-0">Chưa trả</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>Kỳ sao kê: <span className="font-medium text-slate-700">{item.period}</span></p>
                  <p>Hạn: <span className="font-semibold text-red-600">{item.dueDateLabel}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => modal.open(item)}
                  className="btn-primary mt-4"
                >
                  Thanh toán
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Paid ── */}
      {paid.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Đã thanh toán
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paid.map((item) => (
              <div key={item.id} className="card flex flex-col p-5 opacity-75">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {item.providerName}
                    </p>
                    <p className="mt-1.5 text-xl font-bold text-slate-900">
                      {currencyVnd(item.total)}
                    </p>
                  </div>
                  <span className="badge-green shrink-0">Đã trả</span>
                </div>
                <p className="mt-3 text-xs text-slate-400">Kỳ: {item.period}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {paying && (
        <div className="modal-backdrop">
          <div className="modal-panel-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Thanh toán sao kê
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{paying.providerName} · {paying.period}</p>
              </div>
              <button
                type="button"
                onClick={modal.close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">Số tiền cần thanh toán</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{currencyVnd(paying.total)}</p>
              <p className="mt-0.5 text-xs text-red-600">Hạn: {paying.dueDateLabel}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="form-field">
                <label className="form-label">Số tiền thanh toán</label>
                <input
                  type="number"
                  value={modal.amount}
                  onChange={(e) => modal.setAmount(e.target.value)}
                  className="form-input text-lg font-semibold"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Nguồn tiền</label>
                <select
                  value={modal.source}
                  onChange={(e) => modal.setSource(e.target.value)}
                  className="form-select"
                >
                  {modal.paySources.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={modal.close} className="btn-ghost flex-1">
                Hủy
              </button>
              <button type="button" onClick={modal.confirm} className="btn-success flex-1">
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
