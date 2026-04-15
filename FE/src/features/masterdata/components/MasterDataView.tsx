import { useMemo, useState } from 'react'
import { usePfm } from '../../../app/PfmProvider'
import { IconPlus, IconX } from '../../../shared/ui/Icon'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

type SourceMode = 'direct' | 'bnpl'
type TabId = 'categories' | 'sources' | 'channels'

/* ─── Reusable modal ─── */
function UpsertModal({
  open, title, children, confirmText, onCancel, onConfirm,
}: {
  open: boolean; title: string; children: React.ReactNode
  confirmText: string; onCancel: () => void; onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <div className="mt-4 space-y-3">{children}</div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">Hủy</button>
          <button type="button" onClick={onConfirm} className="btn-primary flex-1">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Icon edit / delete ─── */
function BtnEdit({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" title="Sửa" onClick={onClick}
      className="rounded-md p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    </button>
  )
}
function BtnDelete({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" title="Xóa" onClick={onClick}
      className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
      <IconX className="h-3.5 w-3.5" />
    </button>
  )
}

/* ════════════════════════════════════════
   TAB: Phân loại chi tiêu
════════════════════════════════════════ */
function CategoryPanel() {
  const { state, dispatch } = usePfm()
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [parent, setParent] = useState('')
  const [newParent, setNewParent] = useState('')
  const [child, setChild] = useState('')
  const [editOld, setEditOld] = useState('')
  const [editParent, setEditParent] = useState('')
  const [editChild, setEditChild] = useState('')

  const parentOptions = useMemo(
    () => Array.from(new Set(state.categories.map((x) => x.split('/')[0] || 'Khác'))),
    [state.categories],
  )

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {}
    state.categories.forEach((item) => {
      const [p, c] = item.split('/')
      const pk = p || 'Khác'; const cv = c || item
      if (!map[pk]) map[pk] = []
      map[pk].push(cv)
    })
    return map
  }, [state.categories])

  const addCategory = () => {
    const p = (newParent.trim() || parent.trim())
    if (!p || !child.trim()) return
    dispatch({ type: 'ADD_MASTER_ITEM', payload: { list: 'categories', value: `${p}/${child.trim()}` } })
    setOpenAdd(false); setChild(''); setNewParent('')
  }

  const saveEdit = () => {
    if (!editOld || !editChild.trim()) return
    dispatch({ type: 'RENAME_MASTER_ITEM', payload: { list: 'categories', old: editOld, next: `${editParent.trim()}/${editChild.trim()}` } })
    setOpenEdit(false); setEditOld('')
  }

  const totalCount = state.categories.length

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {totalCount > 0 ? `${totalCount} phân loại trong ${parentOptions.length} nhóm` : 'Chưa có phân loại nào'}
        </p>
        <button type="button" className="btn-primary btn-sm"
          onClick={() => { setParent(parentOptions[0] ?? ''); setChild(''); setNewParent(''); setOpenAdd(true) }}>
          <IconPlus className="h-3.5 w-3.5" /> Thêm phân loại
        </button>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-14">
          <span className="text-3xl">🗂️</span>
          <p className="text-sm font-medium text-slate-500">Chưa có phân loại nào</p>
          <button type="button" className="btn-ghost btn-sm"
            onClick={() => { setParent(''); setChild(''); setNewParent(''); setOpenAdd(true) }}>
            <IconPlus className="h-3.5 w-3.5" /> Tạo phân loại đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).map(([p, children]) => (
            <div key={p} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* group header */}
              <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60 px-4 py-2.5">
                <span className="flex-1 text-xs font-bold uppercase tracking-widest text-slate-600">{p}</span>
                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  {children.length}
                </span>
              </div>
              {/* child tags */}
              <div className="flex flex-wrap gap-1.5 p-3">
                {children.map((c) => {
                  const full = `${p}/${c}`
                  return (
                    <span key={full}
                      className="group inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60">
                      {c}
                      <span className="flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <BtnEdit onClick={() => { setEditOld(full); setEditParent(p); setEditChild(c); setOpenEdit(true) }} />
                        <BtnDelete onClick={() => setPendingDelete(full)} />
                      </span>
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <UpsertModal open={openAdd} title="Thêm phân loại" confirmText="Lưu" onCancel={() => setOpenAdd(false)} onConfirm={addCategory}>
        <div className="form-field">
          <label className="form-label">Loại cha (có sẵn)</label>
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="form-select">
            {parentOptions.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Hoặc tạo loại cha mới</label>
          <input value={newParent} onChange={(e) => setNewParent(e.target.value)}
            placeholder="Bỏ trống nếu dùng loại cha có sẵn" className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Tên loại con</label>
          <input value={child} onChange={(e) => setChild(e.target.value)} placeholder="VD: Xăng xe, Đi chợ..." className="form-input" />
        </div>
      </UpsertModal>

      <UpsertModal open={openEdit} title="Sửa phân loại" confirmText="Lưu thay đổi" onCancel={() => setOpenEdit(false)} onConfirm={saveEdit}>
        <div className="form-field">
          <label className="form-label">Loại cha</label>
          <input value={editParent} onChange={(e) => setEditParent(e.target.value)} className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Loại con</label>
          <input value={editChild} onChange={(e) => setEditChild(e.target.value)} className="form-input" />
        </div>
      </UpsertModal>

      <ConfirmDialog open={!!pendingDelete} title="Xác nhận xóa phân loại"
        message={pendingDelete ? `Xóa phân loại "${pendingDelete}"?` : ''}
        tone="danger" confirmText="Xóa"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch({ type: 'REMOVE_MASTER_ITEM', payload: { list: 'categories', value: pendingDelete } })
          setPendingDelete(null)
        }} />
    </div>
  )
}

/* ════════════════════════════════════════
   TAB: Nguồn tiền
════════════════════════════════════════ */
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

  const resetForm = () => { setName(''); setMode('direct'); setStatementDay(20); setDueDay(5) }

  const addSource = () => {
    const n = name.trim(); if (!n) return
    dispatch({ type: 'ADD_MASTER_ITEM', payload: { list: 'paymentSources', value: n } })
    dispatch({ type: 'SET_PAYMENT_SOURCE_MODE', payload: { source: n, mode } })
    if (mode === 'bnpl') {
      dispatch({ type: 'SET_PAYMENT_SOURCE_STATEMENT_DAY', payload: { source: n, statementDay } })
      dispatch({ type: 'SET_PAYMENT_SOURCE_DUE_DAY', payload: { source: n, dueDay } })
    }
    setOpenAdd(false); resetForm()
  }

  const saveEdit = () => {
    const n = name.trim(); if (!editOldName || !n) return
    if (editOldName !== n) dispatch({ type: 'RENAME_MASTER_ITEM', payload: { list: 'paymentSources', old: editOldName, next: n } })
    dispatch({ type: 'SET_PAYMENT_SOURCE_MODE', payload: { source: n, mode } })
    dispatch({ type: 'SET_PAYMENT_SOURCE_STATEMENT_DAY', payload: { source: n, statementDay: mode === 'bnpl' ? statementDay : null } })
    dispatch({ type: 'SET_PAYMENT_SOURCE_DUE_DAY', payload: { source: n, dueDay: mode === 'bnpl' ? dueDay : null } })
    setOpenEdit(false); resetForm()
  }

  const bnplFields = (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-3">
      <p className="text-xs font-semibold text-blue-700">Cấu hình trả sau</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-field">
          <label className="form-label">Ngày sao kê</label>
          <input type="number" min={1} max={28} value={statementDay}
            onChange={(e) => setStatementDay(Number(e.target.value))} className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Hạn thanh toán</label>
          <input type="number" min={1} max={28} value={dueDay}
            onChange={(e) => setDueDay(Number(e.target.value))} className="form-input" />
        </div>
      </div>
    </div>
  )

  const directSources = state.paymentSources.filter((s) => (state.paymentSourceModes[s] ?? 'direct') === 'direct')
  const bnplSources = state.paymentSources.filter((s) => state.paymentSourceModes[s] === 'bnpl')

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {state.paymentSources.length > 0
            ? `${state.paymentSources.length} nguồn · ${directSources.length} trực tiếp · ${bnplSources.length} trả sau`
            : 'Chưa có nguồn tiền nào'}
        </p>
        <button type="button" className="btn-primary btn-sm" onClick={() => { resetForm(); setOpenAdd(true) }}>
          <IconPlus className="h-3.5 w-3.5" /> Thêm nguồn tiền
        </button>
      </div>

      {state.paymentSources.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-14">
          <span className="text-3xl">💳</span>
          <p className="text-sm font-medium text-slate-500">Chưa có nguồn tiền nào</p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => { resetForm(); setOpenAdd(true) }}>
            <IconPlus className="h-3.5 w-3.5" /> Thêm nguồn tiền đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Direct */}
          {directSources.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Trực tiếp</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {directSources.map((src) => (
                  <div key={src}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                      {src[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 truncate text-sm font-semibold text-slate-800">{src}</span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <BtnEdit onClick={() => {
                        setEditOldName(src); setName(src)
                        setMode('direct'); setStatementDay(20); setDueDay(5); setOpenEdit(true)
                      }} />
                      <BtnDelete onClick={() => setPendingDelete(src)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BNPL */}
          {bnplSources.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Trả sau (BNPL)</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {bnplSources.map((src) => {
                  const sd = state.paymentSourceStatementDays[src]
                  const dd = state.paymentSourceDueDays[src]
                  return (
                    <div key={src}
                      className="rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm transition hover:shadow">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
                          {src[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 truncate text-sm font-semibold text-slate-800">{src}</span>
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">BNPL</span>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <BtnEdit onClick={() => {
                            setEditOldName(src); setName(src); setMode('bnpl')
                            setStatementDay(sd ?? 20); setDueDay(dd ?? 5); setOpenEdit(true)
                          }} />
                          <BtnDelete onClick={() => setPendingDelete(src)} />
                        </div>
                      </div>
                      <div className="mt-2 flex gap-3 border-t border-blue-100 pt-2">
                        <span className="text-[11px] text-slate-500">Sao kê ngày <strong className="text-slate-700">{sd ?? '—'}</strong></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500">Hạn ngày <strong className="text-slate-700">{dd ?? '—'}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <UpsertModal open={openAdd} title="Thêm nguồn tiền" confirmText="Lưu" onCancel={() => setOpenAdd(false)} onConfirm={addSource}>
        <div className="form-field">
          <label className="form-label">Tên hiển thị</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Cash, Vietcombank, Techcombank..." className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Loại nguồn</label>
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            {(['direct', 'bnpl'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setMode(t)}
                className={`flex-1 py-2 text-sm font-semibold transition ${mode === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {t === 'direct' ? 'Trực tiếp' : 'Trả sau (BNPL)'}
              </button>
            ))}
          </div>
        </div>
        {mode === 'bnpl' && bnplFields}
      </UpsertModal>

      <UpsertModal open={openEdit} title="Sửa nguồn tiền" confirmText="Lưu thay đổi" onCancel={() => setOpenEdit(false)} onConfirm={saveEdit}>
        <div className="form-field">
          <label className="form-label">Tên hiển thị</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
        </div>
        <div className="form-field">
          <label className="form-label">Loại nguồn</label>
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            {(['direct', 'bnpl'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setMode(t)}
                className={`flex-1 py-2 text-sm font-semibold transition ${mode === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {t === 'direct' ? 'Trực tiếp' : 'Trả sau (BNPL)'}
              </button>
            ))}
          </div>
        </div>
        {mode === 'bnpl' && bnplFields}
      </UpsertModal>

      <ConfirmDialog open={!!pendingDelete} title="Xác nhận xóa nguồn tiền"
        message={pendingDelete ? `Xóa nguồn tiền "${pendingDelete}"?` : ''}
        tone="danger" confirmText="Xóa"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch({ type: 'REMOVE_MASTER_ITEM', payload: { list: 'paymentSources', value: pendingDelete } })
          setPendingDelete(null)
        }} />
    </div>
  )
}

/* ════════════════════════════════════════
   TAB: Kênh thanh toán
════════════════════════════════════════ */
const TAG_PALETTES = [
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-400' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-400' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-400' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-400' },
  { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200', dot: 'bg-lime-400' },
]

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
    setOpenAdd(false); setValue('')
  }

  const saveTag = () => {
    if (!oldValue || !value.trim()) return
    dispatch({ type: 'RENAME_MASTER_ITEM', payload: { list: 'paymentChannels', old: oldValue, next: value.trim() } })
    setOpenEdit(false); setValue(''); setOldValue('')
  }

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {state.paymentChannels.length > 0 ? `${state.paymentChannels.length} kênh thanh toán` : 'Chưa có kênh nào'}
        </p>
        <button type="button" className="btn-primary btn-sm" onClick={() => { setValue(''); setOpenAdd(true) }}>
          <IconPlus className="h-3.5 w-3.5" /> Thêm kênh
        </button>
      </div>

      {state.paymentChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-14">
          <span className="text-3xl">🏷️</span>
          <p className="text-sm font-medium text-slate-500">Chưa có kênh thanh toán nào</p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => { setValue(''); setOpenAdd(true) }}>
            <IconPlus className="h-3.5 w-3.5" /> Thêm kênh đầu tiên
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {state.paymentChannels.map((ch, idx) => {
            const p = TAG_PALETTES[idx % TAG_PALETTES.length]
            return (
              <span key={ch}
                className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition hover:shadow ${p.bg} ${p.text} ${p.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                {ch}
                <span className="ml-0.5 flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" title="Sửa"
                    className="rounded p-0.5 transition hover:opacity-70"
                    onClick={() => { setOldValue(ch); setValue(ch); setOpenEdit(true) }}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button type="button" title="Xóa"
                    className="rounded p-0.5 transition hover:text-red-600"
                    onClick={() => setPendingDelete(ch)}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </span>
            )
          })}
        </div>
      )}

      <UpsertModal open={openAdd} title="Thêm kênh thanh toán" confirmText="Lưu"
        onCancel={() => setOpenAdd(false)} onConfirm={addTag}>
        <div className="form-field">
          <label className="form-label">Tên kênh</label>
          <input value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="Grab, Shopee, POS, chuyển khoản..." className="form-input" />
        </div>
      </UpsertModal>

      <UpsertModal open={openEdit} title="Sửa kênh thanh toán" confirmText="Lưu thay đổi"
        onCancel={() => setOpenEdit(false)} onConfirm={saveTag}>
        <div className="form-field">
          <label className="form-label">Tên kênh</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="form-input" />
        </div>
      </UpsertModal>

      <ConfirmDialog open={!!pendingDelete} title="Xác nhận xóa kênh"
        message={pendingDelete ? `Xóa kênh "${pendingDelete}"?` : ''}
        tone="danger" confirmText="Xóa"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch({ type: 'REMOVE_MASTER_ITEM', payload: { list: 'paymentChannels', value: pendingDelete } })
          setPendingDelete(null)
        }} />
    </div>
  )
}

/* ════════════════════════════════════════
   Tab nav config
════════════════════════════════════════ */
const TABS: { id: TabId; label: string; description: string; icon: string }[] = [
  { id: 'categories', label: 'Phân loại', description: 'Danh mục 2 lớp cha / con', icon: '🗂️' },
  { id: 'sources', label: 'Nguồn tiền', description: 'Tài khoản, thẻ, ví', icon: '💳' },
  { id: 'channels', label: 'Kênh thanh toán', description: 'App, POS, chuyển khoản', icon: '🏷️' },
]

/* ════════════════════════════════════════
   Main view
════════════════════════════════════════ */
export function MasterDataView() {
  const [activeTab, setActiveTab] = useState<TabId>('categories')
  const { state } = usePfm()

  const counts: Record<TabId, number> = {
    categories: state.categories.length,
    sources: state.paymentSources.length,
    channels: state.paymentChannels.length,
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h2 className="text-base font-semibold text-slate-900">Cấu hình danh mục</h2>
        <p className="text-xs text-slate-400">Quản lý nguồn tiền, phân loại chi tiêu và kênh thanh toán</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group flex shrink-0 flex-col gap-0.5 rounded-2xl border px-4 py-3 text-left transition sm:min-w-[160px] ${
                active
                  ? 'border-blue-200 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <span className={`text-sm font-semibold ${active ? 'text-blue-800' : 'text-slate-700'}`}>
                  {tab.label}
                </span>
                <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {counts[tab.id]}
                </span>
              </span>
              <span className={`text-[11px] ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                {tab.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="card p-5">
        {activeTab === 'categories' && <CategoryPanel />}
        {activeTab === 'sources' && <SourcePanel />}
        {activeTab === 'channels' && <ChannelTagPanel />}
      </div>
    </div>
  )
}
