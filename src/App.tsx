import { AuthProvider, useAuth, QueryProvider } from './app/providers'
import { FinancePage } from './pages/finance'
import { LoginPage } from './pages/login'

function AppRouter() {
  const { session } = useAuth()
  if (!session) return <LoginPage />
  return <FinancePage />
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
