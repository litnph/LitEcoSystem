import { useEffect, useMemo, useState } from 'react'
import type { BnplProvider, Transaction } from '../../../entities'
import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'
import { formatPeriodVi, nextPeriod } from '../../../entities'

type BnplStatementModalProps = {
  open: boolean
  readonly: boolean
  provider: BnplProvider
  period: string
  transactions: Transaction[]
  additionalTransactions?: Transaction[]
  installmentCharges: number
  onClose: () => void
  onConfirm?: (includeIds: string[], deferIds: string[]) => void
}

export function BnplStatementModal({
  open,
  readonly,
  provider,
  period,
  transactions,
  additionalTransactions = [],
  installmentCharges,
  onClose,
  onConfirm,
}: BnplStatementModalProps) {
  const [included, setIncluded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return
    const next: Record<string, boolean> = {}
    transactions.forEach((t) => {
      next[t.id] = true
    })
    additionalTransactions.forEach((t) => {
      next[t.id] = false
    })
    setIncluded(next)
  }, [open, period, provider.id, transactions, additionalTransactions])

  const subtotal = useMemo(() => {
    return [...transactions, ...additionalTransactions]
      .filter((t) => included[t.id] !== false)
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, additionalTransactions, included])

  const finalAmount = subtotal + installmentCharges

  if (!open) return null

  function toggle(id: string) {
    if (readonly) return
    setIncluded((prev) => ({ ...prev, [id]: !(prev[id] !== false) }))
  }

  const deferIds = transactions.filter((t) => included[t.id] === false).map((t) => t.id)
  const includeIds = [...transactions, ...additionalTransactions]
    .filter((t) => included[t.id] !== false)
    .map((t) => t.id)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel-lg max-h-[90vh] max-w-5xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#EDE6DC] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#2C2215]">
              {readonly ? 'Tóm tắt' : 'Chốt'} sao kê — {provider.name}
            </h2>
            <p className="mt-0.5 text-xs text-[#9E8E7C]">
              Kỳ {formatPeriodVi(period)} · Ngày chốt sao kê hàng tháng: {provider.statementDay}
            </p>
            <p className="mt-1 text-[11px] text-[#9E8E7C]">
              Bỏ chọn giao dịch = hoãn sang kỳ {formatPeriodVi(nextPeriod(period))}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9E8E7C] hover:bg-[#EDE6DC]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#F5F0E8] px-3 py-2">
              <dt className="text-[10px] font-semibold uppercase text-[#9E8E7C]">Giao dịch chọn</dt>
              <dd className="text-sm font-bold text-[#3E3025]">{currencyVnd(subtotal)}</dd>
            </div>
            {installmentCharges > 0 && (
              <div className="rounded-xl bg-rose-50 px-3 py-2">
                <dt className="text-[10px] font-semibold uppercase text-rose-500">Trả góp / phí kỳ</dt>
                <dd className="text-sm font-bold text-rose-600">+{currencyVnd(installmentCharges)}</dd>
              </div>
            )}
            <div className="rounded-xl bg-[#EFE3D2] px-3 py-2 sm:col-span-1">
              <dt className="text-[10px] font-semibold uppercase text-[#7A5E3E]">Tổng sao kê</dt>
              <dd className="text-lg font-bold text-[#5C3A1E]">{currencyVnd(finalAmount)}</dd>
            </div>
          </dl>

          {transactions.length === 0 && additionalTransactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9E8E7C]">
              Không có giao dịch BNPL mở trong kỳ này.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <p className="mb-2 text-xs font-semibold uppercase text-[#9E8E7C]">Giao dịch trong kỳ sao kê</p>
                <table className="data-table min-w-[640px]">
                  <thead>
                    <tr>
                      {!readonly && <th className="data-th w-10" />}
                      <th className="data-th">Ngày</th>
                      <th className="data-th">Merchant</th>
                      <th className="data-th">Danh mục</th>
                      <th className="data-th text-right">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => {
                      const sel = included[item.id] !== false
                      return (
                        <tr
                          key={item.id}
                          onClick={readonly ? undefined : () => toggle(item.id)}
                          className={`transition ${
                            readonly ? 'data-tr' : `cursor-pointer ${sel ? 'data-tr-selected' : 'data-tr'}`
                          }`}
                        >
                          {!readonly && (
                            <td className="data-td w-10">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${
                                  sel
                                    ? 'border-[#7A5E3E] bg-[#7A5E3E]'
                                    : 'border-[#D4C9BE] bg-white'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggle(item.id)
                                }}
                              >
                                {sel && (
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </span>
                            </td>
                          )}
                          <td className="data-td text-xs text-[#9E8E7C]">
                            {formatISODateToVi(item.occurredAt)}
                          </td>
                          <td className="data-td font-medium text-[#2C2215]">{item.merchant}</td>
                          <td className="data-td">
                            <span className="badge-slate">{item.category}</span>
                          </td>
                          <td className="data-td text-right font-semibold text-[#2C2215]">
                            {currencyVnd(item.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {additionalTransactions.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="mb-2 text-xs font-semibold uppercase text-[#9E8E7C]">
                    Giao dịch cùng nguồn, chưa sao kê (có thể thêm vào kỳ này)
                  </p>
                  <table className="data-table min-w-[640px]">
                    <thead>
                      <tr>
                        {!readonly && <th className="data-th w-10" />}
                        <th className="data-th">Ngày</th>
                        <th className="data-th">Merchant</th>
                        <th className="data-th">Danh mục</th>
                        <th className="data-th text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {additionalTransactions.map((item) => {
                        const sel = included[item.id] !== false
                        return (
                          <tr
                            key={item.id}
                            onClick={readonly ? undefined : () => toggle(item.id)}
                            className={`transition ${
                              readonly ? 'data-tr' : `cursor-pointer ${sel ? 'data-tr-selected' : 'data-tr'}`
                            }`}
                          >
                            {!readonly && (
                              <td className="data-td w-10">
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${
                                      sel
                                      ? 'border-[#7A5E3E] bg-[#7A5E3E]'
                                      : 'border-[#D4C9BE] bg-white'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggle(item.id)
                                  }}
                                >
                                  {sel && (
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  )}
                                </span>
                              </td>
                            )}
                            <td className="data-td text-xs text-[#9E8E7C]">
                              {formatISODateToVi(item.occurredAt)}
                            </td>
                            <td className="data-td font-medium text-[#2C2215]">{item.merchant}</td>
                            <td className="data-td">
                              <span className="badge-slate">{item.category}</span>
                            </td>
                            <td className="data-td text-right font-semibold text-[#2C2215]">
                              {currencyVnd(item.amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#EDE6DC] px-6 py-4">
          <button type="button" onClick={onClose} className="btn-ghost">
            {readonly ? 'Đóng' : 'Hủy'}
          </button>
          {!readonly && (
            <button
              type="button"
              disabled={finalAmount <= 0}
              className="btn-primary disabled:opacity-50"
              onClick={() => {
                onConfirm?.(includeIds, deferIds)
                onClose()
              }}
            >
              Xác nhận chốt sao kê
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
