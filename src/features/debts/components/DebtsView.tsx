import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'
import { remainingDebt } from '../../../entities'
import { useDebts } from '../hooks/useDebts'
import { IconPlus } from '../../../shared/ui/Icon'
import { usePfmState } from '../../../app/PfmProvider'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

export function DebtsView() {
  const d = useDebts()
  const state = usePfmState()

  const totalRemaining = d.debts
    .filter((x) => x.status === 'active')
    .reduce((s, x) => s + remainingDebt(x), 0)

  return (
    <div className="space-y-6">
      {/* ── Metric ── */}
      <div className="card-metric bg-gradient-to-br from-[#8B6F4E] to-[#4E3420] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#D9CCB8]">
          Tổng dư nợ còn lại
        </p>
        <p className="mt-2 text-3xl font-bold">{currencyVnd(totalRemaining)}</p>
        <p className="mt-1 text-xs text-[#C4B5A5]">
          {d.debts.filter((x) => x.status === 'active').length} khoản đang hoạt động
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {/* ── Form ── */}
        <div className="card p-5">
          <div className="flex items-center gap-2 pb-4 border-b border-[#EDE6DC]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#62492E]">
              <IconPlus className="h-4 w-4 text-white" />
            </span>
            <h2 className="text-sm font-semibold text-[#2C2215]">Thêm vay / công nợ</h2>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Tiêu đề khoản vay">
              <input
                value={d.title}
                onChange={(e) => d.setTitle(e.target.value)}
                placeholder="Vay tiền mua xe, vay bạn A..."
                className="form-input"
              />
            </Field>
            <Field label="Chủ nợ / bên cho vay">
              <input
                value={d.lender}
                onChange={(e) => d.setLender(e.target.value)}
                placeholder="Tên người / tổ chức"
                className="form-input"
              />
            </Field>
            <Field label="Số tiền gốc (VND)">
              <input
                value={d.principal}
                onChange={(e) => d.setPrincipal(e.target.value)}
                placeholder="10,000,000"
                className="form-input"
              />
            </Field>
            <Field label="Hạn trả nợ">
              <input
                type="date"
                value={d.dueDate}
                onChange={(e) => d.setDueDate(e.target.value)}
                className="form-input"
              />
            </Field>
            <button type="button" onClick={d.addDebt} className="btn-primary w-full">
              Lưu khoản vay
            </button>
          </div>
        </div>

        {/* ── Debt list ── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EDE6DC] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#2C2215]">Danh sách công nợ</h2>
            <span className="badge-slate">{d.debts.length} khoản</span>
          </div>

          {d.debts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-4xl">🏦</p>
              <p className="text-sm font-medium text-[#9E8E7C]">Chưa có khoản vay nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EDE6DC] p-4">
              {d.debts.map((row) => {
                const remaining = remainingDebt(row)
                const pct = Math.min(100, Math.round((row.paidAmount / row.principal) * 100))
                return (
                  <li key={row.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2C2215]">{row.title}</p>
                        <p className="mt-0.5 text-xs text-[#9E8E7C]">
                          Chủ nợ: {row.lender} · Hạn: {formatISODateToVi(row.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.status === 'settled' ? (
                          <span className="badge-green">Đã xong</span>
                        ) : (
                          <span className="badge-amber">Đang nợ</span>
                        )}
                        {row.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              d.setPaymentDebtId(row.id)
                              d.setPaymentAmount(String(remaining))
                            }}
                            className="btn-ghost btn-sm"
                          >
                            Trả nợ
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <div className="rounded-xl bg-[#F5F0E8] px-3 py-2">
                        <p className="text-[#9E8E7C]">Gốc</p>
                        <p className="mt-0.5 font-semibold text-[#3E3025]">
                          {currencyVnd(row.principal)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 px-3 py-2">
                        <p className="text-emerald-600">Đã trả</p>
                        <p className="mt-0.5 font-semibold text-emerald-700">
                          {currencyVnd(row.paidAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-red-50 px-3 py-2">
                        <p className="text-red-500">Còn lại</p>
                        <p className="mt-0.5 font-semibold text-red-700">
                          {currencyVnd(remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 overflow-hidden rounded-full bg-[#EDE6DC] h-1.5">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-[#9E8E7C]">{pct}% đã trả</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Payment modal ── */}
      {d.paymentDebtId && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3 className="text-base font-semibold text-[#2C2215]">Ghi nhận trả nợ</h3>
            <p className="mt-0.5 text-sm text-[#6B5B48]">
              {d.debts.find((x) => x.id === d.paymentDebtId)?.title}
            </p>

            <div className="mt-5 form-field">
              <label className="form-label">Số tiền trả</label>
              <input
                type="number"
                value={d.paymentAmount}
                onChange={(e) => d.setPaymentAmount(e.target.value)}
                className="form-input text-lg font-semibold"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => d.setPaymentDebtId(null)}
                className="btn-ghost flex-1"
              >
                Hủy
              </button>
              <button type="button" onClick={d.payDebt} className="btn-success flex-1">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Installment management quick view ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EDE6DC] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#2C2215]">Danh sách trả góp</h2>
          <span className="badge-slate">{state.installmentPlans.length} kế hoạch</span>
        </div>
        {state.installmentPlans.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#9E8E7C]">Chưa có khoản trả góp nào.</p>
        ) : (
          <ul className="divide-y divide-[#EDE6DC] px-5">
            {state.installmentPlans.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-[#3E3025]">
                    {state.bnplProviders.find((x) => x.id === p.providerId)?.name ?? p.providerId}
                  </p>
                  <p className="text-xs text-[#9E8E7C]">
                    {p.paidMonths}/{p.tenorMonths} kỳ · Bắt đầu {p.firstBillingPeriod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#2C2215]">{currencyVnd(p.monthlyPrincipal)}</p>
                  <span className={p.status === 'completed' ? 'badge-green' : 'badge-amber'}>
                    {p.status === 'completed' ? 'Hoàn tất' : 'Đang trả'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
