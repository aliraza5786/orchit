// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'online',
      retry: 0,
    },
  },
})
