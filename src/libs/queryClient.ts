// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 10 * 60_000,
      retry: 1,
      
      // networkMode: 'online',
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // (optional)
      refetchOnMount: false,   
    },
    mutations: {
      // networkMode: 'online',
      retry: 0,
    },
  },
})
