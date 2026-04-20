import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useMemo, type ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'
import { useApiError } from './error/use-api-error'
import type { ApiErrorDetailItem } from './error/error-context'

function toDetails(value: unknown): ApiErrorDetailItem[] | undefined {
  if (Array.isArray(value)) {
    return value
      .map((item): ApiErrorDetailItem | null => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const field = typeof obj.field === 'string' ? obj.field
            : typeof obj.propertyName === 'string' ? obj.propertyName : undefined
          const message = typeof obj.message === 'string' ? obj.message
            : typeof obj.errorMessage === 'string' ? obj.errorMessage : undefined
          if (field || message) return { field, message }
        }
        return null
      })
      .filter((x): x is ApiErrorDetailItem => x !== null)
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([field, val]) => {
      if (Array.isArray(val)) return val.map((m) => ({ field, message: String(m) }))
      return [{ field, message: String(val) }]
    })
  }
  return undefined
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const { showError } = useApiError()

  const client = useMemo(() => {
    const handle = (err: unknown) => {
      if (!(err instanceof ApiError)) return
      // 401 đã được xử lý riêng (refresh hoặc đăng xuất)
      if (err.status === 401) return
      showError({
        title: err.status >= 500 ? 'Lỗi máy chủ' : 'Yêu cầu không thành công',
        message: err.message,
        code: err.code,
        status: err.status,
        details: toDetails(err.details),
      })
    }

    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 2,
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0,
        },
      },
      mutationCache: new MutationCache({ onError: handle }),
      queryCache: new QueryCache({ onError: handle }),
    })
  }, [showError])

  return (
    <QueryClientProvider client={client}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
