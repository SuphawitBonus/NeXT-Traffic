import { useEffect, useSyncExternalStore } from 'react'
import { createPersistentStore } from '../data/persistentStore'

// Stored preference: 'light' | 'dark', or null to follow the OS setting.
// index.html applies the same rule before first paint to avoid a flash.
const store = createPersistentStore('nexttraffic:theme', null)
const media = window.matchMedia('(prefers-color-scheme: light)')

function subscribeSystem(callback) {
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export function useTheme() {
  const preference = store.useStore()
  const system = useSyncExternalStore(subscribeSystem, () => (media.matches ? 'light' : 'dark'))
  const theme = preference ?? system

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggle() {
    const root = document.documentElement
    // Briefly animate colour changes; a permanent transition on everything would slow hovers
    root.classList.add('theme-anim')
    setTimeout(() => root.classList.remove('theme-anim'), 400)
    store.set(theme === 'light' ? 'dark' : 'light')
  }

  return { theme, toggle }
}
