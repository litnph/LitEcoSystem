import { useState } from 'react'
import { currencyVnd, formatISODateToVi } from '@/shared/lib/format'
import type { Transaction } from '@/entities/transaction'
import { useTransactionsQuery } from '@/entities/transaction'
import { getEffectiveBnplStatementPeriod, nextStatementPeriod } from '@/entities/spending-cycle'
import { useConfigurationQuery } from '@/entities/user'
import { useTransactionFilters } from '@/features/filter-transactions'
import { useDeleteTransaction, useConvertToInstallment, TransactionModal } from '@/features/add-transaction'
import { IconPlus } from '@/shared/ui/Icon'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

function businessBadge(t: Transaction): { label: string; className: string } | null {
  if (t.businessType === 'advance_payment') return { label: 'Chi hộ', className: 'badge-amber' }
  if (t.businessType === 'loan_given') return { label: 'Cho mượn', className: 'badge-blue' }
  if (t.businessType === 'loan_borrowed') return { label: 'Mượn nợ', className: 'badge-red' }
  if (t.businessType === 'receivable_collection') return { label: 'Thu hồi', className: 'badge-green' }
  return null
}

function FilterBar({
  filters, onUpdate, onReset, activeCount, categories, sources,
}: {
  filters: ReturnType<typeof useTransactionFilters>['filters']
  onUpdate: ReturnType<typeof useTransactionFilters>['update']
  onReset: () => void
  activeCount: number
  categories: string[]
  sources: string[]
}) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="form-field min-w-48 flex-1">
          <label className="form-label">Tìm kiếm</label>
          <input value={filters.search} onChange={(e) => onUpdate('search', e.target.value)} placeholder="Merchant, danh mục, kênh..." className="form-input" />
        </div>
        <div className="form-field w-32">
          <label className="form-label">Từ ngày</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => onUpdate('dateFrom', e.target.value)} className="form-input" />
        </div>
        <div className="form-field w-32">
          <label className="form-label">Đến ngày</label>
          <input type="date" value={filters.dateTo} onChange={(e) => onUpdate('dateTo', e.target.value)} className="form-input" />
        </div>
        <div className="form-field w-32">
          <label className="form-label">Loại</label>
          <select value={filters.type} onChange={(e) => onUpdate('type', e.target.value as 'all' | 'income' | 'expense')} className="form-select">
            <option value="all">Tất cả</option>
            <option value="income">Thu nhập</option>
            <option value="expense">Chi tiêu</option>
          </select>
        </div>
        <div className="form-field w-36">
          <label className="form-label">Danh mục</label>
          <select value={filters.category} onChange={(e) => onUpdate('category', e.target.value)} className="form-select">
            <option value="all">Tất cả</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field w-36">
          <label className="form-label">Nguồn tiền</label>
          <select value={filters.source} onChange={(e) => onUpdate('source', e.target.value)} className="form-select">
            <option value="all">Tất cả</option>
            {sources.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field w-36">
          <label className="form-label">Hình thức</label>
          <select value={filters.paymentMode} onChange={(e) => onUpdate('paymentMode', e.target.value as 'all' | 'direct' | 'bnpl')} className="form-select">
            <option value="all">Tất cả</option>
            <option value="direct">Trực tiếp</option>
            <option value="bnpl">BNPL</option>
          </select>
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="btn-ghost btn-sm h-10 shrink-0">
            Xoá bộ lọc ({activeCount})
          </button>
        )}
      </div>
    </div>
  )
}

