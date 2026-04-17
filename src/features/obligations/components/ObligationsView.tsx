import { useMemo, useState } from 'react'
import { usePfm } from '../../../app/PfmProvider'
import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'
import { remainingDebt, remainingReceivable } from '../../../entities'
import { useObligationMutations } from '../../../shared/hooks/useObligationMutations'

export function ObligationsView() {
  const { state } = usePfm()
  const mutations = useObligationMutations()
  const [tab, setTab] = useState<'installments' | 'payables' | 'receivables'>('installments')
  const [collectingId, setCollectingId] = useState<string | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectDate, setCollectDate] = useState(new Date().toISOString().slice(0, 10))
  const [collectSource, setCollectSource] = useState(state.paymentSources[0] ?? 'Cash')
  const [collectChannel, setCollectChannel] = useState(state.paymentChannels[0] ?? 'Khác')

  const totalDebt = useMemo(
    () => state.debts.filter((d) => d.status === 'active').reduce((sum, d) => sum + remainingDebt(d), 0),
    [state.debts],
  )
  const totalReceivable = useMemo(
    () =>
      state.receivables
        .filter((r) => r.status === 'active')
        .reduce((sum, r) => sum + remainingReceivable(r), 0),
    [state.receivables],
  )
  const payableItems = useMemo(
    () =>
      state.debts.map((d) => ({
        id: d.id,
        title: d.title,
        partner: d.lender,
        dueDate: d.dueDate,
        principal: d.principal,
        paid: d.paidAmount,
        remaining: remainingDebt(d),
        status: d.status,
      })),
    [state.debts],
  )
  const receivableItems = useMemo(
    () =>
      state.receivables.map((r) => ({
        id: r.id,
        title: r.title,
        partner: r.borrower,
        dueDate: r.dueDate,
        principal: r.principal,
        collected: r.collectedAmount,
        remaining: remainingReceivable(r),
        status: r.status,
        kind: r.kind ?? 'advance',
      })),
    [state.receivables],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trả góp đang chạy</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{state.installmentPlans.filter((p) => p.status === 'active').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Khoản cần trả</p>
          <p className="mt-1 text-xl font-bold text-red-600">{currencyVnd(totalDebt)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Khoản cần thu</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{currencyVnd(totalReceivable)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" className={`btn-ghost btn-sm ${tab === 'installments' ? 'bg-blue-50 text-blue-700' : ''}`} onClick={() => setTab('installments')}>
          Trả góp
        </button>
        <button type="button" className={`btn-ghost btn-sm ${tab === 'payables' ? 'bg-blue-50 text-blue-700' : ''}`} onClick={() => setTab('payables')}>
          Trả nợ
        </button>
        <button type="button" className={`btn-ghost btn-sm ${tab === 'receivables' ? 'bg-blue-50 text-blue-700' : ''}`} onClick={() => setTab('receivables')}>
          Thu hồi nợ
        </button>
      </div>

      {tab === 'installments' && (
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Quản lý trả góp</h2>
        </div>
        {state.installmentPlans.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">Chưa có kế hoạch trả góp.</p>
        ) : (
          <ul className="divide-y divide-slate-100 px-5">
            {state.installmentPlans.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    {state.transactions.find((t) => t.id === p.sourceTransactionId)?.merchant ?? 'Giao dịch trả góp'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.paidMonths}/{p.tenorMonths} kỳ · Kỳ đầu {p.firstBillingPeriod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{currencyVnd(p.monthlyPrincipal)}/tháng</p>
                  <p className="text-xs text-slate-500">Phí chuyển đổi: {currencyVnd(p.conversionFee)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      {tab === 'payables' && (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Khoản cần trả</h2>
          </div>
          {payableItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Chưa có khoản nợ.</p>
          ) : (
            <ul className="divide-y divide-slate-100 px-5">
              {payableItems.map((d) => (
                <li key={d.id} className="py-3 text-sm">
                  <p className="font-medium text-slate-800">{d.title}</p>
                  <p className="text-xs text-slate-500">
                    {d.partner} · Hạn {formatISODateToVi(d.dueDate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Gốc {currencyVnd(d.principal)} · Đã trả {currencyVnd(d.paid)}
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    Còn lại: {currencyVnd(d.remaining)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      )}
      {tab === 'receivables' && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Khoản cần thu</h2>
          </div>
          {receivableItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Chưa có khoản cần thu hồi.</p>
          ) : (
            <ul className="divide-y divide-slate-100 px-5">
              {receivableItems.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {r.title}
                        <span className={`ml-2 ${r.kind === 'loan_given' ? 'badge-blue' : 'badge-amber'}`}>
                          {r.kind === 'loan_given' ? 'Cho mượn' : 'Chi hộ'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.partner} · Hạn {formatISODateToVi(r.dueDate)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Gốc {currencyVnd(r.principal)} · Đã thu {currencyVnd(r.collected)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        Còn lại: {currencyVnd(r.remaining)}
                      </p>
                    </div>
                    {r.status === 'active' && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => {
                          setCollectingId(r.id)
                          setCollectAmount(String(r.remaining))
                        }}
                      >
                        Thu hồi công nợ
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {collectingId && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3 className="text-base font-semibold text-slate-900">Ghi nhận thu hồi</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="form-field col-span-2">
                <label className="form-label">Số tiền nhận</label>
                <input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Ngày nhận</label>
                <input type="date" value={collectDate} onChange={(e) => setCollectDate(e.target.value)} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Nguồn nhận tiền</label>
                <select value={collectSource} onChange={(e) => setCollectSource(e.target.value)} className="form-select">
                  {state.paymentSources.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field col-span-2">
                <label className="form-label">Kênh nhận tiền</label>
                <select value={collectChannel} onChange={(e) => setCollectChannel(e.target.value)} className="form-select">
                  {state.paymentChannels.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" type="button" onClick={() => setCollectingId(null)}>Hủy</button>
              <button
                className="btn-primary flex-1"
                type="button"
                onClick={async () => {
                  const amount = Number(String(collectAmount).replace(/\D/g, ''))
                  if (!Number.isFinite(amount) || amount <= 0 || !collectDate) return
                  const receivable = state.receivables.find((r) => r.id === collectingId)
                  if (!receivable) return
                  const ok = await mutations.collectReceivable(receivable, amount, collectDate, collectSource, collectChannel)
                  if (ok) setCollectingId(null)
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
