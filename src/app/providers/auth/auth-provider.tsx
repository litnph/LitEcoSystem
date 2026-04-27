import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { clearSession, loadSession, saveSession, type AuthSession } from '@/shared/lib/auth-storage'
import { loginApi, logoutApi } from '@/shared/api/auth'
import { getMenuTreeApi, type MenuNode } from '@/shared/api/menus'
import { ApiError } from '@/shared/api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [menuTree, setMenuTree] = useState<MenuNode[]>([])

  useEffect(() => {
    if (!session) return
    void getMenuTreeApi(session.preferredLanguage ?? 'vi')
      .then(setMenuTree)
      .catch(() => setMenuTree([]))
  }, [session])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await loginApi({ username, password })
      const s: AuthSession = {
        userId: result.user.id,
        username: result.user.username,
        displayName: result.user.fullName,
        email: result.user.email,
        preferredLanguage: result.user.preferredLanguage,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiry: result.accessTokenExpiry,
        loggedInAt: new Date().toISOString(),
      }
      saveSession(s)
      setSession(s)
      return { ok: true }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { ok: false, error: 'Sai tài khoản hoặc mật khẩu.' }
      }
      return { ok: false, error: 'Không thể kết nối API đăng nhập.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Allow local logout even if remote logout fails.
    }
    clearSession()
    setMenuTree([])
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, menuTree, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
