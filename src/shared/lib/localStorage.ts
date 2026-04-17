import type { PfmState } from '../../app/store/pfmState'

const LS_KEY = 'pfm-v1'

export function saveToLocalStorage(state: PfmState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // quota exceeded or private mode — ignore silently
  }
}

export function loadFromLocalStorage(): PfmState | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PfmState
  } catch {
    return null
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(LS_KEY)
}
