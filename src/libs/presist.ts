// src/libs/persist.ts
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import localforage from 'localforage'
import { queryClient } from './queryClient'

if (typeof window !== 'undefined') {
  // configure localforage (optional)
  localforage.config({ name: 'my-app', storeName: 'tanstack-query' })

  const persister = createAsyncStoragePersister({
    storage: {
      getItem: (key) => localforage.getItem<string>(key),
      setItem: (key, value) => localforage.setItem(key, value),
      removeItem: (key) => localforage.removeItem(key),
    },
    key: 'tanstack-query',
    throttleTime: 1000,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    // retry?: (err, operation) => true, // optional
  })

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24h
  })
}
