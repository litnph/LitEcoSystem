import { AuthProvider } from './app/auth/AuthContext'
import { useAuth } from './app/auth/useAuth'
import { PfmProvider } from './app/PfmProvider'
import { AppShell } from './app/AppShell'
import { LoginPage } from './features/auth/LoginPage'

function AppRouter() {
  const { session } = useAuth()
  if (!session) return <LoginPage />
  return (
    <PfmProvider>
      <AppShell />
    </PfmProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
