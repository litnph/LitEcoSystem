import { useEffect, useMemo, useState } from 'react'
import {
  createUserApi,
  deleteUserApi,
  getUsersApi,
  setUserStatusApi,
  updateUserApi,
  type UserApiDto,
} from '@/shared/api/users'
import { ApiError } from '@/shared/api/client'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[#9E8E7C]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#2C2215]">{value}</p>
    </div>
  )
}

export function AccessBoard() {
  const [users, setUsers] = useState<UserApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
  })
  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
  })
  const [selectedUser, setSelectedUser] = useState<UserApiDto | null>(null)
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserApiDto | null>(null)
  const [confirmStatusUser, setConfirmStatusUser] = useState<UserApiDto | null>(null)
  const [formError, setFormError] = useState('')
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null)

  async function reloadUsers() {
    const data = await getUsersApi()
    setUsers(data)
  }

  useEffect(() => {
    let isMounted = true
    void getUsersApi()
      .then((data) => { if (isMounted) setUsers(data) })
      .catch(() => {
        if (isMounted) setError('Không thể tải dữ liệu user từ API.')
      })
      .finally(() => { if (isMounted) setLoading(false) })
    return () => { isMounted = false }
  }, [])

  const activeUsers = useMemo(() => users.filter((u) => u.isActive).length, [users])

  async function onCreateUser() {
    if (!createForm.email.trim() || !createForm.fullName.trim()) {
      setFormError('Vui lòng nhập đầy đủ họ tên và email.')
      return
    }

    if (!createForm.username.trim() || !createForm.password) {
      setFormError('Khi tạo mới cần nhập username và mật khẩu.')
      return
    }

    try {
      setBusy(true)
      setFormError('')
      await createUserApi({
        username: createForm.username.trim(),
        password: createForm.password,
        email: createForm.email.trim(),
        fullName: createForm.fullName.trim(),
      })
      await reloadUsers()
      setOpenCreate(false)
      setCreateForm({ username: '', password: '', email: '', fullName: '' })
      setInfoModal({ title: 'Thành công', message: 'Đã tạo user mới.' })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        return
      }
      setFormError('Không thể lưu user.')
    } finally {
      setBusy(false)
    }
  }

  function openEditModal(user: UserApiDto) {
    setSelectedUser(user)
    setEditForm({ email: user.email, fullName: user.fullName })
    setFormError('')
    setOpenEdit(true)
  }

  async function onEditUser() {
    if (!selectedUser) return
    if (!editForm.email.trim() || !editForm.fullName.trim()) {
      setFormError('Vui lòng nhập đầy đủ họ tên và email.')
      return
    }
    try {
      setBusy(true)
      setFormError('')
      await updateUserApi(selectedUser.id, {
        email: editForm.email.trim(),
        fullName: editForm.fullName.trim(),
      })
      await reloadUsers()
      setOpenEdit(false)
      setSelectedUser(null)
      setInfoModal({ title: 'Thành công', message: 'Đã cập nhật user.' })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        return
      }
      setFormError('Không thể cập nhật user.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteUser) return
    try {
      setBusy(true)
      await deleteUserApi(confirmDeleteUser.id)
      await reloadUsers()
      setConfirmDeleteUser(null)
      setInfoModal({ title: 'Thành công', message: 'Đã xóa user.' })
    } catch {
      setError('Không thể xóa user.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmSetStatus() {
    if (!confirmStatusUser) return
    try {
      setBusy(true)
      await setUserStatusApi(confirmStatusUser.id, !confirmStatusUser.isActive)
      await reloadUsers()
      setConfirmStatusUser(null)
      setInfoModal({ title: 'Thành công', message: 'Đã cập nhật trạng thái user.' })
    } catch {
      setError('Không thể cập nhật trạng thái user.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[#2C2215]">Quản lý user</h2>
        <p className="text-xs text-[#9E8E7C]">Thêm, sửa, xóa và active/deactive user.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Tổng user" value={users.length} />
        <StatCard label="User đang active" value={activeUsers} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#2C2215]">Danh sách user</h3>
          <button type="button" className="btn-primary btn-sm" onClick={() => { setFormError(''); setOpenCreate(true) }}>
            Thêm user
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-[#EDE6DC] px-5 py-3">
          <h3 className="text-sm font-semibold text-[#2C2215]">Danh sách user</h3>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-[#9E8E7C]">Đang tải dữ liệu...</p>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-red-600">{error}</p>
        ) : users.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#9E8E7C]">Không có user nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#EDE6DC] text-sm">
              <thead className="bg-[#F5F0E8] text-xs uppercase tracking-wider text-[#9E8E7C]">
                <tr>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                  <th className="px-5 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE6DC] bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#3E3025]">{user.fullName}</p>
                      <p className="text-xs text-[#9E8E7C]">@{user.username}</p>
                    </td>
                    <td className="px-5 py-3 text-[#6B5B48]">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-[#EDE6DC] text-[#9E8E7C]'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="btn-ghost btn-sm" onClick={() => openEditModal(user)} disabled={busy}>Sửa</button>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirmStatusUser(user)} disabled={busy}>
                          {user.isActive ? 'Deactive' : 'Active'}
                        </button>
                        <button type="button" className="btn-danger btn-sm" onClick={() => setConfirmDeleteUser(user)} disabled={busy}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openCreate && (
        <div className="modal-backdrop" onClick={() => setOpenCreate(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#2C2215]">Thêm user</h3>
            <div className="mt-4 space-y-3">
              <div className="form-field">
                <label className="form-label">Username</label>
                <input value={createForm.username} onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Mật khẩu</label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Họ và tên</label>
                <input value={createForm.fullName} onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} className="form-input" />
              </div>
              {formError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setOpenCreate(false)}>Hủy</button>
              <button type="button" className="btn-primary flex-1" onClick={() => { void onCreateUser() }} disabled={busy}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {openEdit && selectedUser && (
        <div className="modal-backdrop" onClick={() => setOpenEdit(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#2C2215]">Sửa user</h3>
            <div className="mt-4 space-y-3">
              <div className="form-field">
                <label className="form-label">Username</label>
                <input value={selectedUser.username} className="form-input opacity-60" disabled />
              </div>
              <div className="form-field">
                <label className="form-label">Họ và tên</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className="form-input" />
              </div>
              {formError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setOpenEdit(false)}>Hủy</button>
              <button type="button" className="btn-primary flex-1" onClick={() => { void onEditUser() }} disabled={busy}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteUser}
        title="Xác nhận xóa user"
        message={confirmDeleteUser ? `Bạn muốn xóa user "${confirmDeleteUser.username}"?` : ''}
        confirmText="Xóa"
        tone="danger"
        onCancel={() => setConfirmDeleteUser(null)}
        onConfirm={() => { void confirmDelete() }}
      />

      <ConfirmDialog
        open={!!confirmStatusUser}
        title="Xác nhận cập nhật trạng thái"
        message={confirmStatusUser ? `Bạn muốn ${confirmStatusUser.isActive ? 'deactive' : 'active'} user "${confirmStatusUser.username}"?` : ''}
        confirmText="Xác nhận"
        onCancel={() => setConfirmStatusUser(null)}
        onConfirm={() => { void confirmSetStatus() }}
      />

      {infoModal && (
        <div className="modal-backdrop" onClick={() => setInfoModal(null)}>
          <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#2C2215]">{infoModal.title}</h3>
            <p className="mt-2 text-sm text-[#6B5B48]">{infoModal.message}</p>
            <div className="mt-6 flex">
              <button type="button" onClick={() => setInfoModal(null)} className="btn-primary w-full">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
