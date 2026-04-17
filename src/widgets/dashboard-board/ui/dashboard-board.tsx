import { useMemo } from 'react'
import { currencyVnd, formatISODateToVi } from '@/shared/lib/format'
import { formatPeriodVi } from '@/entities/spending-cycle'
import { useDashboardData } from '../model/use-dashboard-data'
import { IconArrowDown, IconArrowUp, IconBell, IconCheck } from '@/shared/ui/Icon'

type DashboardBoardProps = {
  onGoCycle: () => void
  onGoPayments: () => void
}

export function DashboardBoard({ onGoCycle, onGoPayments }: DashboardBoardProps) {
  const d = useDashboardData()

  const chartGradient = useMemo(() => {
    if (d.spendingByCategory.length === 0) return '#e2e8f0 0% 100%'
    let offset = 0
    return d.spendingByCategory.map((item) => {
      const start = offset
      const end = offset + item.value
      offset = end
      return `${item.color} ${start}% ${end}%`
    }).join(', ')
  }, [d.spendingByCategory])

  const totalExpense = useMemo(() => d.recentTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [d.recentTransactions])
  const totalIncome = useMemo(() => d.recentTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [d.recentTransactions])

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-metric col-span-full sm:col-span-1 bg-gradient-to-br from-[#8B6F4E] to-[#4E3420] p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D9CCB8]">Tài sản ròng</p>
          <p className="mt-3 text-3xl font-bold leading-none tracking-tight">{currencyVnd(d.netWorth)}</p>
          <p className="mt-2 text-xs text-[#C4B5A5]">Cập nhật tự động theo giao dịch</p>
        </div>
        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Thu nhập</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50"><IconArrowDown className="h-4 w-4 text-emerald-600" /></span>
          </div>
          <div>
            <p className="mt-4 text-xl font-bold text-[#2C2215]">{currencyVnd(totalIncome)}</p>
            <p className="mt-1 text-xs text-[#9E8E7C]">Tổng thu gần nhất</p>
          </div>
        </div>
        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Chi tiêu</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50"><IconArrowUp className="h-4 w-4 text-red-500" /></span>
          </div>
          <div>
            <p className="mt-4 text-xl font-bold text-[#2C2215]">{currencyVnd(totalExpense)}</p>
            <p className="mt-1 text-xs text-[#9E8E7C]">Tổng chi gần nhất</p>
          </div>
        </div>
      </div>

      {d.pendingBnplAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100"><IconBell className="h-4 w-4 text-amber-600" /></span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Cảnh báo sao kê</p>
                <ul className="mt-1 space-y-0.5">
                  {d.pendingBnplAlerts.map((a) => (
                    <li key={a.providerName} className="text-sm text-amber-800">
                      <span className="font-medium">{a.providerName}</span>: {a.count} giao dịch chưa chốt ({formatPeriodVi(a.period)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button type="button" onClick={onGoCycle} className="btn-primary btn-sm">Kiểm tra &amp; chốt</button>
          </div>
        </div>
      )}

      {d.unpaidStatements.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-blue-900">Có <span className="font-bold">{d.unpaidStatements.length}</span> sao kê đã chốt chưa thanh toán</p>
            <button type="button" onClick={onGoPayments} className="btn-primary btn-sm">Thanh toán ngay</button>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[#2C2215]">Chi tiêu theo danh mục</h2>
          {d.spendingByCategory.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center text-center">
              <p className="text-3xl">📊</p>
              <p className="mt-2 text-sm text-[#9E8E7C]">Chưa có dữ liệu chi tiêu</p>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-8">
              <div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${chartGradient})` }}>
                <div className="absolute inset-[18px] rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#9E8E7C]">{d.spendingByCategory.length} nhóm</span>
                </div>
              </div>
              <ul className="space-y-2.5">
                {d.spendingByCategory.map((item) => (
                  <li key={item.label} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="min-w-[64px] text-sm text-[#6B5B48]">{item.label}</span>
                    <span className="font-semibold text-[#2C2215]">{item.value}%</span>
                    <span className="text-xs text-[#9E8E7C]">{currencyVnd(item.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[#2C2215]">Giao dịch gần đây</h2>
          <ul className="mt-4 space-y-1">
            {d.recentTransactions.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-[#F9F6F2]">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm ${item.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'income' ? '↓' : '↑'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#2C2215]">{item.merchant}</p>
                    <p className="text-xs text-[#9E8E7C]">{item.category} · {formatISODateToVi(item.occurredAt)}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {item.type === 'income' ? '+' : '-'}{currencyVnd(item.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {d.urgentDebts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[#2C2215]">Công nợ đang mở</h2>
          <ul className="mt-4 space-y-3">
            {d.urgentDebts.map((x) => {
              const remaining = x.principal - x.paidAmount
              const pct = Math.min(100, Math.round((x.paidAmount / x.principal) * 100))
              return (
                <li key={x.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#3E3025]">{x.title}</span>
                    <span className="font-semibold text-red-600">Còn {currencyVnd(remaining)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex-1 overflow-hidden rounded-full bg-[#EDE6DC] h-1.5">
                      <div className="h-full rounded-full bg-[#8B6F4E] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-[#9E8E7C]">{pct}% đã trả</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {d.pendingBnplAlerts.length === 0 && d.unpaidStatements.length === 0 && d.urgentDebts.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50"><IconCheck className="h-5 w-5 text-emerald-600" /></span>
          <p className="font-semibold text-[#3E3025]">Mọi thứ ổn!</p>
          <p className="text-sm text-[#9E8E7C]">Không có cảnh báo hay công nợ nào.</p>
        </div>
      )}
    </section>
  )
}
