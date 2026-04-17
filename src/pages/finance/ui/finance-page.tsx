import { useState } from 'react'
import { AppShell, type AppTab } from '@/widgets/app-shell'
import { TransactionListBoard } from '@/widgets/transaction-list-board'
import { SpendingCycleBoard } from '@/widgets/spending-cycle-board'
import { ObligationsBoard } from '@/widgets/obligations-board'
import { PaymentsBoard } from '@/widgets/payments-board'
import { MasterDataBoard } from '@/widgets/masterdata-board'
import { AccessBoard } from '@/widgets/access-board'

export function FinancePage() {
  const [tab, setTab] = useState<AppTab>('transactions')

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {tab === 'transactions' && <TransactionListBoard />}
      {tab === 'cycle' && <SpendingCycleBoard />}
      {tab === 'obligations' && <ObligationsBoard />}
      {tab === 'payments' && <PaymentsBoard />}
      {tab === 'masterdata' && <MasterDataBoard />}
      {tab === 'access' && <AccessBoard />}
    </AppShell>
  )
}
