'use client'

import { useState, useEffect } from 'react'
import { CATEGORY_META, CATEGORY_COLOR, LEVELS } from '@/lib/tournament'
import { useStoredValue, setStoredValue } from '@/lib/hooks'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The public MVP vote — one MVP per division, so four votes per visitor.
 *
 * Each division is voted independently: voting in the 1ª reveals that
 * division's tally and leaves the other three still open. A browser gets one
 * vote in each, enforced server-side by a UNIQUE index on (voter_token, level);
 * localStorage only remembers what this device already did so the UI can show
 * results instead of buttons.
 */

const VOTES_KEY  = 'mvp_voted_by_level'
const LEGACY_KEY = 'mvp_voted_for'      // the old single global vote

/** One stable token per browser. */
function getVoterToken() {
  let token = localStorage.getItem('mvp_voter_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('mvp_voter_token', token)
  }
  return token
}

function parseVotes(raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function MvpVoter({ players }) {
  const [loading, setLoading] = useState(null)   // player id being submitted
  const [error,   setError]   = useState('')
  const [counts,  setCounts]  = useState({})
  const [byLevel, setByLevel] = useState({})
  const [query,   setQuery]   = useState('')

  const stored = useStoredValue(VOTES_KEY, null)
  const legacy = useStoredValue(LEGACY_KEY, null)

  // A vote cast before the split was a vote in that player's division, so it
  // still counts — carry it across rather than asking the visitor again.
  const myVotes = parseVotes(stored)
  if (legacy && !stored) {
    const player = players.find(p => p.id === legacy)
    if (player) myVotes[player.level] = legacy
  }

  const votedCount = LEVELS.filter(l => myVotes[l]).length

  useEffect(() => {
    fetch('/api/mvp/counts')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return
        setCounts(data.counts ?? {})
        setByLevel(data.byLevel ?? {})
      })
      .catch(() => {})
  }, [])

  async function refreshCounts() {
    const res = await fetch('/api/mvp/counts')
    if (!res.ok) return
    const data = await res.json()
    setCounts(data.counts ?? {})
    setByLevel(data.byLevel ?? {})
  }

  async function handleVote(player) {
    setLoading(player.id)
    setError('')
    try {
      const res = await fetch('/api/mvp/vote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ player_id: player.id, voter_token: getVoterToken() }),
      })
      const data = await res.json().catch(() => ({}))

      if (data.error === 'already_voted') {
        setError(`Este dispositivo ya había votado en ${CATEGORY_META[player.level].name}.`)
        setStoredValue(VOTES_KEY, JSON.stringify({ ...myVotes, [player.level]: 'otro' }))
        await refreshCounts()
      } else if (!res.ok) {
        setError(data.error && res.status === 503
          ? data.error
          : 'No se pudo registrar el voto. Inténtalo de nuevo.')
      } else {
        setStoredValue(VOTES_KEY, JSON.stringify({ ...myVotes, [player.level]: player.id }))
        await refreshCounts()
      }
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const q = query.trim().toLowerCase()
  const matches = p => !q || p.name.toLowerCase().includes(q) || (p.pair ?? '').toLowerCase().includes(q)

  return (
    <div>
      {/* ── Status banner ── */}
      <div
        className={cn(
          'mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4',
          votedCount === LEVELS.length
            ? 'border-brand-200 bg-accent-soft dark:border-brand-500/25'
            : 'border-sand-200 bg-sand-50/70 dark:border-sand-400/25 dark:bg-sand-400/[0.07]',
        )}
      >
        <p className="text-[13.5px] text-fg-muted">
          {votedCount === LEVELS.length ? (
            <><span className="font-medium text-fg">¡Gracias por votar!</span> Ya has elegido
            MVP en las cuatro divisiones. Estos son los resultados en directo.</>
          ) : (
            <><span className="font-medium text-fg">Hay un MVP por división.</span> Vota en cada
            una por quien más te haya impresionado: un voto por dispositivo y división.</>
          )}
        </p>
        <Badge tone={votedCount > 0 ? 'accent' : 'neutral'} size="md" className="ml-auto">
          {votedCount}/{LEVELS.length} votadas
        </Badge>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {/* ── Search ── */}
      <div className="relative mb-8">
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
          placeholder="Buscar jugador o pareja…"
          aria-label="Buscar jugador"
          className="h-11 w-full rounded-xl border border-hairline bg-surface pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>

      {/* ── One independent vote per division ── */}
      <div className="space-y-10">
        {LEVELS.map(level => {
          const inDivision = players.filter(p => p.level === level)
          const shown      = inDivision.filter(matches)
          // Summed from the division's own players rather than taken from the
          // API, so the percentages are right even before migration 0005 adds
          // the `level` column that `byLevel` comes from.
          const total = byLevel[level]
            ?? inDivision.reduce((sum, p) => sum + (counts[p.id] ?? 0), 0)

          return (
            <DivisionVote
              key={level}
              level={level}
              players={shown}
              hidden={inDivision.length > 0 && shown.length === 0}
              myVote={myVotes[level] ?? null}
              counts={counts}
              total={total}
              loading={loading}
              onVote={handleVote}
            />
          )
        })}
      </div>
    </div>
  )
}

function DivisionVote({ level, players, hidden, myVote, counts, total, loading, onVote }) {
  const voted  = Boolean(myVote)
  const leader = Math.max(0, ...players.map(p => counts[p.id] ?? 0))

  const ordered = voted
    ? [...players].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.name.localeCompare(b.name, 'es'))
    : players

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-hairline pb-3">
        <span className={cn('h-2.5 w-2.5 rounded-full', CATEGORY_COLOR[level].dot)} />
        <h3 className="mr-auto font-display text-xl text-fg">
          MVP · {CATEGORY_META[level].name}
        </h3>
        {voted ? (
          <Badge tone="accent" size="sm">
            {total} {total === 1 ? 'voto' : 'votos'}
          </Badge>
        ) : (
          <Badge tone="sand" size="sm">Tu voto pendiente</Badge>
        )}
      </div>

      {hidden ? (
        <p className="py-6 text-center text-[13px] text-fg-subtle">
          Ningún jugador de esta división coincide con la búsqueda.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map(player => {
            const votes    = counts[player.id] ?? 0
            const pct      = total > 0 ? Math.round((votes / total) * 100) : 0
            const isMine   = myVote === player.id
            const isLeader = voted && votes > 0 && votes === leader

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
                    {player.pair && (
                      <p className="mt-0.5 truncate text-[11px] text-fg-subtle">{player.pair}</p>
                    )}
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
                    onClick={() => onVote(player)}
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
    </section>
  )
}
