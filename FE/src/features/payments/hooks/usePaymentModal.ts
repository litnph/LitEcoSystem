import { useCallback, useState } from 'react'
import type { ConfirmedStatement } from '../../../entities'
import { usePfm } from '../../../app/PfmProvider'

const PAY_SOURCES = ['Cash', 'Vietcombank', 'Techcombank', 'ShopeePay'] as const

export function usePaymentModal() {
  const { dispatch } = usePfm()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<string>(PAY_SOURCES[0])

  const open = useCallback((s: ConfirmedStatement) => {
    setPayingId(s.id)
    setAmount(String(s.total))
    setSource(PAY_SOURCES[0])
  }, [])

  const close = useCallback(() => {
    setPayingId(null)
  }, [])

  const confirm = useCallback(() => {
    if (!payingId) return
    dispatch({ type: 'PAY_CONFIRMED_STATEMENT', payload: { statementId: payingId } })
    setPayingId(null)
  }, [dispatch, payingId])

  return {
    payingId,
    amount,
    setAmount,
    source,
    setSource,
    paySources: PAY_SOURCES,
    open,
    close,
    confirm,
  }
}
