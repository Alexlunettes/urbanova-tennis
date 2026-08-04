'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Shared request helper for every admin action.
 *
 * On success it calls `router.refresh()`, which re-runs the admin server
 * component and repaints only what changed — the old code did a full
 * `window.location.reload()`, losing scroll position and all form state.
 */
export function useAdminApi() {
  const router = useRouter()
  const [busy,  setBusy]  = useState(null)   // key of the in-flight action
  const [flash, setFlash] = useState(null)   // { type: 'ok'|'err', msg }

  const send = useCallback(async (url, { method = 'POST', body, key, okMessage } = {}) => {
    setBusy(key ?? url)
    setFlash(null)
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setFlash({ type: 'err', msg: data.error || `Error ${res.status}` })
        return { ok: false, data }
      }

      setFlash({ type: 'ok', msg: data.message || okMessage || 'Guardado' })
      router.refresh()
      return { ok: true, data }
    } catch (err) {
      setFlash({ type: 'err', msg: err.message || 'Error de red' })
      return { ok: false }
    } finally {
      setBusy(null)
    }
  }, [router])

  return { send, busy, flash, setFlash }
}

export function Flash({ flash, onDismiss }) {
  if (!flash) return null
  const ok = flash.type === 'ok'
  return (
    <div
      role="status"
      className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok
          ? 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300'
          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300'
      }`}
    >
      <span className="mt-px shrink-0">{ok ? '✓' : '✕'}</span>
      <p className="flex-1">{flash.msg}</p>
      <button onClick={onDismiss} className="shrink-0 opacity-50 hover:opacity-100" aria-label="Cerrar">
        ✕
      </button>
    </div>
  )
}
