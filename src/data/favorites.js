import { createPersistentStore } from './persistentStore'

const store = createPersistentStore('nexttraffic:favoriteCameras', [])

export function useFavoriteIds() {
  return store.useStore()
}

export function toggleFavorite(id) {
  store.set((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
}
