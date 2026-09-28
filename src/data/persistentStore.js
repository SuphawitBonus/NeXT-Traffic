import { useSyncExternalStore } from 'react'

// Tiny shared store persisted to localStorage; storage can be unavailable
// (private mode, blocked site data), so every access is best-effort.
export function createPersistentStore(key, initial) {
  let state = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) state = JSON.parse(raw)
  } catch {
    // keep initial
  }

  const listeners = new Set()

  function set(updater) {
    state = typeof updater === 'function' ? updater(state) : updater
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // in-memory only
    }
    listeners.forEach((l) => l())
  }

  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function useStore() {
    return useSyncExternalStore(subscribe, () => state)
  }

  return { get: () => state, set, useStore }
}
