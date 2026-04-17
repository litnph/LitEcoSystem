import { useMemo, useState } from 'react'
import { useDebtsQuery, useReceivablesQuery, useInstallmentsQuery, remainingDebt, remainingReceivable } from '@/entities/obligation'
import { useTransactionsQuery } from '@/entities/transaction'
import { useConfigurationQuery } from '@/entities/user'
import { useCollectReceivable } from '@/features/manage-obligations'
import { currencyVnd, formatISODateToVi } from '@/shared/lib/format'

export function ObligationsBoard() {
  const { data: debts = [] } = useDebtsQuery()
  const { data: receivables = [] } = useReceivablesQuery()
  const { data: installmentPlans = [] } = useInstallmentsQuery()
  const { data: transactions = [] } = useTransactionsQuery()
  const { data: config } = useConfigurationQuery()
  const paymentSources = config?.masterData.paymentSources ?? []
  const paymentChannels = config?.masterData.paymentChannels ?? []

  const collectReceivable = useCollectReceivable()

  const [tab, setTab] = useState<'installments' | 'payables' | 'receivables'>('installments')
  const [collectingId, setCollectingId] = useState<string | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectDate, setCollectDate] = useState(new Date().toISOString().slice(0, 10))
  const [collectSource, setCollectSource] = useState(paymentSources[0] ?? 'Cash')
  const [collectChannel, setCollectChannel] = useState(paymentChannels[0] ?? 'Khác')

  const totalDebt = useMemo(
    () => debts.filter((d) => d.status === 'active').reduce((sum, d) => sum + remainingDebt(d), 0),
    [debts],
  )
  const totalReceivable = useMemo(
    () => receivables.filter((r) => r.status === 'active').reduce((sum, r) => sum + remainingReceivable(r), 0),
    [receivables],
  )

  const payableItems = useMemo(
    () => debts.map((d) => ({
      id: d.id,
      title: d.title,
      partner: d.lender,
      dueDate: d.dueDate,
      principal: d.principal,
      paid: d.paidAmount,
      remaining: remainingDebt(d),
      status: d.status,
    })),
    [debts],
  )

  const receivableItems = useMemo(
    () => receivables.map((r) => ({
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
    [receivables],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Trả góp đang chạy</p>
          <p className="mt-1 text-xl font-bold text-[#7A5E3E]">{installmentPlans.filter((p) => p.status === 'active').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Khoản cần trả</p>
          <p className="mt-1 text-xl font-bold text-red-600">{currencyVnd(totalDebt)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Khoản cần thu</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{currencyVnd(totalReceivable)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['installments', 'payables', 'receivables'] as const).map((t) => (
          <button key={t} type="button"
            className={`btn-ghost btn-sm ${tab === t ? 'bg-[#EFE3D2] text-[#7A5E3E]' : ''}`}
            onClick={() => setTab(t)}>
            {t === 'installments' ? 'Trả góp' : t === 'payables' ? 'Trả nợ' : 'Thu hồi nợ'}
          </button>
        ))}
      </div>

      {tab === 'installments' && (
        <div className="card overflow-hidden">
          <div className="border-b border-[#EDE6DC] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#2C2215]">Quản lý trả góp</h2>
          </div>
          {installmentPlans.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#9E8E7C]">Chưa có kế hoạch trả góp.</p>
          ) : (
            <ul className="divide-y divide-[#EDE6DC] px-5">
              {installmentPlans.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-[#3E3025]">
                      {transactions.find((t) => t.id === p.sourceTransactionId)?.merchant ?? 'Giao dịch trả góp'}
                    </p>
                    <p className="text-xs text-[#9E8E7C]">
                      {p.paidMonths}/{p.tenorMonths} kỳ · Kỳ đầu {p.firstBillingPeriod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#2C2215]">{currencyVnd(p.monthlyPrincipal)}/tháng</p>
                    <p className="text-xs text-[#9E8E7C]">Phí chuyển đổi: {currencyVnd(p.conversionFee)}</p>
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
            <div className="border-b border-[#EDE6DC] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#2C2215]">Khoản cần trả</h2>
            </div>
            {payableItems.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#9E8E7C]">Chưa có khoản nợ.</p>
            ) : (
              <ul className="divide-y divide-[#EDE6DC] px-5">
                {payableItems.map((d) => (
                  <li key={d.id} className="py-3 text-sm">
                    <p className="font-medium text-[#3E3025]">{d.title}</p>
                    <p className="text-xs text-[#9E8E7C]">{d.partner} · Hạn {formatISODateToVi(d.dueDate)}</p>
                    <p className="mt-1 text-xs text-[#9E8E7C]">Gốc {currencyVnd(d.principal)} · Đã trả {currencyVnd(d.paid)}</p>
                    <p className="mt-1 text-xs text-red-600">Còn lại: {currencyVnd(d.remaining)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'receivables' && (
        <div className="card overflow-hidden">
          <div className="border-b border-[#EDE6DC] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#2C2215]">Khoản cần thu</h2>
          </div>
          {receivableItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#9E8E7C]">Chưa có khoản cần thu hồi.</p>
          ) : (
            <ul className="divide-y divide-[#EDE6DC] px-5">
              {receivableItems.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#3E3025]">
                        {r.title}
                        <span className={`ml-2 ${r.kind === 'loan_given' ? 'badge-blue' : 'badge-amber'}`}>
                          {r.kind === 'loan_given' ? 'Cho mượn' : 'Chi hộ'}
                        </span>
                      </p>
                      <p className="text-xs text-[#9E8E7C]">{r.partner} · Hạn {formatISODateToVi(r.dueDate)}</p>
                      <p className="mt-1 text-xs text-[#9E8E7C]">Gốc {currencyVnd(r.principal)} · Đã thu {currencyVnd(r.collected)}</p>
                      <p className="mt-1 text-xs text-emerald-600">Còn lại: {currencyVnd(r.remaining)}</p>
                    </div>
                    {r.status === 'active' && (
                      <button type="button" className="btn-ghost btn-sm"
                        onClick={() => { setCollectingId(r.id); setCollectAmount(String(r.remaining)) }}>
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
            <h3 className="text-base font-semibold text-[#2C2215]">Ghi nhận thu hồi</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="form-field col-span-2">
                <label className="form-label">Số tiền nhận</label>
                <input type="number" value={collectAmount} onChange={(e) => setCollectAmount(e.target.value)} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Ngày nhận</label>
                <input type="date" value={collectDate} onChange={(e) => setCollectDate(e.target.value)} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Nguồn nhận tiền</label>
                <select value={collectSource} onChange={(e) => setCollectSource(e.target.value)} className="form-select">
                  {paymentSources.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field col-span-2">
                <label className="form-label">Kênh nhận tiền</label>
                <select value={collectChannel} onChange={(e) => setCollectChannel(e.target.value)} className="form-select">
                  {paymentChannels.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" type="button" onClick={() => setCollectingId(null)}>Hủy</button>
              <button className="btn-primary flex-1" type="button" onClick={async () => {
                const amount = Number(String(collectAmount).replace(/\D/g, ''))
                if (!Number.isFinite(amount) || amount <= 0 || !collectDate) return
                await collectReceivable.mutateAsync({ id: collectingId!, amount })
                setCollectingId(null)
              }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
