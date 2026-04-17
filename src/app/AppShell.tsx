import { useState } from 'react'
import { TransactionsView } from '../features/transactions/components/TransactionsView'
import { SpendingCycleView } from '../features/cycle/components/SpendingCycleView'
import { MasterDataView } from '../features/masterdata/components/MasterDataView'
import { ObligationsView } from '../features/obligations/components/ObligationsView'
import { AccessControlView } from '../features/access/components/AccessControlView'
import { IconReceipt, IconCalendar, IconSettings, IconPanelLeft, IconLandmark, IconUsers } from '../shared/ui/Icon'
import { usePfm } from './PfmProvider'
import { useAuth } from './auth/useAuth'

export type AppTab = 'transactions' | 'cycle' | 'obligations' | 'masterdata' | 'access'

const NAV: {
  id: AppTab
  label: string
  sub: string
  icon: React.FC<{ className?: string }>
}[] = [
  { id: 'transactions', label: 'Thu / Chi', sub: 'Giao dịch', icon: IconReceipt },
  { id: 'cycle', label: 'Kỳ chi tiêu', sub: 'Ngân sách & sao kê', icon: IconCalendar },
  { id: 'obligations', label: 'Nợ & Trả góp', sub: 'Quản lý nghĩa vụ', icon: IconLandmark },
  { id: 'masterdata', label: 'Cấu hình', sub: 'Lịch & danh mục', icon: IconSettings },
  { id: 'access', label: 'User & Role', sub: 'Phân quyền', icon: IconUsers },
]

const PAGE_LABELS: Record<AppTab, string> = {
  transactions: 'Thu / Chi',
  cycle: 'Kỳ chi tiêu',
  obligations: 'Nợ & Trả góp',
  masterdata: 'Cấu hình',
  access: 'Quản lý user & phân quyền',
}

function NavItem({
  label,
  sub,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  sub: string
  icon: React.FC<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${
          active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
        }`}
      />
      <div className="min-w-0">
        <p className={`text-sm font-medium leading-tight ${active ? 'text-white' : ''}`}>{label}</p>
        <p className={`text-[10px] leading-tight ${active ? 'text-blue-200' : 'text-slate-400'}`}>{sub}</p>
      </div>
    </button>
  )
}

export function AppShell() {
  const [tab, setTab] = useState<AppTab>('transactions')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { state, apiLoading } = usePfm()
  const cal = state.calendarRules
  const { session, logout, menuTree } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-slate-100 bg-white transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-sm font-bold text-white">₫</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">FinTrack</p>
            <p className="text-[10px] text-slate-400">Personal Finance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>
          {NAV.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              active={tab === item.id}
              onClick={() => {
                setTab(item.id)
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setSidebarOpen(false)
                }
              }}
            />
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          {session && (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">{session.displayName}</p>
                <p className="truncate text-[10px] text-slate-400">@{session.username}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void logout()
                }}
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Đăng xuất"
              >
                Đăng xuất
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-400">Menu API: {menuTree.length} mục</p>
          <p className="text-[10px] text-slate-400">
            Sao kê ngày {cal.statementClosingDay} · Hạn thẻ ngày {cal.paymentDueDay} · Lương {cal.salaryFromDay}–
            {cal.salaryToDay}
          </p>
        </div>
      </aside>

      <div
        className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ease-out ${
          sidebarOpen ? 'md:ml-56' : 'md:ml-0'
        } ml-0 pb-20 md:pb-0`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md md:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label={sidebarOpen ? 'Thu gọn menu' : 'Mở menu'}
          >
            <IconPanelLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-900">{PAGE_LABELS[tab]}</h1>
            <p className="text-xs text-slate-400">Quản lý tài chính cá nhân</p>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {apiLoading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
              <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Đang tải dữ liệu từ server...</span>
            </div>
          ) : (
            <>
              {tab === 'transactions' && <TransactionsView />}
              {tab === 'cycle' && <SpendingCycleView />}
              {tab === 'obligations' && <ObligationsView />}
              {tab === 'masterdata' && <MasterDataView />}
              {tab === 'access' && <AccessControlView />}
            </>
          )}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-100 bg-white md:hidden">
        {NAV.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="truncate px-0.5">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
