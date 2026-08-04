'use client'

import { useState, useEffect } from 'react'
import { CATEGORY_META } from '@/lib/tournament'
import { useStoredValue, setStoredValue } from '@/lib/hooks'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/** One stable token per browser, so a device can only vote once. */
function getVoterToken() {
  let token = localStorage.getItem('mvp_voter_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('mvp_voter_token', token)
  }
  return token
}

export default function MvpVoter({ players }) {
  const [loading,  setLoading]  = useState(null)   // id being submitted
  const [error,    setError]    = useState('')
  const [counts,   setCounts]   = useState({})
  const [query,    setQuery]    = useState('')

  // The prior vote lives in localStorage, read through an external store so
  // the server and client agree on first paint without a cascading render.
  const votedFor = useStoredValue('mvp_voted_for', null)
  const voted    = votedFor !== null

  useEffect(() => {
    fetch('/api/mvp/counts')
      .then(res => (res.ok ? res.json() : {}))
      .then(setCounts)
      .catch(() => {})
  }, [])

  async function refreshCounts() {
    const res = await fetch('/api/mvp/counts')
    if (res.ok) setCounts(await res.json())
  }

  async function handleVote(playerId) {
    setLoading(playerId)
    setError('')
    try {
      const res = await fetch('/api/mvp/vote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ player_id: playerId, voter_token: getVoterToken() }),
      })
      const data = await res.json().catch(() => ({}))

      if (data.error === 'already_voted') {
        setError('Este dispositivo ya había votado.')
        await refreshCounts()
      } else if (!res.ok) {
        setError('No se pudo registrar el voto. Inténtalo de nuevo.')
      } else {
        setStoredValue('mvp_voted_for', playerId)
        await refreshCounts()
      }
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const totalVotes = Object.values(counts).reduce((s, n) => s + n, 0)
  const leader     = Math.max(0, ...Object.values(counts))

  const visible = players.filter(p =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const ordered = voted
    ? [...visible].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.name.localeCompare(b.name, 'es'))
    : visible

  return (
    <div>
      {/* ── Status banner ── */}
      <div
        className={cn(
          'mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4',
          voted
            ? 'border-brand-200 bg-accent-soft dark:border-brand-500/25'
            : 'border-sand-200 bg-sand-50/70 dark:border-sand-400/25 dark:bg-sand-400/[0.07]',
        )}
      >
        <p className="text-[13.5px] text-fg-muted">
          {voted ? (
            <><span className="font-medium text-fg">¡Gracias por votar!</span> Estos son los resultados en directo.</>
          ) : (
            <><span className="font-medium text-fg">Vota por quien más te haya impresionado.</span> Un solo voto por dispositivo.</>
          )}
        </p>
        {voted && (
          <Badge tone="accent" size="md" className="ml-auto">
            {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
          </Badge>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {/* ── Search ── */}
      <div className="relative mb-6">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar jugador…"
          aria-label="Buscar jugador"
          className="h-11 w-full rounded-xl border border-hairline bg-surface pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>

      {ordered.length === 0 ? (
        <p className="py-12 text-center text-sm text-fg-subtle">
          Ningún jugador coincide con «{query}».
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map(player => {
            const votes      = counts[player.id] ?? 0
            const pct        = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            const isMine     = votedFor === player.id
            const isLeader   = voted && votes > 0 && votes === leader

            return (
              <div
                key={player.id}
                className={cn(
                  'rounded-2xl border bg-surface p-4 transition-all duration-200',
                  isMine
                    ? 'border-sand-300 shadow-sm ring-1 ring-sand-300/40 dark:border-sand-400/40'
                    : 'border-hairline hover:border-hairline-strong hover:shadow-sm',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-fg">{player.name}</p>
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      {CATEGORY_META[player.level]?.name ?? `Categoría ${player.level}`}
                    </p>
                  </div>
                  {isMine   && <span title="Tu voto" aria-label="Tu voto">⭐</span>}
                  {!isMine && isLeader && <span title="Más votado" aria-label="Más votado">🏆</span>}
                </div>

                {voted ? (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="tabular font-mono text-[11px] text-fg-subtle">
                        {votes} {votes === 1 ? 'voto' : 'votos'}
                      </span>
                      <span className="tabular font-mono text-[11px] font-medium text-accent">{pct}%</span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-surface-2"
                      role="meter"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${player.name}: ${pct}%`}
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleVote(player.id)}
                    disabled={loading !== null}
                    className="h-9 w-full rounded-lg bg-accent text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
                  >
                    {loading === player.id ? 'Enviando…' : 'Votar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
