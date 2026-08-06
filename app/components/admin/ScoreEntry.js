'use client'

import { useState, useMemo } from 'react'
import { CATEGORY_META, LEVELS, ROUNDS, formatFor } from '@/lib/tournament'
import { useAdminApi, Flash } from './useAdminApi'
import Badge from '../ui/Badge'
import { cn } from '@/lib/cn'

const EMPTY = [
  { team1_score: '', team2_score: '' },
  { team1_score: '', team2_score: '' },
  { team1_score: '', team2_score: '' },
]

/**
 * Score entry for every match in the tournament, group stage and knockout.
 *
 * The third-set inputs only appear once each side has taken a set, which is
 * exactly when a super tiebreak is needed.
 */
export default function ScoreEntry({ matches }) {
  const { send, busy, flash, setFlash } = useAdminApi()

  const [selectedId, setSelectedId] = useState(null)
  const [sets, setSets] = useState(EMPTY)
  const [filter, setFilter] = useState('all')
  const [showDone, setShowDone] = useState(false)

  const pending   = matches.filter(m => !m.completed)
  const completed = matches.filter(m => m.completed)

  const visible = useMemo(() => {
    const list = showDone ? completed : pending
    return filter === 'all' ? list : list.filter(m => m.level === Number(filter))
  }, [showDone, filter, pending, completed])

  const selected = matches.find(m => m.id === selectedId)

  function pick(match) {
    setSelectedId(match.id)
    setFlash(null)
    // Pre-fill when correcting an existing result.
    const existing = (match.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)
    setSets(
      existing.length
        ? EMPTY.map((blank, i) =>
            existing[i]
              ? { team1_score: existing[i].team1_score, team2_score: existing[i].team2_score }
              : blank,
          )
        : EMPTY,
    )
  }

  /**
   * @param {number} i    which set
   * @param {1|2}    side which pair
   *
   * The state key is derived here and nowhere else. An earlier version let the
   * caller pass the key as a string, and `SetRow` passed 'team1' instead of
   * 'team1_score' — so every keystroke wrote to a field nothing read, the
   * controlled input re-rendered empty, and the boxes silently refused input
   * with no error anywhere. Taking a side number makes that impossible.
   */
  function update(i, side, raw) {
    const key = side === 2 ? 'team2_score' : 'team1_score'
    setSets(prev => prev.map((s, idx) =>
      idx === i ? { ...s, [key]: raw === '' ? '' : Number(raw) } : s,
    ))
  }

  // Group-stage matches are a single set; from the quarterfinals on it is
  // best of two with a super tiebreak, which only appears once they split.
  const format   = formatFor(selected?.stage ?? 'group_stage')
  const baseSets = format.sets

  const filled = i => sets[i].team1_score !== '' && sets[i].team2_score !== ''
  const wonBy  = (i, side) =>
    filled(i) && Number(sets[i][`team${side}_score`]) > Number(sets[i][`team${side === 1 ? 2 : 1}_score`])

  const baseIdx  = Array.from({ length: baseSets }, (_, i) => i)
  const allBase  = baseIdx.every(filled)
  const t1Base   = baseIdx.filter(i => wonBy(i, 1)).length
  const t2Base   = baseIdx.filter(i => wonBy(i, 2)).length
  const needsDecider = format.superTiebreak && allBase && t1Base === t2Base
  const canSubmit = allBase && (!needsDecider || filled(baseSets))

  async function submit() {
    if (!canSubmit || !selected) return
    const payload = [
      ...baseIdx.map(i => sets[i]),
      ...(needsDecider ? [sets[baseSets]] : []),
    ].map((s, i) => ({
      set_number:  i + 1,
      team1_score: Number(s.team1_score),
      team2_score: Number(s.team2_score),
    }))

    const r = await send(`/api/matches/${selected.id}/score`, {
      body: { sets: payload },
      key: 'score',
      okMessage: `Resultado guardado: ${selected.team1?.name} vs ${selected.team2?.name}`,
    })
    if (r.ok) { setSelectedId(null); setSets(EMPTY) }
  }

  async function reset(match) {
    if (!confirm(`¿Borrar el resultado de ${match.team1?.name} vs ${match.team2?.name}?`)) return
    await send(`/api/matches/${match.id}/reset`, { key: match.id, okMessage: 'Resultado borrado' })
    if (selectedId === match.id) { setSelectedId(null); setSets(EMPTY) }
  }

  return (
    <div>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Match list ── */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-hairline bg-surface-2 p-0.5">
              {[
                { key: false, label: `Pendientes (${pending.length})` },
                { key: true,  label: `Jugados (${completed.length})` },
              ].map(tab => (
                <button
                  key={String(tab.key)}
                  onClick={() => { setShowDone(tab.key); setSelectedId(null) }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    showDone === tab.key ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Filtrar por categoría"
              className="ml-auto h-8 rounded-lg border border-hairline bg-surface px-2.5 text-xs text-fg"
            >
              <option value="all">Todas las categorías</option>
              {LEVELS.map(l => (
                <option key={l} value={l}>{CATEGORY_META[l].name}</option>
              ))}
            </select>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-hairline-strong px-4 py-10 text-center text-sm text-fg-subtle">
              {showDone ? 'Todavía no hay resultados registrados.' : '🎾 No queda ningún partido pendiente.'}
            </p>
          ) : (
            <div className="max-h-[640px] space-y-1.5 overflow-y-auto pr-1">
              {visible.map(match => (
                <MatchRow
                  key={match.id}
                  match={match}
                  selected={selectedId === match.id}
                  onSelect={() => pick(match)}
                  onReset={() => reset(match)}
                  resetting={busy === match.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Score form ── */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-hairline-strong bg-surface-2/40 px-5 py-12 text-center">
              <p className="text-sm text-fg-subtle">
                Selecciona un partido para introducir su resultado.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Badge tone="neutral" size="xs">{CATEGORY_META[selected.level].short}</Badge>
                <span className="text-[11px] text-fg-subtle">
                  {ROUNDS[selected.stage]?.label ?? 'Fase de grupos'} · {format.label}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-[1fr_64px_1fr] items-center gap-2">
                <p className="truncate text-xs font-medium text-fg">{selected.team1?.name}</p>
                <p className="text-center text-[10px] text-fg-subtle">vs</p>
                <p className="truncate text-right text-xs font-medium text-fg">{selected.team2?.name}</p>
              </div>

              {baseIdx.map(i => (
                <SetRow
                  key={i}
                  label={baseSets === 1 ? 'SET' : `SET ${i + 1}`}
                  value={sets[i]}
                  onChange={(side, v) => update(i, side, v)}
                />
              ))}

              {needsDecider && (
                <SetRow
                  label="SUPER TB"
                  accent
                  max={30}
                  value={sets[baseSets]}
                  onChange={(side, v) => update(baseSets, side, v)}
                />
              )}

              <button
                onClick={submit}
                disabled={!canSubmit || busy === 'score'}
                className="mt-4 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
              >
                {busy === 'score' ? 'Guardando…' : 'Guardar resultado'}
              </button>

              <button
                onClick={() => { setSelectedId(null); setSets(EMPTY) }}
                className="mt-2 h-9 w-full rounded-lg text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SetRow({ label, value, onChange, accent = false, max = 7 }) {
  const input = cn(
    'tabular h-12 rounded-xl border bg-surface text-center font-mono text-xl text-fg',
    'transition-colors focus:outline-none',
    accent ? 'border-sand-300 focus:border-sand-500' : 'border-hairline focus:border-accent',
  )
  return (
    <div className="mb-2.5 grid grid-cols-[1fr_64px_1fr] items-center gap-2">
      <input
        type="number" min="0" max={max} inputMode="numeric"
        value={value.team1_score}
        onChange={e => onChange(1, e.target.value)}
        placeholder="0"
        aria-label={`${label} — local`}
        className={input}
      />
      <p className={cn('text-center text-[10px] font-medium', accent ? 'text-sand-600' : 'text-fg-subtle')}>
        {label}
      </p>
      <input
        type="number" min="0" max={max} inputMode="numeric"
        value={value.team2_score}
        onChange={e => onChange(2, e.target.value)}
        placeholder="0"
        aria-label={`${label} — visitante`}
        className={input}
      />
    </div>
  )
}

function MatchRow({ match, selected, onSelect, onReset, resetting }) {
  const sets = (match.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all',
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-hairline bg-surface hover:border-hairline-strong',
      )}
    >
      <button onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <Badge tone="neutral" size="xs">{CATEGORY_META[match.level].short}</Badge>
          <p className="truncate text-[13px] text-fg">
            <span className={match.winner_id === match.team1_id ? 'font-medium' : ''}>
              {match.team1?.name ?? '—'}
            </span>
            <span className="text-fg-subtle"> vs </span>
            <span className={match.winner_id === match.team2_id ? 'font-medium' : ''}>
              {match.team2?.name ?? '—'}
            </span>
          </p>
        </div>
        {sets.length > 0 && (
          <p className="tabular mt-1 font-mono text-[11px] text-fg-subtle">
            {sets.map(s => `${s.team1_score}–${s.team2_score}`).join('  ')}
          </p>
        )}
      </button>

      {match.completed && (
        <button
          onClick={onReset}
          disabled={resetting}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
        >
          {resetting ? '…' : 'Resetear'}
        </button>
      )}
    </div>
  )
}
