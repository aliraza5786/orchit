// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 min “fresh”
      gcTime: 5 * 60_000,         // cache garbage collect after 5 min
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',      // or 'always' if you don’t care about offline
    },
    mutations: {
      networkMode: 'online',
      retry: 0,
    },
  },
})
