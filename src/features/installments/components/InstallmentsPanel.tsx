import { useState } from 'react'
import { currencyVnd } from '../../../shared/lib/format'
import type { InstallmentPlan } from '../../../entities'

type InstallmentsPanelProps = {
  plans: InstallmentPlan[]
  convertibleTransactionIds: { id: string; label: string }[]
  onCreate: (p: {
    transactionId: string
    tenorMonths: number
    conversionFee: number
  }) => void
}

export function InstallmentsPanel({
  plans,
  convertibleTransactionIds,
  onCreate,
}: InstallmentsPanelProps) {
  const [txId, setTxId] = useState(convertibleTransactionIds[0]?.id ?? '')
  const [tenor, setTenor] = useState(6)
  const [fee, setFee] = useState(50_000)

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[#2C2215]">Chuyển đổi trả góp</h3>
      <p className="mt-1 text-xs text-[#9E8E7C]">
        Sao kê kỳ tiếp theo sẽ gồm phí chuyển đổi + kỳ trả đầu tiên.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="form-field sm:col-span-3">
          <label className="form-label">Giao dịch BNPL</label>
          <select
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            className="form-select"
          >
            {convertibleTransactionIds.length === 0 ? (
              <option value="">Không có giao dịch phù hợp trong kỳ</option>
            ) : (
              convertibleTransactionIds.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))
            )}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Số tháng</label>
          <input
            type="number"
            min={2}
            max={36}
            value={tenor}
            onChange={(e) => setTenor(Number(e.target.value))}
            className="form-input"
          />
        </div>

        <div className="form-field sm:col-span-2">
          <label className="form-label">Phí chuyển đổi (VND)</label>
          <input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="form-input"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!txId}
        onClick={() => onCreate({ transactionId: txId, tenorMonths: tenor, conversionFee: fee })}
        className="btn-ghost mt-3 w-full"
      >
        Chuyển sang trả góp
      </button>

      {plans.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-[#EDE6DC] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">
            Kế hoạch đang chạy
          </p>
          {plans.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-3"
            >
              <div>
                <p className="text-xs font-medium text-[#3E3025]">
                  Kỳ đầu: <span className="font-semibold">{p.firstBillingPeriod}</span>
                  {' '}· {p.tenorMonths} tháng
                  {' '}· {p.paidMonths}/{p.tenorMonths} kỳ đã trả
                </p>
                <p className="mt-0.5 text-xs text-[#9E8E7C]">
                  Kỳ 1: phí {currencyVnd(p.conversionFee)} + {currencyVnd(p.monthlyPrincipal)}/tháng
                </p>
              </div>
              <span
                className={p.status === 'completed' ? 'badge-green' : 'badge-blue'}
              >
                {p.status === 'completed' ? 'Hoàn tất' : 'Đang chạy'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
