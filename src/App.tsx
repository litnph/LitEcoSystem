import { ApiErrorProvider, AuthProvider, QueryProvider, useAuth } from './app/providers'
import { FinancePage } from './pages/finance'
import { LoginPage } from './pages/login'

function AppRouter() {
  const { session } = useAuth()
  if (!session) return <LoginPage />
  return <FinancePage />
}

function App() {
  return (
    <ApiErrorProvider>
      <QueryProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryProvider>
    </ApiErrorProvider>
  )
}

export default App
