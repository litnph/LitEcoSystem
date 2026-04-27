import React, { useState } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { useConfigurationQuery } from '@/entities/user'
import { IconReceipt, IconCalendar, IconSettings, IconPanelLeft, IconLandmark, IconUsers } from '@/shared/ui/Icon'
import { useAuth } from '@/app/providers/auth/use-auth'

export type AppTab = 'transactions' | 'cycle' | 'obligations' | 'payments' | 'masterdata' | 'access'

const NAV: { id: AppTab; label: string; sub: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'transactions', label: 'Thu / Chi', sub: 'Giao dịch', icon: IconReceipt },
  { id: 'cycle', label: 'Kỳ chi tiêu', sub: 'Ngân sách & sao kê', icon: IconCalendar },
  { id: 'obligations', label: 'Nợ & Trả góp', sub: 'Quản lý nghĩa vụ', icon: IconLandmark },
  { id: 'payments', label: 'Thanh toán', sub: 'Sao kê BNPL', icon: IconLandmark },
  { id: 'masterdata', label: 'Cấu hình', sub: 'Lịch & danh mục', icon: IconSettings },
  { id: 'access', label: 'User', sub: 'Quản trị người dùng', icon: IconUsers },
]

const PAGE_LABELS: Record<AppTab, string> = {
  transactions: 'Thu / Chi',
  cycle: 'Kỳ chi tiêu',
  obligations: 'Nợ & Trả góp',
  payments: 'Thanh toán sao kê',
  masterdata: 'Cấu hình',
  access: 'Quản lý user',
}

function NavItem({ label, sub, icon: Icon, active, onClick }: {
  label: string; sub: string; icon: React.FC<{ className?: string }>; active: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        active ? 'bg-[#62492E] text-white shadow-sm' : 'text-[#9E8E7C] hover:bg-[#EDE6DC] hover:text-[#2C2215]'
      }`}>
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-[#BFB0A0] group-hover:text-[#5C4A36]'}`} />
      <div className="min-w-0">
        <p className={`text-sm font-medium leading-tight ${active ? 'text-white' : ''}`}>{label}</p>
        <p className={`text-[10px] leading-tight ${active ? 'text-[#C9B8A8]' : 'text-[#BFB0A0]'}`}>{sub}</p>
      </div>
    </button>
  )
}

export function AppShell({
  children,
  activeTab,
  onTabChange,
}: {
  children: React.ReactNode
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}) {
  const tab = activeTab
  const setTab = onTabChange
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: config } = useConfigurationQuery()
  const cal = config?.calendarRules
  const { session, logout, menuTree } = useAuth()
  const isFetching = useIsFetching()

  return (
    <div className="flex min-h-screen bg-[#F9F6F2] text-[#2C2215]">
      {sidebarOpen && (
        <button type="button" aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#E4D9CE] bg-[#F5F0E8] transition-transform duration-200 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-[#E4D9CE] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#62492E]">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2C2215]">LitEcoSystem</p>
            <p className="text-[10px] text-[#9E8E7C]">Personal Finance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#BFB0A0]">Menu</p>
          {NAV.map((item) => (
            <NavItem key={item.id} {...item} active={tab === item.id}
              onClick={() => {
                setTab(item.id)
                if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
              }} />
          ))}
        </nav>

        <div className="space-y-2 border-t border-[#E4D9CE] px-4 py-3">
          {session && (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[#3E3025]">{session.displayName}</p>
                <p className="truncate text-[10px] text-[#9E8E7C]">@{session.username}</p>
              </div>
              <button type="button" onClick={() => { void logout() }}
                className="shrink-0 rounded-lg border border-[#E4D9CE] px-2.5 py-1 text-[10px] font-medium text-[#7A6A58] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Đăng xuất">
                Đăng xuất
              </button>
            </div>
          )}
          <p className="text-[10px] text-[#BFB0A0]">Menu API: {menuTree.length} mục</p>
          {cal && (
            <p className="text-[10px] text-[#BFB0A0]">
              Sao kê ngày {cal.statementClosingDay} · Hạn thẻ ngày {cal.paymentDueDay} · Lương {cal.salaryFromDay}–{cal.salaryToDay}
            </p>
          )}
        </div>
      </aside>

      <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ease-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'} ml-0 pb-20 md:pb-0`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E4D9CE] bg-[#F9F6F2]/95 px-4 backdrop-blur md:px-6">
          <button type="button" onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-xl p-2 text-[#6B5B48] transition hover:bg-[#EDE6DC]"
            aria-label={sidebarOpen ? 'Thu gọn menu' : 'Mở menu'}>
            <IconPanelLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-[#2C2215]">{PAGE_LABELS[tab]}</h1>
            <p className="truncate text-xs text-[#9E8E7C]">Quản lý tài chính cá nhân</p>
          </div>
          {isFetching > 0 && (
            <div className="flex items-center gap-1.5 text-[#9E8E7C]">
              <svg className="h-3.5 w-3.5 animate-spin text-[#7A5E3E]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[11px]">Đang tải...</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#E4D9CE] bg-[#F5F0E8] md:hidden">
        {NAV.map((item) => {
          const active = tab === item.id
          return (
            <button key={item.id} type="button" onClick={() => setTab(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition ${active ? 'text-[#62492E]' : 'text-[#BFB0A0]'}`}>
              <item.icon className={`h-5 w-5 ${active ? 'text-[#62492E]' : 'text-[#BFB0A0]'}`} />
              <span className="truncate px-0.5">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
