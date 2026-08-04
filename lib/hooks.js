'use client'

import { useSyncExternalStore } from 'react'

/**
 * Browser-only state, read the way React 19 wants it read.
 *
 * The obvious approach — `useEffect(() => setX(localStorage…), [])` — triggers
 * a cascading render and makes the React Compiler bail out of optimizing the
 * component. `useSyncExternalStore` expresses the same thing directly: a value
 * that lives outside React, with an explicit server snapshot so hydration
 * matches.
 */

function subscribeToStorage(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener('urbanova:storage', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('urbanova:storage', callback)
  }
}

/** Reads a localStorage key. Returns `serverValue` during SSR and first paint. */
export function useStoredValue(key, serverValue = null) {
  return useSyncExternalStore(
    subscribeToStorage,
    () => {
      try { return localStorage.getItem(key) } catch { return serverValue }
    },
    () => serverValue,
  )
}

/** Writes a key and notifies every `useStoredValue` in this tab. */
export function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value)
    window.dispatchEvent(new Event('urbanova:storage'))
  } catch { /* private mode, quota — the UI still works, it just will not persist */ }
}

function subscribeToTheme(callback) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/**
 * True when the dark class is on <html>. The class itself is applied by the
 * inline script in layout.js before first paint, so this only observes it.
 */
export function useIsDark() {
  return useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  )
}