export function TransactionListBoard() {
  const { data: transactions = [] } = useTransactionsQuery()
  const { data: config } = useConfigurationQuery()
  const deleteTransaction = useDeleteTransaction()
  const convertToInstallment = useConvertToInstallment()

  const bnplProviders = config?.bnplProviders ?? []
  const calendarRules = config?.calendarRules

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const [convertingTx, setConvertingTx] = useState<Transaction | null>(null)
  const [tenorMonths, setTenorMonths] = useState(6)
  const [conversionFee, setConversionFee] = useState(50_000)
  const [firstBillingPeriod, setFirstBillingPeriod] = useState('')

  const { filters, update, reset, filtered, activeCount } = useTransactionFilters(transactions)

  const openAdd = () => { setEditingTx(null); setModalOpen(true) }
  const openEdit = (tx: Transaction) => { setEditingTx(tx); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingTx(null) }

  const openConvertModal = (tx: Transaction) => {
    const provider = tx.bnplProviderId ? bnplProviders.find((p) => p.id === tx.bnplProviderId) : null
    const defaultFirstPeriod = provider ? nextStatementPeriod(getEffectiveBnplStatementPeriod(tx, provider.statementDay)) : ''
    setConvertingTx(tx)
    setTenorMonths(6)
    setConversionFee(50_000)
    setFirstBillingPeriod(defaultFirstPeriod)
  }

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#2C2215]">Giao dịch</h2>
          <p className="text-xs text-[#9E8E7C]">
            {filtered.length} giao dịch{activeCount > 0 ? ` (đã lọc từ ${transactions.length})` : ''}
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary">
          <IconPlus className="h-4 w-4" /> Thêm giao dịch
        </button>
      </div>

      {calendarRules && (
        <div className="card p-4" style={{ background: 'var(--cl-sidebar)', borderColor: 'var(--cl-border)' }}>
          <p className="text-xs font-semibold text-[#3E3025]">Theo lịch bạn đã cấu hình</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6B5B48]">
            Sao kê trả sau chốt ngày <strong>{calendarRules.statementClosingDay}</strong> hàng tháng · Hạn thanh toán thẻ ngày{' '}
            <strong>{calendarRules.paymentDueDay}</strong> (tháng sau kỳ sao kê) · Lương thường về{' '}
            <strong>{calendarRules.salaryFromDay}–{calendarRules.salaryToDay}</strong> mỗi tháng.
          </p>
          <p className="mt-2 text-[10px] text-[#9E8E7C]">Đổi các giá trị này tại menu Cấu hình.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Thu nhập</p>
          <p className="mt-1.5 text-lg font-bold text-emerald-600">+{currencyVnd(totalIncome)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Chi tiêu</p>
          <p className="mt-1.5 text-lg font-bold text-red-600">-{currencyVnd(totalExpense)}</p>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8E7C]">Chênh lệch</p>
          <p className={`mt-1.5 text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {currencyVnd(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters} onUpdate={update} onReset={reset} activeCount={activeCount}
        categories={config?.masterData.categories ?? []} sources={config?.masterData.paymentSources ?? []}
      />

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-4xl">🔍</p>
            <p className="font-semibold text-[#3E3025]">Không tìm thấy giao dịch</p>
            {activeCount > 0 && <button type="button" onClick={reset} className="btn-ghost btn-sm">Xoá bộ lọc</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  <th className="data-th">Ngày</th>
                  <th className="data-th">Loại</th>
                  <th className="data-th">Mô tả</th>
                  <th className="data-th">Kênh</th>
                  <th className="data-th">Danh mục</th>
                  <th className="data-th">Nguồn</th>
                  <th className="data-th">Hình thức</th>
                  <th className="data-th text-right">Số tiền</th>
                  <th className="data-th w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const badge = businessBadge(t)
                  return (
                    <tr key={t.id} className="data-tr group">
                      <td className="data-td text-xs text-[#9E8E7C]">{formatISODateToVi(t.occurredAt)}</td>
                      <td className="data-td">{t.type === 'income' ? <span className="badge-green">Thu</span> : <span className="badge-red">Chi</span>}</td>
                      <td className="data-td font-medium text-[#2C2215] max-w-[160px]">
                        <span className="block truncate">{t.merchant}</span>
                        {badge && <span className={`mt-1 inline-flex ${badge.className}`}>{badge.label}</span>}
                        {(t.businessType === 'advance_payment' || t.businessType === 'loan_given' || t.businessType === 'loan_borrowed') && t.counterpartyName && (
                          <span className="mt-1 block truncate text-xs text-[#9E8E7C]">Đối tác: {t.counterpartyName}</span>
                        )}
                        {t.note && <span className="block truncate text-xs text-[#BFB0A0]">{t.note}</span>}
                      </td>
                      <td className="data-td text-[#9E8E7C]">{t.channel}</td>
                      <td className="data-td"><span className="badge-slate">{t.category}</span></td>
                      <td className="data-td text-[#9E8E7C]">{t.source}</td>
                      <td className="data-td">
                        {t.paymentMode === 'bnpl' ? (
                          <span className="badge-blue">BNPL{t.installmentConverted ? ' · TG' : ''}</span>
                        ) : (
                          <span className="badge-slate">Trực tiếp</span>
                        )}
                      </td>
                      <td className={`data-td text-right font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{currencyVnd(t.amount)}
                      </td>
                      <td className="data-td">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => openEdit(t)} className="btn-ghost btn-sm" title="Sửa">Sửa</button>
                          {t.paymentMode === 'bnpl' && !t.installmentConverted && !t.settledInStatementPeriod && (() => {
                            const provider = bnplProviders.find((p) => p.id === t.bnplProviderId)
                            const limit = provider?.installmentLimit ?? null
                            return limit === null || t.amount >= limit
                          })() && (
                            <button type="button" onClick={() => openConvertModal(t)} className="btn-ghost btn-sm text-blue-700 hover:bg-blue-50" title="Chuyển trả góp">Trả góp</button>
                          )}
                          <button type="button" onClick={() => setPendingDelete(t)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50" title="Xoá">Xoá</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && <TransactionModal editingTx={editingTx} onClose={closeModal} />}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xác nhận xoá giao dịch"
        message={pendingDelete ? `Bạn có chắc muốn xoá giao dịch "${pendingDelete.merchant}" không?` : ''}
        tone="danger"
        confirmText="Xoá"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteTransaction.mutate(pendingDelete.id)
          setPendingDelete(null)
        }}
      />

      {convertingTx && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3 className="text-base font-semibold text-[#2C2215]">Chuyển giao dịch sang trả góp</h3>
            <p className="mt-1 text-sm text-[#6B5B48]">{convertingTx.merchant} · {currencyVnd(convertingTx.amount)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="form-label">Số tháng trả góp</label>
                <input type="number" min={2} max={36} value={tenorMonths} onChange={(e) => setTenorMonths(Number(e.target.value))} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Phí chuyển đổi (VND)</label>
                <input type="number" min={0} value={conversionFee} onChange={(e) => setConversionFee(Number(e.target.value))} className="form-input" />
              </div>
              <div className="form-field col-span-2">
                <label className="form-label">Kỳ trả đầu tiên (yyyy-mm)</label>
                <input value={firstBillingPeriod} onChange={(e) => setFirstBillingPeriod(e.target.value)} placeholder="2026-05" className="form-input" />
              </div>
            </div>
            <p className="mt-2 text-xs text-[#9E8E7C]">Sau khi chuyển đổi, giao dịch gốc sẽ không còn tính trực tiếp vào kỳ sao kê.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setConvertingTx(null)} className="btn-ghost flex-1">Hủy</button>
              <button type="button" className="btn-primary flex-1"
                onClick={async () => {
                  const provider = convertingTx.bnplProviderId ? bnplProviders.find((p) => p.id === convertingTx.bnplProviderId) : null
                  if (!provider || !/^\d{4}-\d{2}$/.test(firstBillingPeriod)) return
                  await convertToInstallment.mutateAsync({
                    sourceTransactionId: convertingTx.id,
                    providerId: convertingTx.bnplProviderId ?? '',
                    tenorMonths: Math.max(2, Math.min(36, Math.floor(tenorMonths) || 2)),
                    conversionFee: Math.max(0, Math.floor(conversionFee) || 0),
                    firstBillingPeriod,
                  })
                  setConvertingTx(null)
                }}>
                Xác nhận chuyển đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
