import { useCallback, useState, type ReactNode } from 'react'
import { ApiErrorContext, type ApiErrorInfo } from './error-context'

export function ApiErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ApiErrorInfo | null>(null)

  const showError = useCallback((info: ApiErrorInfo) => {
    setError(info)
  }, [])

  const dismiss = useCallback(() => {
    setError(null)
  }, [])

  return (
    <ApiErrorContext.Provider value={{ error, showError, dismiss }}>
      {children}
      <ApiErrorModal error={error} onClose={dismiss} />
    </ApiErrorContext.Provider>
  )
}

function ApiErrorModal({ error, onClose }: { error: ApiErrorInfo | null; onClose: () => void }) {
  if (!error) return null

  const detailLines = (error.details ?? [])
    .map((item) => {
      if (typeof item === 'string') return item
      if (item.field && item.message) return `${item.field}: ${item.message}`
      return item.message ?? ''
    })
    .filter((s) => s.length > 0)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5zM2.697 16.126c-.866 1.5.21 3.374 1.95 3.374h14.706c1.74 0 2.816-1.874 1.95-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
          </span>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[#2C2215]">
              {error.title ?? 'Đã xảy ra lỗi'}
            </h3>
            <p className="mt-1 text-sm text-[#6B5B48]">{error.message}</p>

            {(error.code || error.status) && (
              <p className="mt-2 text-[11px] text-[#9E8E7C]">
                {error.code && <span className="font-mono">{error.code}</span>}
                {error.code && error.status ? ' · ' : ''}
                {error.status && <span>HTTP {error.status}</span>}
              </p>
            )}

            {detailLines.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {detailLines.map((line, idx) => (
                  <li key={idx}>• {line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary">
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
