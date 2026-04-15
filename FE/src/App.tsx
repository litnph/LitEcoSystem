import { PfmProvider } from './app/PfmProvider'
import { AppShell } from './app/AppShell'

function App() {
  return (
    <PfmProvider>
      <AppShell />
    </PfmProvider>
  )
}

export default App
