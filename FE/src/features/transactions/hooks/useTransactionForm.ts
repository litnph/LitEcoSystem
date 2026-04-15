import { useCallback, useEffect, useState } from 'react'
import type { PaymentMode, Transaction, TransactionType } from '../../../entities'
import { usePfm } from '../../../app/PfmProvider'

export type TransactionFormState = {
  type: TransactionType
  amount: string
  occurredAt: string
  merchant: string
  channel: string
  category: string
  source: string
  bnplProviderId: string
  note: string
}

function emptyForm(todayIso: string): TransactionFormState {
  return {
    type: 'expense',
    amount: '',
    occurredAt: todayIso,
    merchant: '',
    channel: 'Grab',
    category: 'Ăn uống/Đi chợ',
    source: 'Cash',
    bnplProviderId: '',
    note: '',
  }
}

function txToForm(tx: Transaction): TransactionFormState {
  return {
    type: tx.type,
    amount: String(tx.amount),
    occurredAt: tx.occurredAt,
    merchant: tx.merchant,
    channel: tx.channel,
    category: tx.category,
    source: tx.source,
    bnplProviderId: tx.bnplProviderId ?? '',
    note: tx.note ?? '',
  }
}

export function useTransactionForm(
  editingTx: Transaction | null,
  onDone: () => void,
) {
  const { dispatch, state } = usePfm()
  const todayIso = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<TransactionFormState>(() =>
    editingTx ? txToForm(editingTx) : emptyForm(todayIso),
  )
  const [error, setError] = useState<string | null>(null)

  // Reset when editing target changes
  useEffect(() => {
    setForm(editingTx ? txToForm(editingTx) : emptyForm(todayIso))
    setError(null)
  }, [editingTx, todayIso])

  const update = useCallback(
    <K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) => {
      setForm((f) => {
        if (key === 'source') {
          const nextSource = String(value)
          const mode = state.paymentSourceModes[nextSource] ?? 'direct'
          if (mode === 'bnpl') {
            const matchedProvider = state.bnplProviders.find((p) => p.name === nextSource)
            return {
              ...f,
              source: nextSource,
              bnplProviderId: matchedProvider?.id ?? f.bnplProviderId,
            }
          }
          return { ...f, source: nextSource, bnplProviderId: '' }
        }
        return { ...f, [key]: value }
      })
      setError(null)
    },
    [state.bnplProviders, state.paymentSourceModes],
  )

  const submit = useCallback(() => {
    const amount = Number(String(form.amount).replace(/[.,\s]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Nhập số tiền hợp lệ')
      return
    }
    if (!form.occurredAt) {
      setError('Chọn ngày')
      return
    }

    let paymentMode: PaymentMode = 'direct'
    if (form.type === 'expense') {
      paymentMode = state.paymentSourceModes[form.source] === 'bnpl' ? 'bnpl' : 'direct'
    }
    const matchedProvider = state.bnplProviders.find((p) => p.name === form.source)
    if (form.type === 'expense' && paymentMode === 'bnpl' && !form.bnplProviderId) {
      if (!matchedProvider) {
        setError('Nguồn trả sau chưa có cấu hình sao kê. Vui lòng vào Cấu hình để cập nhật.')
        return
      }
    }
    if (form.type === 'expense' && paymentMode === 'bnpl' && !matchedProvider) {
      setError('Nguồn trả sau chưa có cấu hình sao kê. Vui lòng vào Cấu hình để cập nhật.')
      return
    }

    const payload = {
      type: form.type,
      amount,
      occurredAt: form.occurredAt,
      merchant: form.merchant.trim() || '—',
      channel: form.channel,
      category: form.category,
      source: form.source,
      paymentMode,
      bnplProviderId:
        form.type === 'expense' && paymentMode === 'bnpl' && matchedProvider
          ? matchedProvider.id
          : undefined,
      note: form.note.trim() || undefined,
    }

    if (editingTx) {
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          ...editingTx,
          ...payload,
        },
      })
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload })
    }

    onDone()
  }, [dispatch, form, editingTx, onDone, state.bnplProviders, state.paymentSourceModes])

  return {
    form,
    update,
    submit,
    error,
    categories: state.categories,
    channels: state.paymentChannels,
    sources: state.paymentSources,
    sourceMode: state.paymentSourceModes[form.source] ?? 'direct',
    sourceStatementDay: state.paymentSourceStatementDays[form.source],
    isEditing: editingTx !== null,
  }
}
