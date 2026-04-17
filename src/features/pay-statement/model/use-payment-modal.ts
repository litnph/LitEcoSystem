import { useState } from 'react'
import type { ConfirmedStatement } from '@/entities/spending-cycle'
import { usePatchStatementStatus } from '@/features/manage-spending-cycle'

export type PaymentForm = {
  amount: string
  paidAt: string
  note: string
}

export function usePaymentModal() {
  const [selectedStatement, setSelectedStatement] = useState<ConfirmedStatement | null>(null)
  const [form, setForm] = useState<PaymentForm>({ amount: '', paidAt: '', note: '' })
  const [error, setError] = useState<string | null>(null)
  const patchStatus = usePatchStatementStatus()

  function openModal(statement: ConfirmedStatement) {
    setSelectedStatement(statement)
    setForm({
      amount: String(statement.total),
      paidAt: new Date().toISOString().slice(0, 10),
      note: '',
    })
    setError(null)
  }

  function closeModal() {
    setSelectedStatement(null)
    setError(null)
  }

  function updateForm<K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  async function submitPayment(): Promise<boolean> {
    if (!selectedStatement) return false
    const amount = Number(String(form.amount).replace(/[.,\s]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Nhập số tiền hợp lệ')
      return false
    }
    try {
      await patchStatus.mutateAsync({ id: selectedStatement.id, paid: true })
      closeModal()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi cập nhật sao kê.')
      return false
    }
  }

  return {
    selectedStatement,
    form,
    error,
    submitting: patchStatus.isPending,
    openModal,
    closeModal,
    updateForm,
    submitPayment,
  }
}
