import { useMemo, useState } from 'react'
import type { Transaction } from '../../../entities'

export type TxFilters = {
  search: string
  type: 'all' | 'income' | 'expense'
  category: string
  source: string
  paymentMode: 'all' | 'direct' | 'bnpl'
  dateFrom: string
  dateTo: string
}

const DEFAULT_FILTERS: TxFilters = {
  search: '',
  type: 'all',
  category: 'all',
  source: 'all',
  paymentMode: 'all',
  dateFrom: '',
  dateTo: '',
}

export function useTransactionFilters(transactions: Transaction[]) {
  const [filters, setFilters] = useState<TxFilters>(DEFAULT_FILTERS)

  const update = <K extends keyof TxFilters>(key: K, value: TxFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const reset = () => setFilters(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (
        filters.search &&
        !t.merchant.toLowerCase().includes(filters.search.toLowerCase()) &&
        !t.category.toLowerCase().includes(filters.search.toLowerCase()) &&
        !t.channel.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false
      if (filters.type !== 'all' && t.type !== filters.type) return false
      if (filters.category !== 'all' && t.category !== filters.category) return false
      if (filters.source !== 'all' && t.source !== filters.source) return false
      if (filters.paymentMode !== 'all' && t.paymentMode !== filters.paymentMode)
        return false
      if (filters.dateFrom && t.occurredAt < filters.dateFrom) return false
      if (filters.dateTo && t.occurredAt > filters.dateTo) return false
      return true
    })
  }, [transactions, filters])

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'type' || k === 'category' || k === 'source' || k === 'paymentMode')
      return v !== 'all'
    return v !== ''
  }).length

  return { filters, update, reset, filtered, activeCount }
}
