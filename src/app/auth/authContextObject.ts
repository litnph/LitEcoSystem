import { createContext } from 'react'
import type { AuthSession } from '@/shared/lib/auth-storage'
import type { MenuNode } from '../../shared/api/menus'

export type AuthContextValue = {
  session: AuthSession | null
  menuTree: MenuNode[]
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
