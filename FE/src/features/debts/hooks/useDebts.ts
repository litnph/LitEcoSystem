import { useCallback, useState } from 'react'
import { usePfm } from '../../../app/PfmProvider'

export function useDebts() {
  const { state, dispatch } = usePfm()
  const [title, setTitle] = useState('')
  const [lender, setLender] = useState('')
  const [principal, setPrincipal] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const addDebt = useCallback(() => {
    const p = Number(String(principal).replace(/\D/g, ''))
    if (!title.trim() || !lender.trim() || !Number.isFinite(p) || p <= 0 || !dueDate) {
      return
    }
    dispatch({
      type: 'ADD_DEBT',
      payload: { title: title.trim(), lender: lender.trim(), principal: p, dueDate },
    })
    setTitle('')
    setLender('')
    setPrincipal('')
    setDueDate('')
  }, [dispatch, title, lender, principal, dueDate])

  const payDebt = useCallback(() => {
    if (!paymentDebtId) return
    const amt = Number(String(paymentAmount).replace(/\D/g, ''))
    if (!Number.isFinite(amt) || amt <= 0) return
    dispatch({
      type: 'ADD_DEBT_PAYMENT',
      payload: { debtId: paymentDebtId, amount: amt },
    })
    setPaymentDebtId(null)
    setPaymentAmount('')
  }, [dispatch, paymentDebtId, paymentAmount])

  return {
    debts: state.debts,
    title,
    setTitle,
    lender,
    setLender,
    principal,
    setPrincipal,
    dueDate,
    setDueDate,
    addDebt,
    paymentDebtId,
    setPaymentDebtId,
    paymentAmount,
    setPaymentAmount,
    payDebt,
  }
}
