import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PaymentMode, Transaction, TransactionBusinessType, TransactionType } from '@/entities/transaction'
import { useConfigurationQuery } from '@/entities/user'
import {
  useCreateTransaction,
  useUpdateTransaction,
  useCreateReceivable,
} from './use-transaction-mutations'

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
  advanceItems: Array<{ person: string; amount: string; dueDate: string }>
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

export function useTransactionForm(editingTx: Transaction | null, onDone: () => void) {
  const { data: config } = useConfigurationQuery()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const createReceivable = useCreateReceivable()

  const categories = config?.masterData.categories ?? []
  const categoryKinds = config?.masterData.categoryKinds ?? {}
  const paymentSources = config?.masterData.paymentSources ?? []
  const paymentChannels = config?.masterData.paymentChannels ?? []
  const paymentSourceModes = config?.masterData.paymentSourceModes ?? {}
  const bnplProviders = config?.bnplProviders ?? []

  const todayIso = new Date().toISOString().slice(0, 10)
  const defaultExpenseCategory = useMemo(
    () => categories.find((c) => (categoryKinds[c] ?? 'expense') === 'expense') ?? '',
    [categories, categoryKinds],
  )
  const defaultSource = paymentSources[0] ?? ''
  const defaultChannel = paymentChannels[0] ?? ''

  const [form, setForm] = useState<TransactionFormState>(() =>
    editingTx
      ? txToForm(editingTx)
      : emptyForm(todayIso, defaultExpenseCategory, defaultSource, defaultChannel),
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
              category: categories.find((c) => categoryKinds[c] === 'expense') ?? f.category,
              advanceItems: f.advanceItems.length > 0 ? f.advanceItems : [{ person: '', amount: '', dueDate: todayIso }],
            }
          }
          return { ...f, isAdvancePayment: false }
        }
        if (key === 'source') {
          const nextSource = String(value)
          const mode = paymentSourceModes[nextSource] ?? 'direct'
          if (mode === 'bnpl') {
            const matchedProvider = bnplProviders.find((p) => p.name === nextSource)
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
    [categories, categoryKinds, paymentSourceModes, bnplProviders, todayIso],
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
    if (!Number.isFinite(amount) || amount <= 0) { setError('Nhập số tiền hợp lệ'); return }
    if (!form.occurredAt) { setError('Chọn ngày'); return }
    if (!editingTx && form.isAdvancePayment) {
      if (form.advanceItems.length === 0) { setError('Thêm ít nhất một dòng chi hộ.'); return }
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
      if (totalAdvance > amount) { setError('Số tiền chi hộ không được lớn hơn tổng giao dịch.'); return }
    }

    let paymentMode: PaymentMode = 'direct'
    if (form.type === 'expense') {
      paymentMode = paymentSourceModes[form.source] === 'bnpl' ? 'bnpl' : 'direct'
    }
    const matchedProvider = bnplProviders.find((p) => p.name === form.source)
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
        await updateMutation.mutateAsync({
          id: editingTx.id,
          payload: {
            type: basePayload.type,
            amount: basePayload.amount,
            occurredAt: basePayload.occurredAt,
            merchant: basePayload.merchant,
            channel: basePayload.channel,
            category: basePayload.category,
            source: basePayload.source,
            note: basePayload.note,
          },
        })
      } else {
        const tx = await createMutation.mutateAsync(basePayload)
        if (form.isAdvancePayment && tx) {
          for (let idx = 0; idx < form.advanceItems.length; idx++) {
            const item = form.advanceItems[idx]
            const advanceAmount = Number(String(item.amount).replace(/[.,\s]/g, ''))
            await createReceivable.mutateAsync({
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi lưu giao dịch.')
    } finally {
      setSubmitting(false)
    }
  }, [createMutation, updateMutation, createReceivable, form, editingTx, onDone, paymentSourceModes, bnplProviders])

  const visibleCategories = useMemo(
    () => categories.filter((c) => (categoryKinds[c] ?? 'expense') === form.type),
    [categories, categoryKinds, form.type],
  )

  return {
    form,
    update,
    addAdvanceItem,
    removeAdvanceItem,
    updateAdvanceItem,
    submit,
    error,
    submitting: submitting || createMutation.isPending || updateMutation.isPending,
    categories: visibleCategories,
    channels: paymentChannels,
    sources: paymentSources,
    sourceMode: (paymentSourceModes[form.source] ?? 'direct') as 'direct' | 'bnpl',
    sourceStatementDay: config?.masterData.paymentSourceStatementDays[form.source],
    isEditing: editingTx !== null,
  }
}
