import { useEffect, useMemo, useState } from 'react'
import { getUsersApi, type UserApiDto } from '../../../shared/api/users'
import { ApiError } from '../../../shared/api/client'
import { useAuth } from '../../../app/auth/useAuth'

export function AccessControlView() {
  const { session } = useAuth()
  const [users, setUsers] = useState<UserApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void getUsersApi()
      .then((data) => {
        if (!isMounted) return
        setUsers(data)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        if (err instanceof ApiError && err.status === 403) {
          setError('Bạn không có quyền xem danh sách user.')
          return
        }
        setError('Không thể tải dữ liệu user từ API.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const roles = useMemo(() => {
    const roleSet = new Set<string>()
    for (const user of users) {
      for (const role of user.roles ?? []) {
        roleSet.add(role)
      }
    }
    if (roleSet.size === 0 && session?.roles?.length) {
      for (const role of session.roles) roleSet.add(role)
    }
    return Array.from(roleSet).sort((a, b) => a.localeCompare(b))
  }, [session, users])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Quản lý user & phân quyền</h2>
        <p className="text-xs text-slate-400">
          Dữ liệu lấy từ API user/role. Chỉnh sửa quyền sẽ bổ sung ở bước tiếp theo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Tổng user" value={users.length} />
        <StatCard label="User đang active" value={users.filter((u) => u.isActive).length} />
        <StatCard label="Số role" value={roles.length} />
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900">Danh sách role</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.length > 0 ? (
            roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
              >
                {role}
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-400">Chưa có role nào.</p>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Danh sách user</h3>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-red-600">{error}</p>
        ) : users.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">Không có user nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Quyền</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{user.fullName}</p>
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(user.roles ?? []).length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={`${user.id}-${role}`}
                              className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Chưa gán quyền</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
