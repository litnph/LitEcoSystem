import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PaymentMode, Transaction, TransactionBusinessType, TransactionType } from '../../../entities'
import { usePfm } from '../../../app/PfmProvider'
import { useTransactionMutations } from '../../../shared/hooks/useTransactionMutations'

export type TransactionFormState = {
  type: TransactionType
  amount: string
  occurredAt: string
  merchant: string
  channel: string
  category: string
  source: string
  bnplProviderId: string
  isAdvancePayment: boolean
  advanceItems: Array<{
    person: string
    amount: string
    dueDate: string
  }>
  note: string
}

function emptyForm(
  todayIso: string,
  defaultCategory: string,
  defaultSource: string,
  defaultChannel: string,
): TransactionFormState {
  return {
    type: 'expense',
    amount: '',
    occurredAt: todayIso,
    merchant: '',
    channel: defaultChannel,
    category: defaultCategory,
    source: defaultSource,
    bnplProviderId: '',
    isAdvancePayment: false,
    advanceItems: [{ person: '', amount: '', dueDate: todayIso }],
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
    isAdvancePayment: tx.businessType === 'advance_payment',
    advanceItems: [{ person: tx.counterpartyName ?? '', amount: '', dueDate: tx.occurredAt }],
    note: tx.note ?? '',
  }
}

