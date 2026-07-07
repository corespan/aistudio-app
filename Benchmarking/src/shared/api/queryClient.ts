import { QueryCache, QueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

type ErrorNotification = {
  id?: string
  title: string
  message?: string
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const meta = query.meta?.errorNotification as ErrorNotification | undefined
      if (!meta) return
      notifications.show({
        id: meta.id,
        color: 'red',
        title: meta.title,
        message: meta.message ?? (error instanceof Error ? error.message : ''),
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Dev-only: expose the client on window so the cache can be inspected from the
// browser console (e.g. `queryClient.getQueryData(['benchmark-options','benchmarks'])`).
if (import.meta.env.DEV) {
  ;(window as unknown as { queryClient: typeof queryClient }).queryClient = queryClient
}
