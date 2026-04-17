import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CycleUiState = {
  selectedPeriodId: string
  setSelectedPeriodId: (id: string) => void
}

export const useCycleUiStore = create<CycleUiState>()(
  persist(
    (set) => ({
      selectedPeriodId: '',
      setSelectedPeriodId: (id) => set({ selectedPeriodId: id }),
    }),
    { name: 'cycle-ui-v1' },
  ),
)
