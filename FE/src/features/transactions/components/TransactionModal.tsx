import { useMemo } from 'react'
import type { Transaction } from '../../../entities'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { IconX } from '../../../shared/ui/Icon'

type Props = {
  editingTx: Transaction | null
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

export function TransactionModal({ editingTx, onClose }: Props) {
  const f = useTransactionForm(editingTx, onClose)
  const categoryGroups = useMemo(
    () =>
      f.categories.reduce<Record<string, string[]>>((acc, item) => {
        const [parent, child] = item.split('/')
        const p = parent || 'Khác'
        const c = child || item
        if (!acc[p]) acc[p] = []
        if (!acc[p].includes(c)) acc[p].push(c)
        return acc
      }, {}),
    [f.categories],
  )
  const parentOptions = Object.keys(categoryGroups)
  const hasParentOptions = parentOptions.length > 0
  const [currentParentRaw, currentChildRaw] = f.form.category.split('/')
  const currentParent =
    (currentParentRaw && categoryGroups[currentParentRaw] && currentParentRaw) || ''
  const childOptions = categoryGroups[currentParent] ?? []
  const currentChild =
    (currentChildRaw && childOptions.includes(currentChildRaw) && currentChildRaw) || ''

  return (
    <div className="modal-backdrop">
      <div
        className="modal-panel-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {f.isEditing ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {f.isEditing ? 'Chỉnh sửa thông tin giao dịch' : 'Nhập thông tin giao dịch mới'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <IconX />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Type toggle */}
          <Field label="Loại giao dịch">
            <div className="flex overflow-hidden rounded-xl border border-slate-200">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => f.update('type', t)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition ${
                    f.form.type === t
                      ? t === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {t === 'expense' ? '↑ Chi tiêu' : '↓ Thu nhập'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Số tiền (VND)">
            <input
              type="text"
              inputMode="numeric"
              value={f.form.amount}
              onChange={(e) => f.update('amount', e.target.value)}
              placeholder="500,000"
              className="form-input text-lg font-semibold"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày">
              <input
                type="date"
                value={f.form.occurredAt}
                onChange={(e) => f.update('occurredAt', e.target.value)}
                className="form-input"
              />
            </Field>
            <div className="form-field">
              <label className="form-label">Phân loại</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={currentParent}
                  onChange={(e) => {
                    const nextParent = e.target.value
                    if (!nextParent) {
                      f.update('category', '')
                      return
                    }
                    const nextChild = (categoryGroups[nextParent] ?? [])[0] ?? ''
                    f.update('category', nextChild ? `${nextParent}/${nextChild}` : `${nextParent}/`)
                  }}
                  className="form-select"
                >
                  <option value="">{hasParentOptions ? 'Chọn loại cha' : 'Chưa có loại cha'}</option>
                  {parentOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={currentChild}
                  onChange={(e) => {
                    const nextChild = e.target.value
                    if (!currentParent || !nextChild) {
                      f.update('category', '')
                      return
                    }
                    f.update('category', `${currentParent}/${nextChild}`)
                  }}
                  className="form-select"
                  disabled={!currentParent}
                >
                  <option value="">
                    {currentParent ? 'Chọn loại con' : 'Chọn loại cha trước'}
                  </option>
                  {childOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Field label="Mô tả / đối tác">
            <input
              value={f.form.merchant}
              onChange={(e) => f.update('merchant', e.target.value)}
              placeholder="Grab, Shopee, siêu thị..."
              className="form-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kênh">
              <select
                value={f.form.channel}
                onChange={(e) => f.update('channel', e.target.value)}
                className="form-select"
              >
                {f.channels.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Nguồn tiền">
              <select
                value={f.form.source}
                onChange={(e) => f.update('source', e.target.value)}
                className="form-select"
              >
                {f.sources.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {f.form.type === 'expense' && (
            <>
              <Field label="Hình thức">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {f.sourceMode === 'bnpl'
                    ? 'Mua trước trả sau (theo cấu hình nguồn tiền)'
                    : 'Trả liền (theo cấu hình nguồn tiền)'}
                </div>
              </Field>
              {f.sourceMode === 'bnpl' && (
                <Field label="Ngày sao kê của nguồn trả sau">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    Ngày {f.sourceStatementDay ?? '—'} hàng tháng
                  </div>
                </Field>
              )}
            </>
          )}

          <Field label="Ghi chú (tuỳ chọn)">
            <input
              value={f.form.note}
              onChange={(e) => f.update('note', e.target.value)}
              className="form-input"
            />
          </Field>

          {f.error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {f.error}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Hủy
          </button>
          <button type="button" onClick={f.submit} className="btn-primary flex-1">
            {f.isEditing ? 'Cập nhật' : 'Lưu giao dịch'}
          </button>
        </div>
      </div>
    </div>
  )
}
