import { useState } from 'react'
import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'
import { usePfm } from '../../../app/PfmProvider'
import type { Transaction } from '../../../entities'
import { getEffectiveBnplStatementPeriod, nextPeriod } from '../../../entities'
import { useTransactionFilters } from '../hooks/useTransactionFilters'
import { TransactionModal } from './TransactionModal'
import { IconPlus } from '../../../shared/ui/Icon'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useTransactionMutations } from '../../../shared/hooks/useTransactionMutations'

function businessBadge(t: Transaction): { label: string; className: string } | null {
  if (t.businessType === 'advance_payment') return { label: 'Chi hộ', className: 'badge-amber' }
  if (t.businessType === 'loan_given') return { label: 'Cho mượn', className: 'badge-blue' }
  if (t.businessType === 'loan_borrowed') return { label: 'Mượn nợ', className: 'badge-red' }
  if (t.businessType === 'receivable_collection') return { label: 'Thu hồi', className: 'badge-green' }
  return null
}

function FilterBar({
  filters,
  onUpdate,
  onReset,
  activeCount,
  categories,
  sources,
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
          <input
            value={filters.search}
            onChange={(e) => onUpdate('search', e.target.value)}
            placeholder="Merchant, danh mục, kênh..."
            className="form-input"
          />
        </div>

        <div className="form-field w-32">
          <label className="form-label">Từ ngày</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onUpdate('dateFrom', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-field w-32">
          <label className="form-label">Đến ngày</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onUpdate('dateTo', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-field w-32">
          <label className="form-label">Loại</label>
          <select
            value={filters.type}
            onChange={(e) => onUpdate('type', e.target.value as 'all' | 'income' | 'expense')}
            className="form-select"
          >
            <option value="all">Tất cả</option>
            <option value="income">Thu nhập</option>
            <option value="expense">Chi tiêu</option>
          </select>
        </div>

        <div className="form-field w-36">
          <label className="form-label">Danh mục</label>
          <select
            value={filters.category}
            onChange={(e) => onUpdate('category', e.target.value)}
            className="form-select"
          >
            <option value="all">Tất cả</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-field w-36">
          <label className="form-label">Nguồn tiền</label>
          <select
            value={filters.source}
            onChange={(e) => onUpdate('source', e.target.value)}
            className="form-select"
          >
            <option value="all">Tất cả</option>
            {sources.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-field w-36">
          <label className="form-label">Hình thức</label>
          <select
            value={filters.paymentMode}
            onChange={(e) => onUpdate('paymentMode', e.target.value as 'all' | 'direct' | 'bnpl')}
            className="form-select"
          >
            <option value="all">Tất cả</option>
            <option value="direct">Trực tiếp</option>
            <option value="bnpl">BNPL</option>
          </select>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="btn-ghost btn-sm h-10 shrink-0"
          >
            Xoá bộ lọc ({activeCount})
          </button>
        )}
      </div>
    </div>
  )
}

export function TransactionsView() {
  const { state } = usePfm()
  const mutations = useTransactionMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const [convertingTx, setConvertingTx] = useState<Transaction | null>(null)
  const [tenorMonths, setTenorMonths] = useState(6)
  const [conversionFee, setConversionFee] = useState(50_000)
  const [firstBillingPeriod, setFirstBillingPeriod] = useState('')

  const { filters, update, reset, filtered, activeCount } = useTransactionFilters(
    state.transactions,
  )

  const openAdd = () => {
    setEditingTx(null)
    setModalOpen(true)
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingTx(null)
  }

  const handleDelete = (tx: Transaction) => {
    setPendingDelete(tx)
  }

  const openConvertModal = (tx: Transaction) => {
    const provider = tx.bnplProviderId
      ? state.bnplProviders.find((p) => p.id === tx.bnplProviderId)
      : null
    const defaultFirstPeriod =
      provider
        ? nextPeriod(getEffectiveBnplStatementPeriod(tx, provider.statementDay))
        : ''
    setConvertingTx(tx)
    setTenorMonths(6)
    setConversionFee(50_000)
    setFirstBillingPeriod(defaultFirstPeriod)
  }

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Giao dịch</h2>
          <p className="text-xs text-slate-400">
            {filtered.length} giao dịch
            {activeCount > 0 ? ` (đã lọc từ ${state.transactions.length})` : ''}
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary">
          <IconPlus className="h-4 w-4" />
          Thêm giao dịch
        </button>
      </div>

      <div className="card border-blue-100 bg-blue-50/80 p-4">
        <p className="text-xs font-semibold text-blue-900">Theo lịch bạn đã cấu hình</p>
        <p className="mt-1 text-[11px] leading-relaxed text-blue-800/90">
          Sao kê trả sau chốt ngày <strong>{state.calendarRules.statementClosingDay}</strong> hàng tháng · Hạn
          thanh toán thẻ ngày <strong>{state.calendarRules.paymentDueDay}</strong> (tháng sau kỳ sao kê) · Lương
          thường về <strong>
            {state.calendarRules.salaryFromDay}–{state.calendarRules.salaryToDay}
          </strong>{' '}
          mỗi tháng. Kỳ chi tiêu (menu bên cạnh) nên đặt theo tháng lương (vd 01→cuối tháng); sao kê thẻ tính
          theo ngân hàng.
        </p>
        <p className="mt-2 text-[10px] text-blue-700/80">Đổi các giá trị này tại menu Cấu hình.</p>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Thu nhập
          </p>
          <p className="mt-1.5 text-lg font-bold text-emerald-600">
            +{currencyVnd(totalIncome)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Chi tiêu
          </p>
          <p className="mt-1.5 text-lg font-bold text-red-600">
            -{currencyVnd(totalExpense)}
          </p>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Chênh lệch
          </p>
          <p
            className={`mt-1.5 text-lg font-bold ${
              totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {currencyVnd(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <FilterBar
        filters={filters}
        onUpdate={update}
        onReset={reset}
        activeCount={activeCount}
        categories={state.categories}
        sources={state.paymentSources}
      />

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-4xl">🔍</p>
            <p className="font-semibold text-slate-700">Không tìm thấy giao dịch</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="btn-ghost btn-sm"
              >
                Xoá bộ lọc
              </button>
            )}
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
                    <td className="data-td text-xs text-slate-500">
                      {formatISODateToVi(t.occurredAt)}
                    </td>
                    <td className="data-td">
                      {t.type === 'income' ? (
                        <span className="badge-green">Thu</span>
                      ) : (
                        <span className="badge-red">Chi</span>
                      )}
                    </td>
                    <td className="data-td font-medium text-slate-900 max-w-[160px]">
                      <span className="block truncate">{t.merchant}</span>
                      {badge && (
                        <span className={`mt-1 inline-flex ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                      {(t.businessType === 'advance_payment' || t.businessType === 'loan_given' || t.businessType === 'loan_borrowed') && t.counterpartyName && (
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          Đối tác: {t.counterpartyName}
                        </span>
                      )}
                      {t.note && (
                        <span className="block truncate text-xs text-slate-400">{t.note}</span>
                      )}
                    </td>
                    <td className="data-td text-slate-500">{t.channel}</td>
                    <td className="data-td">
                      <span className="badge-slate">{t.category}</span>
                    </td>
                    <td className="data-td text-slate-500">{t.source}</td>
                    <td className="data-td">
                      {t.paymentMode === 'bnpl' ? (
                        <span className="badge-blue">
                          BNPL{t.installmentConverted ? ' · TG' : ''}
                        </span>
                      ) : (
                        <span className="badge-slate">Trực tiếp</span>
                      )}
                    </td>
                    <td
                      className={`data-td text-right font-semibold ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}{currencyVnd(t.amount)}
                    </td>
                    <td className="data-td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="btn-ghost btn-sm"
                          title="Sửa"
                        >
                          Sửa
                        </button>
                        {t.paymentMode === 'bnpl' &&
                          !t.installmentConverted &&
                          !t.settledInStatementPeriod &&
                          t.amount >= state.installmentMinAmount && (
                          <button
                            type="button"
                            onClick={() => openConvertModal(t)}
                            className="btn-ghost btn-sm text-blue-700 hover:bg-blue-50"
                            title={`Chuyển trả góp (hạn mức tối thiểu ${state.installmentMinAmount > 0 ? new Intl.NumberFormat('vi-VN').format(state.installmentMinAmount) + ' ₫' : 'không giới hạn'})`}
                          >
                            Trả góp
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          title="Xoá"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <TransactionModal editingTx={editingTx} onClose={closeModal} />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xác nhận xoá giao dịch"
        message={
          pendingDelete
            ? `Bạn có chắc muốn xoá giao dịch "${pendingDelete.merchant}" không?`
            : ''
        }
        tone="danger"
        confirmText="Xoá"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            void mutations.deleteTransaction(pendingDelete.id)
          }
          setPendingDelete(null)
        }}
      />

      {convertingTx && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3 className="text-base font-semibold text-slate-900">Chuyển giao dịch sang trả góp</h3>
            <p className="mt-1 text-sm text-slate-500">
              {convertingTx.merchant} · {currencyVnd(convertingTx.amount)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="form-label">Số tháng trả góp</label>
                <input
                  type="number"
                  min={2}
                  max={36}
                  value={tenorMonths}
                  onChange={(e) => setTenorMonths(Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Phí chuyển đổi (VND)</label>
                <input
                  type="number"
                  min={0}
                  value={conversionFee}
                  onChange={(e) => setConversionFee(Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div className="form-field col-span-2">
                <label className="form-label">Kỳ trả đầu tiên (yyyy-mm)</label>
                <input
                  value={firstBillingPeriod}
                  onChange={(e) => setFirstBillingPeriod(e.target.value)}
                  placeholder="2026-05"
                  className="form-input"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sau khi chuyển đổi, giao dịch gốc sẽ không còn tính trực tiếp vào kỳ sao kê; hệ thống sẽ phát sinh kỳ trả góp và phí chuyển đổi.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setConvertingTx(null)} className="btn-ghost flex-1">
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={async () => {
                  const provider = convertingTx.bnplProviderId
                    ? state.bnplProviders.find((p) => p.id === convertingTx.bnplProviderId)
                    : null
                  if (!provider || !/^\d{4}-\d{2}$/.test(firstBillingPeriod)) return
                  const ok = await mutations.convertToInstallment({
                    sourceTransactionId: convertingTx.id,
                    providerId: convertingTx.bnplProviderId ?? '',
                    tenorMonths: Math.max(2, Math.min(36, Math.floor(tenorMonths) || 2)),
                    conversionFee: Math.max(0, Math.floor(conversionFee) || 0),
                    firstBillingPeriod,
                  })
                  if (ok) setConvertingTx(null)
                }}
              >
                Xác nhận chuyển đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
