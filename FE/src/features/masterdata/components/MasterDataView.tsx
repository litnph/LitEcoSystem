import { useMemo, useState } from 'react'
import { usePfm } from '../../../app/PfmProvider'
import { IconPlus, IconX } from '../../../shared/ui/Icon'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

type SourceMode = 'direct' | 'bnpl'

function UpsertModal({
  open,
  title,
  children,
  confirmText,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  children: React.ReactNode
  confirmText: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <div className="mt-4 space-y-3">{children}</div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            Hủy
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary flex-1">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryPanel() {
  const { state, dispatch } = usePfm()
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [parent, setParent] = useState('Ăn uống')
  const [child, setChild] = useState('')
  const [editOld, setEditOld] = useState('')
  const [editParent, setEditParent] = useState('Ăn uống')
  const [editChild, setEditChild] = useState('')

  const parentOptions = useMemo(() => {
    const s = new Set(state.categories.map((x) => x.split('/')[0] || 'Khác'))
    return Array.from(s)
  }, [state.categories])

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {}
    state.categories.forEach((item) => {
      const [p, c] = item.split('/')
      const parentKey = p || 'Khác'
      const childVal = c || item
      if (!map[parentKey]) map[parentKey] = []
      map[parentKey].push(childVal)
    })
    return map
  }, [state.categories])

  const addCategory = () => {
    if (!child.trim()) return
    dispatch({
      type: 'ADD_MASTER_ITEM',
      payload: { list: 'categories', value: `${parent.trim()}/${child.trim()}` },
    })
    setOpenAdd(false)
    setChild('')
  }

  const saveEdit = () => {
    if (!editOld || !editChild.trim()) return
    dispatch({
      type: 'RENAME_MASTER_ITEM',
      payload: { list: 'categories', old: editOld, next: `${editParent.trim()}/${editChild.trim()}` },
    })
    setOpenEdit(false)
    setEditOld('')
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Phân loại chi tiêu</h3>
          <p className="mt-0.5 text-xs text-slate-400">Danh mục 2 lớp: Cha / Con</p>
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={() => setOpenAdd(true)}>
          <IconPlus className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {Object.entries(grouped).map(([p, children]) => (
          <div key={p} className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">{p}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {children.map((c) => {
                const full = `${p}/${c}`
                return (
                  <span key={full} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                    {c}
                    <button
                      type="button"
                      className="text-slate-400 hover:text-blue-600"
                      onClick={() => {
                        setEditOld(full)
                        setEditParent(p)
                        setEditChild(c)
                        setOpenEdit(true)
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => setPendingDelete(full)}
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <UpsertModal
        open={openAdd}
        title="Thêm phân loại chi tiêu"
        confirmText="Lưu"
        onCancel={() => setOpenAdd(false)}
        onConfirm={addCategory}
      >
        <div className="form-field">
          <label className="form-label">Loại cha</label>
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="form-select">
            {parentOptions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Loại con</label>
          <input value={child} onChange={(e) => setChild(e.target.value)} className="form-input" />
        </div>
      </UpsertModal>

      <UpsertModal
        open={openEdit}
        title="Sửa phân loại chi tiêu"
        confirmText="Lưu thay đổi"
        onCancel={() => setOpenEdit(false)}
        onConfirm={saveEdit}
      >
        <div className="form-field">
          <label className="form-label">Loại cha</label>
          <select value={editParent} onChange={(e) => setEditParent(e.target.value)} className="form-select">
            {parentOptions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Loại con</label>
          <input value={editChild} onChange={(e) => setEditChild(e.target.value)} className="form-input" />
        </div>
      </UpsertModal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Bạn chắc chắn muốn xoá không?"
        message={pendingDelete ? `Xóa phân loại "${pendingDelete}"?` : ''}
        tone="danger"
        confirmText="Xóa"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            dispatch({ type: 'REMOVE_MASTER_ITEM', payload: { list: 'categories', value: pendingDelete } })
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function SourcePanel() {
  const { state, dispatch } = usePfm()
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [mode, setMode] = useState<SourceMode>('direct')
  const [statementDay, setStatementDay] = useState(20)
  const [dueDay, setDueDay] = useState(5)
  const [editOldName, setEditOldName] = useState('')

  const resetForm = () => {
    setName('')
    setMode('direct')
    setStatementDay(20)
    setDueDay(5)
  }

  const addSource = () => {
    const nextName = name.trim()
    if (!nextName) return
    dispatch({ type: 'ADD_MASTER_ITEM', payload: { list: 'paymentSources', value: nextName } })
    dispatch({ type: 'SET_PAYMENT_SOURCE_MODE', payload: { source: nextName, mode } })
    if (mode === 'bnpl') {
      dispatch({ type: 'SET_PAYMENT_SOURCE_STATEMENT_DAY', payload: { source: nextName, statementDay } })
      dispatch({ type: 'SET_PAYMENT_SOURCE_DUE_DAY', payload: { source: nextName, dueDay } })
    }
    setOpenAdd(false)
    resetForm()
  }

  const saveEdit = () => {
    const nextName = name.trim()
    if (!editOldName || !nextName) return
    if (editOldName !== nextName) {
      dispatch({
        type: 'RENAME_MASTER_ITEM',
        payload: { list: 'paymentSources', old: editOldName, next: nextName },
      })
    }
    dispatch({ type: 'SET_PAYMENT_SOURCE_MODE', payload: { source: nextName, mode } })
    dispatch({
      type: 'SET_PAYMENT_SOURCE_STATEMENT_DAY',
      payload: { source: nextName, statementDay: mode === 'bnpl' ? statementDay : null },
    })
    dispatch({
      type: 'SET_PAYMENT_SOURCE_DUE_DAY',
      payload: { source: nextName, dueDay: mode === 'bnpl' ? dueDay : null },
    })
    setOpenEdit(false)
    resetForm()
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Nguồn tiền</h3>
          <p className="mt-0.5 text-xs text-slate-400">Tên hiển thị, loại nguồn, ngày sao kê, hạn thanh toán</p>
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={() => setOpenAdd(true)}>
          <IconPlus className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {state.paymentSources.map((src) => {
          const m = state.paymentSourceModes[src] ?? 'direct'
          const sd = state.paymentSourceStatementDays[src]
          const dd = state.paymentSourceDueDays[src]
          return (
            <li key={src} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium text-slate-800">{src}</span>
                <span className={`badge ${m === 'bnpl' ? 'badge-blue' : 'badge-slate'}`}>
                  {m === 'bnpl' ? 'Trả sau' : 'Trực tiếp'}
                </span>
                {m === 'bnpl' && (
                  <>
                    <span className="badge-amber">Sao kê {sd ?? '—'}</span>
                    <span className="badge-green">Hạn {dd ?? '—'}</span>
                  </>
                )}
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-blue-600"
                  onClick={() => {
                    setEditOldName(src)
                    setName(src)
                    setMode(m)
                    setStatementDay(sd ?? 20)
                    setDueDay(dd ?? 5)
                    setOpenEdit(true)
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                  onClick={() => setPendingDelete(src)}
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <UpsertModal
        open={openAdd}
        title="Thêm nguồn tiền"
        confirmText="Lưu"
        onCancel={() => setOpenAdd(false)}
        onConfirm={addSource}
      >
        <div className="form-field">
          <label className="form-label">Tên hiển thị</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Loại nguồn</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as SourceMode)} className="form-select">
            <option value="direct">Trực tiếp</option>
            <option value="bnpl">Trả sau</option>
          </select>
        </div>
        {mode === 'bnpl' && (
          <>
            <div className="form-field">
              <label className="form-label">Ngày sao kê</label>
              <input type="number" min={1} max={28} value={statementDay} onChange={(e) => setStatementDay(Number(e.target.value))} className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label">Hạn thanh toán</label>
              <input type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="form-input" />
            </div>
          </>
        )}
      </UpsertModal>

      <UpsertModal
        open={openEdit}
        title="Sửa nguồn tiền"
        confirmText="Lưu thay đổi"
        onCancel={() => setOpenEdit(false)}
        onConfirm={saveEdit}
      >
        <div className="form-field">
          <label className="form-label">Tên hiển thị</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Loại nguồn</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as SourceMode)} className="form-select">
            <option value="direct">Trực tiếp</option>
            <option value="bnpl">Trả sau</option>
          </select>
        </div>
        {mode === 'bnpl' && (
          <>
            <div className="form-field">
              <label className="form-label">Ngày sao kê</label>
              <input type="number" min={1} max={28} value={statementDay} onChange={(e) => setStatementDay(Number(e.target.value))} className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label">Hạn thanh toán</label>
              <input type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="form-input" />
            </div>
          </>
        )}
      </UpsertModal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Bạn chắc chắn muốn xoá không?"
        message={pendingDelete ? `Xóa nguồn tiền "${pendingDelete}"?` : ''}
        tone="danger"
        confirmText="Xóa"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            dispatch({ type: 'REMOVE_MASTER_ITEM', payload: { list: 'paymentSources', value: pendingDelete } })
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function ChannelTagPanel() {
  const { state, dispatch } = usePfm()
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [oldValue, setOldValue] = useState('')

  const addTag = () => {
    if (!value.trim()) return
    dispatch({ type: 'ADD_MASTER_ITEM', payload: { list: 'paymentChannels', value: value.trim() } })
    setOpenAdd(false)
    setValue('')
  }

  const saveTag = () => {
    if (!oldValue || !value.trim()) return
    dispatch({
      type: 'RENAME_MASTER_ITEM',
      payload: { list: 'paymentChannels', old: oldValue, next: value.trim() },
    })
    setOpenEdit(false)
    setValue('')
    setOldValue('')
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Kênh thanh toán</h3>
          <p className="mt-0.5 text-xs text-slate-400">Hiển thị dạng tag</p>
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={() => setOpenAdd(true)}>
          <IconPlus className="h-3.5 w-3.5" />
          Thêm tag
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {state.paymentChannels.map((ch) => (
          <span key={ch} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
            {ch}
            <button
              type="button"
              className="text-slate-400 hover:text-blue-600"
              onClick={() => {
                setOldValue(ch)
                setValue(ch)
                setOpenEdit(true)
              }}
            >
              ✎
            </button>
            <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => setPendingDelete(ch)}>
              ×
            </button>
          </span>
        ))}
      </div>

      <UpsertModal open={openAdd} title="Thêm tag kênh thanh toán" confirmText="Lưu" onCancel={() => setOpenAdd(false)} onConfirm={addTag}>
        <div className="form-field">
          <label className="form-label">Tên tag</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="form-input" />
        </div>
      </UpsertModal>

      <UpsertModal open={openEdit} title="Sửa tag kênh thanh toán" confirmText="Lưu thay đổi" onCancel={() => setOpenEdit(false)} onConfirm={saveTag}>
        <div className="form-field">
          <label className="form-label">Tên tag</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="form-input" />
        </div>
      </UpsertModal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Bạn chắc chắn muốn xoá không?"
        message={pendingDelete ? `Xóa tag "${pendingDelete}"?` : ''}
        tone="danger"
        confirmText="Xóa"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            dispatch({ type: 'REMOVE_MASTER_ITEM', payload: { list: 'paymentChannels', value: pendingDelete } })
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function StoragePanel() {
  const { state, dispatch } = usePfm()
  const [openConfirmClear, setOpenConfirmClear] = useState(false)
  const [openConfirmClearCycle, setOpenConfirmClearCycle] = useState(false)
  const dataSize = (() => {
    try {
      return (JSON.stringify(state).length / 1024).toFixed(1) + ' KB'
    } catch {
      return '—'
    }
  })()

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900">Lưu trữ & sao lưu</h3>
      <p className="mt-1 text-xs text-slate-400">Dữ liệu tự động lưu vào LocalStorage của trình duyệt.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-600">Kích thước dữ liệu</p>
          <p className="text-lg font-bold text-blue-800">{dataSize}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pfm-backup-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="btn-ghost flex-1"
        >
          Xuất JSON
        </button>
        <button type="button" onClick={() => setOpenConfirmClearCycle(true)} className="btn-ghost flex-1 btn-sm py-2.5">
          Clear data kỳ
        </button>
        <button type="button" onClick={() => setOpenConfirmClear(true)} className="btn-danger flex-1 btn-sm py-2.5">
          Xoá dữ liệu
        </button>
      </div>
      <ConfirmDialog
        open={openConfirmClearCycle}
        title="Bạn chắc chắn muốn xoá không?"
        message="Sẽ xoá toàn bộ kỳ chi tiêu, kỳ đã chốt và dữ liệu sao kê. Giao dịch Thu/Chi vẫn giữ nguyên."
        tone="danger"
        confirmText="Clear data kỳ"
        onCancel={() => setOpenConfirmClearCycle(false)}
        onConfirm={() => {
          dispatch({ type: 'CLEAR_CYCLE_DATA' })
          setOpenConfirmClearCycle(false)
        }}
      />
      <ConfirmDialog
        open={openConfirmClear}
        title="Bạn chắc chắn muốn xoá không?"
        message="Dữ liệu LocalStorage sẽ bị xoá và trang sẽ tải lại. Thao tác này không thể hoàn tác."
        tone="danger"
        confirmText="Xoá dữ liệu"
        onCancel={() => setOpenConfirmClear(false)}
        onConfirm={() => {
          localStorage.removeItem('pfm-v1')
          window.location.reload()
        }}
      />
    </div>
  )
}

export function MasterDataView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Cấu hình</h2>
        <p className="text-xs text-slate-400">Nguồn tiền, phân loại chi tiêu, kênh thanh toán và lưu trữ dữ liệu</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <CategoryPanel />
        <SourcePanel />
      </div>
      <ChannelTagPanel />
      <StoragePanel />
    </div>
  )
}
