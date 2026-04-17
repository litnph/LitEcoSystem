import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MonthlyClose } from '@/entities/spending-cycle'

type CycleUiState = {
  selectedPeriodId: string
  monthlyCloses: MonthlyClose[]
  setSelectedPeriodId: (id: string) => void
  addMonthlyClose: (close: MonthlyClose) => void
  hasClose: (periodId: string) => boolean
}

export const useCycleUiStore = create<CycleUiState>()(
  persist(
    (set, get) => ({
      selectedPeriodId: '',
      monthlyCloses: [],
      setSelectedPeriodId: (id) => set({ selectedPeriodId: id }),
      addMonthlyClose: (close) =>
        set((s) => ({
          monthlyCloses: s.monthlyCloses.some((c) => c.period === close.period)
            ? s.monthlyCloses
            : [...s.monthlyCloses, close],
        })),
      hasClose: (periodId) => get().monthlyCloses.some((c) => c.period === periodId),
    }),
    { name: 'cycle-ui-v1' },
  ),
)
