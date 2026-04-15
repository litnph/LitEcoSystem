import { useState } from 'react'
import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'
import { usePfm } from '../../../app/PfmProvider'
import type { Transaction } from '../../../entities'
import { useTransactionFilters } from '../hooks/useTransactionFilters'
import { TransactionModal } from './TransactionModal'
import { IconPlus } from '../../../shared/ui/Icon'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

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
  const { state, dispatch } = usePfm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)

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
                  <th className="data-th w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
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
                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                          title="Sửa"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          title="Xoá"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            dispatch({ type: 'DELETE_TRANSACTION', payload: { id: pendingDelete.id } })
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
