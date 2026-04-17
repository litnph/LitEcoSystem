import { useMemo, useState } from 'react'
import { useSpendingCycle } from '../hooks/useSpendingCycle'
import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'
import { totalInstallmentChargesForPeriod } from '../../../entities'
import { BnplStatementModal } from './BnplStatementModal'
import { IconCheck, IconPlus } from '../../../shared/ui/Icon'
import { usePfmDispatch, usePfmState } from '../../../app/PfmProvider'
import { resolveReferenceDate } from '../../../shared/config/referenceDate'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

function addOneMonth(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function periodIdFromDate(isoDate: string): string {
  if (!isoDate) return ''
  return isoDate.slice(0, 7)
}

function periodNameFromDate(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m] = isoDate.split('-')
  return `Tháng ${Number(m)}/${y}`
}

function PeriodTransactionDropdown({
  title,
  total,
  count,
  rows,
  rightAction,
}: {
  title: string
  total: number
  count: number
  rows: Array<{
    id: string
    occurredAt: string
    merchant: string
    category: string
    amount: number
    manuallyIncluded?: boolean
  }>
  rightAction?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{count} giao dịch</p>
        </div>
        <p className="text-sm font-bold text-slate-800">{currencyVnd(total)}</p>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <p className="text-[11px] text-slate-500">
          {rows.length === 0 ? 'Không có giao dịch cần hiển thị.' : 'Danh sách giao dịch trong kỳ'}
        </p>
        {rightAction}
      </div>
      {open && rows.length > 0 && (
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="data-th">Ngày</th>
              <th className="data-th">Merchant</th>
              <th className="data-th">Danh mục</th>
              <th className="data-th text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="data-tr">
                <td className="data-td text-slate-500">{formatISODateToVi(t.occurredAt)}</td>
                <td className="data-td font-medium text-slate-800">
                  <span className="inline-flex items-center gap-2">
                    {t.merchant}
                    {t.manuallyIncluded && <span className="badge-amber text-[10px]">Thêm tay</span>}
                  </span>
                </td>
                <td className="data-td">
                  <span className="badge-slate">{t.category}</span>
                </td>
                <td className="data-td text-right font-semibold text-slate-800">{currencyVnd(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function SpendingCycleView() {
  const c = useSpendingCycle()
  const state = usePfmState()
  const dispatch = usePfmDispatch()
  const [modal, setModal] = useState<{ providerId: string } | null>(null)
  const [openCreatePeriod, setOpenCreatePeriod] = useState(false)
  const [openEditPeriod, setOpenEditPeriod] = useState(false)
  const [openDeletePeriodConfirm, setOpenDeletePeriodConfirm] = useState(false)
  const [newPeriodId, setNewPeriodId] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newName, setNewName] = useState('')
  const [newPeriodIdTouched, setNewPeriodIdTouched] = useState(false)
  const [newNameTouched, setNewNameTouched] = useState(false)
  const [createPeriodError, setCreatePeriodError] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editName, setEditName] = useState('')
  const [editPeriodError, setEditPeriodError] = useState('')
  const [deletePeriodError, setDeletePeriodError] = useState('')
  const [openCloseConfirm, setOpenCloseConfirm] = useState(false)
  const [pendingUnconfirmStatementId, setPendingUnconfirmStatementId] = useState<string | null>(null)

  const modalCtx = modal
    ? c.bnplByProvider.find((g) => g.provider.id === modal.providerId)
    : null

  const modalInst =
    modalCtx && modalCtx.provider
      ? totalInstallmentChargesForPeriod(
          state.installmentPlans,
          modalCtx.provider.id,
          c.selectedPeriod?.id ?? '',
        )
      : 0

  const modalAdditionalTxs = useMemo(() => {
    if (!modalCtx) return []
    const currentIds = new Set(modalCtx.pendingTxs.map((t) => t.id))
    return state.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.paymentMode === 'bnpl' &&
          t.bnplProviderId === modalCtx.provider.id &&
          !t.installmentConverted &&
          !t.settledInStatementPeriod &&
          !currentIds.has(t.id),
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }, [modalCtx, state.transactions])

  const bnplSummaries = useMemo(
    () =>
      c.bnplByProvider.map((g) => {
        const inst = totalInstallmentChargesForPeriod(
          state.installmentPlans,
          g.provider.id,
          c.selectedPeriod?.id ?? '',
        )
        return {
          ...g,
          inst,
          totalForStatement: g.subtotal + inst,
          needsStatement: !g.stmtExists && g.pendingTxs.length > 0,
        }
      }),
    [c.bnplByProvider, c.selectedPeriod?.id, state.installmentPlans],
  )

  const canCloseMonth =
    !c.existingClose &&
    bnplSummaries.every((g) => !g.needsStatement) &&
    (c.directTxs.length > 0 || c.incomeTxs.length > 0 || c.confirmedForPeriod.length > 0)

  const selectedPeriodName = c.selectedPeriod?.name ?? 'Kỳ chi tiêu'
  const selectedPeriodId = c.selectedPeriod?.id ?? ''
  const currentPeriodId = c.currentPeriod?.id

  const defaultNamePreview = useMemo(() => {
    if (!newEndDate) return ''
    const [y, m] = newEndDate.split('-')
    return `Tháng ${Number(m)}/${y}`
  }, [newEndDate])

  const createPeriodDefaults = useMemo(() => {
    const ref = resolveReferenceDate(state.calendarRules.referenceDateIso)
    if (c.periods.length === 0) {
      const [y, m] = ref.split('-').map(Number)
      const last = new Date(y, m, 0)
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`
      const endDate = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
      return {
        startDate,
        endDate,
        id: periodIdFromDate(endDate),
        name: periodNameFromDate(endDate),
      }
    }
    const latestEnd = c.periods.reduce((max, p) => (p.endDate > max ? p.endDate : max), c.periods[0]!.endDate)
    const startDate = addOneMonth(latestEnd)
    const endDate = startDate
    return {
      startDate,
      endDate,
      id: periodIdFromDate(endDate),
      name: periodNameFromDate(endDate),
    }
  }, [c.periods, state.calendarRules.referenceDateIso])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* ── Cột trái: danh sách kỳ ── */}
        <aside className="card h-fit overflow-hidden p-0 lg:sticky lg:top-[88px]">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kỳ chi tiêu
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Sao kê thẻ: chốt ngày {c.cycleDay} mỗi tháng (khoảng {c.cycleDay + 1} tháng trước → {c.cycleDay}{' '}
              tháng này, theo ngày giao dịch).
            </p>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Gợi ý ngân sách: lương thường {state.calendarRules.salaryFromDay}–{state.calendarRules.salaryToDay}{' '}
              · Hạn trả thẻ ngày {state.calendarRules.paymentDueDay} tháng sau kỳ sao kê (chỉnh trong Cấu hình).
            </p>
            <button
              type="button"
              onClick={() => {
                setCreatePeriodError('')
                setNewStartDate(createPeriodDefaults.startDate)
                setNewEndDate(createPeriodDefaults.endDate)
                setNewPeriodId(createPeriodDefaults.id)
                setNewName(createPeriodDefaults.name)
                setNewPeriodIdTouched(false)
                setNewNameTouched(false)
                setOpenCreatePeriod(true)
              }}
              className="btn-ghost btn-sm mt-2 w-full"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Thêm kỳ
            </button>
          </div>
          <ul className="max-h-[min(70vh,520px)] divide-y divide-slate-100 overflow-y-auto">
            {c.periods.map((p) => {
              const openBnpl = c.bnplByProvider.reduce((n, g) => {
                if (p.id !== c.selectedPeriod?.id) return n
                return n + (g.stmtExists ? 0 : g.pendingTxs.length > 0 ? 1 : 0)
              }, 0)
              const isSel = p.id === c.selectedPeriod?.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => c.setSelectedPeriodId(p.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                      isSel ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isSel ? 'text-blue-800' : 'text-slate-800'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatISODateToVi(p.startDate)} - {formatISODateToVi(p.endDate)}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {p.id === currentPeriodId && (
                        <span className="badge-blue text-[10px]">Kỳ hiện tại</span>
                      )}
                    </span>
                    {isSel && openBnpl > 0 && (
                      <span className="text-[10px] text-amber-700">{openBnpl} nguồn BNPL còn giao dịch mở</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* ── Cột phải: chi tiết ── */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedPeriodName}</h2>
                <p className="text-xs text-slate-400">
                  Thu / chi trực tiếp theo cùng chu kỳ · Nhiều sao kê BNPL có thể chốt trong một kỳ
                </p>
                {c.selectedPeriod && (
                  <p className="mt-1 text-xs text-slate-500">
                    Khoảng thời gian: {formatISODateToVi(c.selectedPeriod.startDate)} - {formatISODateToVi(c.selectedPeriod.endDate)}
                  </p>
                )}
                {c.selectedPeriod && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setEditPeriodError('')
                        setEditName(c.selectedPeriod?.name ?? '')
                        setEditStartDate(c.selectedPeriod?.startDate ?? '')
                        setEditEndDate(c.selectedPeriod?.endDate ?? '')
                        setOpenEditPeriod(true)
                      }}
                    >
                      Sửa kỳ
                    </button>
                    {!c.existingClose && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => {
                          setDeletePeriodError('')
                          setOpenDeletePeriodConfirm(true)
                        }}
                      >
                        Xóa kỳ
                      </button>
                    )}
                  </div>
                )}
              </div>
              {c.existingClose ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <IconCheck className="h-3.5 w-3.5" />
                  Đã chốt chi tiêu tháng
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Chưa chốt chi tiêu tháng
                </span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-50 p-3">
                <dt className="text-[10px] font-semibold uppercase text-emerald-600">Thu nhập</dt>
                <dd className="text-sm font-bold text-emerald-700">+{currencyVnd(c.totalIncome)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[10px] font-semibold uppercase text-slate-500">Chi trực tiếp</dt>
                <dd className="text-sm font-bold text-slate-800">{currencyVnd(c.totalDirect)}</dd>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <dt className="text-[10px] font-semibold uppercase text-rose-500">Sao kê BNPL (đã chốt)</dt>
                <dd className="text-sm font-bold text-rose-600">{currencyVnd(c.totalBnpl)}</dd>
              </div>
              <div className={`rounded-xl p-3 ${c.net >= 0 ? 'bg-blue-50' : 'bg-rose-50'}`}>
                <dt className="text-[10px] font-semibold uppercase text-slate-600">Còn lại</dt>
                <dd className={`text-sm font-bold ${c.net >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                  {c.net >= 0 ? '+' : ''}
                  {currencyVnd(c.net)}
                </dd>
              </div>
            </dl>

            {!c.existingClose && (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  disabled={!canCloseMonth}
                  onClick={() => setOpenCloseConfirm(true)}
                  className="btn-primary w-full sm:w-auto disabled:opacity-50"
                >
                  Chốt chi tiêu kỳ này
                </button>
                {!bnplSummaries.every((g) => !g.needsStatement) && (
                  <p className="text-xs text-amber-700">
                    Cần xác nhận toàn bộ sao kê trả sau trong kỳ trước khi chốt kỳ chi tiêu.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card space-y-3 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Chi tiết kỳ chi tiêu</h3>
            {c.directTxs.length > 0 && (
              <PeriodTransactionDropdown
                title="Giao dịch trực tiếp"
                total={c.totalDirect}
                count={c.directTxs.length}
                rows={c.directTxs.map((t) => ({
                  id: t.id,
                  occurredAt: t.occurredAt,
                  merchant: t.merchant,
                  category: t.category,
                  amount: t.amount,
                }))}
              />
            )}
            {bnplSummaries.filter((g) => g.txs.length > 0).map((g) => (
              <PeriodTransactionDropdown
                key={g.provider.id}
                title={g.provider.name}
                total={g.totalForStatement}
                count={g.txs.length}
                rows={g.txs.map((t) => ({
                  id: t.id,
                  occurredAt: t.occurredAt,
                  merchant: t.merchant,
                  category: t.category,
                  amount: t.amount,
                  manuallyIncluded: t.manuallyIncludedInStatementPeriod === (c.selectedPeriod?.id ?? ''),
                }))}
                rightAction={
                  g.stmtExists ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {g.stmtStatus === 'paid' ? 'Đã chốt · Đã thanh toán' : 'Đã chốt · Chưa thanh toán'}
                      </span>
                      {g.stmtStatus !== 'paid' && !c.existingClose && (
                        <button
                          type="button"
                          className="btn-ghost btn-sm text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            const stmt = c.confirmedForPeriod.find(
                              (x) => x.providerId === g.provider.id && x.period === (c.selectedPeriod?.id ?? ''),
                            )
                            if (stmt) setPendingUnconfirmStatementId(stmt.id)
                          }}
                        >
                          Hoàn xác nhận
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={!g.needsStatement}
                      onClick={() => setModal({ providerId: g.provider.id })}
                    >
                      Xác nhận sao kê
                    </button>
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>

      {modalCtx && modal && (
        <BnplStatementModal
          open
          readonly={false}
          provider={modalCtx.provider}
          period={c.selectedPeriod?.id ?? ''}
          transactions={modalCtx.pendingTxs}
          additionalTransactions={modalAdditionalTxs}
          installmentCharges={modalInst}
          onClose={() => setModal(null)}
          onConfirm={(includeIds, deferIds) =>
            c.confirmBnplWithDeferrals(
              modalCtx.provider.id,
              modalCtx.provider.statementDay,
              includeIds,
              deferIds,
            )
          }
        />
      )}

      <ConfirmDialog
        open={openCloseConfirm}
        title="Xác nhận chốt kỳ chi tiêu"
        message={`Bạn muốn chốt "${selectedPeriodName}" với dữ liệu hiện tại?`}
        confirmText="Chốt kỳ"
        onCancel={() => setOpenCloseConfirm(false)}
        onConfirm={() => {
          c.closeMonth()
          setOpenCloseConfirm(false)
        }}
      />

      <ConfirmDialog
        open={!!pendingUnconfirmStatementId}
        title="Hoàn xác nhận sao kê"
        message="Bạn muốn hoàn xác nhận sao kê này? Các giao dịch trong sao kê sẽ quay lại trạng thái chưa chốt."
        confirmText="Hoàn xác nhận"
        onCancel={() => setPendingUnconfirmStatementId(null)}
        onConfirm={() => {
          if (pendingUnconfirmStatementId) {
            dispatch({
              type: 'UNCONFIRM_STATEMENT',
              payload: { statementId: pendingUnconfirmStatementId },
            })
          }
          setPendingUnconfirmStatementId(null)
        }}
      />

      {openCreatePeriod && (
        <div className="modal-backdrop" onClick={() => setOpenCreatePeriod(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">Tạo kỳ chi tiêu</h3>
            <div className="mt-4 space-y-3">
              <div className="form-field">
                <label className="form-label">Mã kỳ (duy nhất)</label>
                <input
                  value={newPeriodId}
                  onChange={(e) => {
                    setNewPeriodId(e.target.value)
                    setNewPeriodIdTouched(true)
                    if (createPeriodError) setCreatePeriodError('')
                  }}
                  placeholder="VD: 2026-06"
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Tên kỳ (mặc định theo tháng/năm)</label>
                <input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    setNewNameTouched(true)
                    if (createPeriodError) setCreatePeriodError('')
                  }}
                  placeholder={defaultNamePreview || 'Tháng X/YYYY'}
                  className="form-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-field">
                  <label className="form-label">Từ ngày</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => {
                      const nextStart = e.target.value
                      setNewStartDate(nextStart)
                      if (!newPeriodIdTouched) {
                        setNewPeriodId(periodIdFromDate(nextStart))
                      }
                      if (!newNameTouched) {
                        setNewName(periodNameFromDate(nextStart))
                      }
                      if (createPeriodError) setCreatePeriodError('')
                    }}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Đến ngày</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => {
                      const nextEnd = e.target.value
                      setNewEndDate(nextEnd)
                      if (!newPeriodIdTouched) {
                        setNewPeriodId(periodIdFromDate(nextEnd))
                      }
                      if (!newNameTouched) {
                        setNewName(periodNameFromDate(nextEnd))
                      }
                      if (createPeriodError) setCreatePeriodError('')
                    }}
                    className="form-input"
                  />
                </div>
              </div>
              {createPeriodError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {createPeriodError}
                </p>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  setOpenCreatePeriod(false)
                  setCreatePeriodError('')
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  const result = c.addSpendingPeriod({
                    id: newPeriodId.trim(),
                    name: newName.trim(),
                    startDate: newStartDate,
                    endDate: newEndDate,
                  })
                  if (!result.ok) {
                    setCreatePeriodError(result.error)
                    return
                  }
                  setOpenCreatePeriod(false)
                  setCreatePeriodError('')
                  setNewPeriodId('')
                  setNewStartDate('')
                  setNewEndDate('')
                  setNewName('')
                  setNewPeriodIdTouched(false)
                  setNewNameTouched(false)
                }}
              >
                Lưu kỳ
              </button>
            </div>
          </div>
        </div>
      )}

      {openEditPeriod && c.selectedPeriod && (
        <div className="modal-backdrop" onClick={() => setOpenEditPeriod(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">Chỉnh sửa kỳ chi tiêu</h3>
            <div className="mt-4 space-y-3">
              <div className="form-field">
                <label className="form-label">Mã kỳ</label>
                <input value={c.selectedPeriod.id} className="form-input bg-slate-50" disabled />
              </div>
              <div className="form-field">
                <label className="form-label">Tên kỳ</label>
                <input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value)
                    if (editPeriodError) setEditPeriodError('')
                  }}
                  className="form-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-field">
                  <label className="form-label">Từ ngày</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => {
                      setEditStartDate(e.target.value)
                      if (editPeriodError) setEditPeriodError('')
                    }}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Đến ngày</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => {
                      setEditEndDate(e.target.value)
                      if (editPeriodError) setEditPeriodError('')
                    }}
                    className="form-input"
                  />
                </div>
              </div>
              {editPeriodError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {editPeriodError}
                </p>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setOpenEditPeriod(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  const result = c.updateSpendingPeriod({
                    id: c.selectedPeriod?.id ?? '',
                    name: editName.trim(),
                    startDate: editStartDate,
                    endDate: editEndDate,
                  })
                  if (!result.ok) {
                    setEditPeriodError(result.error)
                    return
                  }
                  setOpenEditPeriod(false)
                }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {openDeletePeriodConfirm && (
        <div className="modal-backdrop" onClick={() => setOpenDeletePeriodConfirm(false)}>
          <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">Xóa kỳ chi tiêu</h3>
            <p className="mt-2 text-sm text-slate-500">
              Bạn muốn xóa kỳ "{selectedPeriodName}"? Thao tác này không thể hoàn tác.
            </p>
            {deletePeriodError && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {deletePeriodError}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  setOpenDeletePeriodConfirm(false)
                  setDeletePeriodError('')
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger flex-1"
                onClick={() => {
                  const result = c.removeSpendingPeriod(selectedPeriodId)
                  if (!result.ok) {
                    setDeletePeriodError(result.error)
                    return
                  }
                  setOpenDeletePeriodConfirm(false)
                  setOpenEditPeriod(false)
                  setOpenCloseConfirm(false)
                  setModal(null)
                  setDeletePeriodError('')
                }}
              >
                Xóa kỳ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