export function useTransactionForm(
  editingTx: Transaction | null,
  onDone: () => void,
) {
  const { state } = usePfm()
  const mutations = useTransactionMutations()
  const todayIso = new Date().toISOString().slice(0, 10)
  const defaultExpenseCategory = useMemo(
    () => state.categories.find((c) => (state.categoryKinds[c] ?? 'expense') === 'expense') ?? '',
    [state.categories, state.categoryKinds],
  )
  const defaultSource = useMemo(() => state.paymentSources[0] ?? '', [state.paymentSources])
  const defaultChannel = useMemo(() => state.paymentChannels[0] ?? '', [state.paymentChannels])
  const [form, setForm] = useState<TransactionFormState>(() =>
    editingTx
      ? txToForm(editingTx)
      : emptyForm(todayIso, defaultExpenseCategory, defaultSource, defaultChannel),
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reset when editing target changes
  useEffect(() => {
    setForm(
      editingTx
        ? txToForm(editingTx)
        : emptyForm(todayIso, defaultExpenseCategory, defaultSource, defaultChannel),
    )
    setError(null)
  }, [editingTx, todayIso, defaultExpenseCategory, defaultSource, defaultChannel])

  const update = useCallback(
    <K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) => {
      setForm((f) => {
        if (key === 'isAdvancePayment') {
          const enabled = Boolean(value)
          if (enabled) {
            return {
              ...f,
              isAdvancePayment: true,
              type: 'expense',
              category: state.categories.find((c) => state.categoryKinds[c] === 'expense') ?? f.category,
              advanceItems: f.advanceItems.length > 0 ? f.advanceItems : [{ person: '', amount: '', dueDate: todayIso }],
            }
          }
          return { ...f, isAdvancePayment: false }
        }
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
    [state.bnplProviders, state.paymentSourceModes, state.categories, state.categoryKinds, todayIso],
  )

  const addAdvanceItem = useCallback(() => {
    setForm((f) => ({
      ...f,
      advanceItems: [...f.advanceItems, { person: '', amount: '', dueDate: f.occurredAt || todayIso }],
    }))
  }, [todayIso])

  const removeAdvanceItem = useCallback((index: number) => {
    setForm((f) => {
      const next = f.advanceItems.filter((_, i) => i !== index)
      return {
        ...f,
        advanceItems: next.length > 0 ? next : [{ person: '', amount: '', dueDate: f.occurredAt || todayIso }],
      }
    })
  }, [todayIso])

  const updateAdvanceItem = useCallback(
    (index: number, key: 'person' | 'amount' | 'dueDate', value: string) => {
      setForm((f) => ({
        ...f,
        advanceItems: f.advanceItems.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
      }))
      setError(null)
    },
    [],
  )

  const submit = useCallback(async () => {
    const amount = Number(String(form.amount).replace(/[.,\s]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Nhập số tiền hợp lệ')
      return
    }
    if (!form.occurredAt) {
      setError('Chọn ngày')
      return
    }
    if (!editingTx && form.isAdvancePayment) {
      if (form.advanceItems.length === 0) {
        setError('Thêm ít nhất một dòng chi hộ.')
        return
      }
      let totalAdvance = 0
      for (const item of form.advanceItems) {
        const itemAmount = Number(String(item.amount).replace(/[.,\s]/g, ''))
        if (!item.person.trim() || !item.dueDate) {
          setError('Vui lòng nhập đầy đủ người được chi hộ và hạn thu hồi cho từng dòng.')
          return
        }
        if (!Number.isFinite(itemAmount) || itemAmount <= 0) {
          setError('Số tiền chi hộ của từng dòng phải hợp lệ.')
          return
        }
        totalAdvance += itemAmount
      }
      if (totalAdvance > amount) {
        setError('Số tiền chi hộ không được lớn hơn tổng giao dịch.')
        return
      }
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

    const businessType: TransactionBusinessType = form.isAdvancePayment ? 'advance_payment' : 'normal'

    const basePayload = {
      type: form.type,
      amount,
      occurredAt: form.occurredAt,
      merchant: form.merchant.trim() || '—',
      channel: form.channel,
      category: form.category,
      source: form.source,
      paymentMode,
      businessType,
      counterpartyName: form.isAdvancePayment
        ? form.advanceItems.map((x) => x.person.trim()).filter(Boolean).join(', ')
        : undefined,
      bnplProviderId:
        form.type === 'expense' && paymentMode === 'bnpl' && matchedProvider
          ? matchedProvider.id
          : undefined,
      note: form.note.trim() || undefined,
    }

    setSubmitting(true)
    setError(null)
    try {
      if (editingTx) {
        const ok = await mutations.updateTransaction(editingTx.id, {
          type: basePayload.type,
          amount: basePayload.amount,
          occurredAt: basePayload.occurredAt,
          merchant: basePayload.merchant,
          channel: basePayload.channel,
          category: basePayload.category,
          source: basePayload.source,
          note: basePayload.note,
        })
        if (!ok) { setError(mutations.error ?? 'Lỗi khi cập nhật giao dịch.'); return }
      } else {
        const tx = await mutations.addTransaction(basePayload)
        if (!tx) { setError(mutations.error ?? 'Lỗi khi thêm giao dịch.'); return }
        if (form.isAdvancePayment && tx) {
          for (let idx = 0; idx < form.advanceItems.length; idx++) {
            const item = form.advanceItems[idx]
            const advanceAmount = Number(String(item.amount).replace(/[.,\s]/g, ''))
            await mutations.addReceivable({
              title:
                (form.merchant.trim() || 'Chi hộ') +
                (form.advanceItems.length > 1 ? ` (${idx + 1}/${form.advanceItems.length})` : ''),
              borrower: item.person.trim(),
              principal: advanceAmount,
              dueDate: item.dueDate,
              kind: 'advance',
              sourceTransactionId: tx.id,
            })
          }
        }
      }
      onDone()
    } finally {
      setSubmitting(false)
    }
  }, [mutations, form, editingTx, onDone, state.bnplProviders, state.paymentSourceModes])

  return {
    form,
    update,
    addAdvanceItem,
    removeAdvanceItem,
    updateAdvanceItem,
    submit,
    error,
    submitting,
    categories: useMemo(
      () => state.categories.filter((c) => (state.categoryKinds[c] ?? 'expense') === form.type),
      [state.categories, state.categoryKinds, form.type],
    ),
    channels: state.paymentChannels,
    sources: state.paymentSources,
    sourceMode: state.paymentSourceModes[form.source] ?? 'direct',
    sourceStatementDay: state.paymentSourceStatementDays[form.source],
    isEditing: editingTx !== null,
  }
}
