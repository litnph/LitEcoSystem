const AUTH_KEY = 'pfm-auth-v1'

export type AuthSession = {
  userId: string
  username: string
  displayName: string
  email: string
  preferredLanguage: string
  roles: string[]
  accessToken: string
  refreshToken: string
  accessTokenExpiry: string
  loggedInAt: string
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_KEY)
}
