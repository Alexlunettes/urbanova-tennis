'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/admin')
        router.refresh()          // re-runs the server component so it sees the cookie
        return
      }

      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Error al iniciar sesión')
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-hairline bg-surface p-7 shadow-lg">
          <div className="mb-7 text-center">
            <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
                <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
              </svg>
            </span>
            <h1 className="font-display text-3xl text-fg">PANEL DE ADMIN</h1>
            <p className="mt-1 text-[13px] text-fg-muted">
              Acceso restringido a la organización.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              autoFocus
              aria-label="Contraseña de administración"
              className="h-11 w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
            >
              {loading ? 'Comprobando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
