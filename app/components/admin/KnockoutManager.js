'use client'

import {
  LEVELS, CATEGORY_META, CATEGORY_COLOR, CATEGORY_RULES, ROUNDS,
} from '@/lib/tournament'
import { useAdminApi, Flash } from './useAdminApi'
import Badge from '../ui/Badge'
import { cn } from '@/lib/cn'

/**
 * Drives the knockout stage in the order it actually happens:
 *
 *   1. draw each division's quarterfinals from its finished group table
 *   2. once every quarterfinal is played, form the squads and seed the semis
 *   3. once both semifinals are settled, set up the final
 *
 * Every step is safe to repeat — nothing already played is overwritten.
 */
export default function KnockoutManager({ divisions, squads, bracket }) {
  const { send, busy, flash, setFlash } = useAdminApi()

  const semis = bracket.filter(b => b.round === 'semifinal')
  const final = bracket.find(b => b.round === 'final')

  const allQuartersDone = LEVELS.every(l => divisions[l].quartersPlayed === CATEGORY_RULES[l].quarterfinals)
  const squadsFormed    = squads.length > 0
  const semisResolved   = semis.length === 2 && semis.every(s => s.resolution.winnerSquadId)

  return (
    <div>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {/* ── Step 1: quarterfinals, division by division ── */}
      <Step
        n="1"
        title="Sortear los cuartos"
        note="Se juegan por parejas, no por equipos. Necesita la fase de grupos terminada."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {LEVELS.map(level => {
            const d = divisions[level]
            const rules = CATEGORY_RULES[level]
            const key = `qf-${level}`
            return (
              <div key={level} className="rounded-xl border border-hairline bg-surface p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', CATEGORY_COLOR[level].dot)} />
                  <span className="mr-auto font-display text-base text-fg">
                    {CATEGORY_META[level].name}
                  </span>
                  <Badge tone={d.groupsDone ? 'accent' : 'neutral'} size="xs">
                    Grupos {d.groupsPlayed}/{d.groupsTotal}
                  </Badge>
                </div>

                <p className="mb-3 text-[11.5px] text-fg-muted">
                  {rules.byes > 0 ? '1ª descansa · ' : ''}
                  {rules.quarterfinals} cruces ·{' '}
                  <span className={d.quartersDrawn ? 'text-fg' : 'text-fg-subtle'}>
                    {d.quartersDrawn ? `sorteados (${d.quartersPlayed}/${rules.quarterfinals} jugados)` : 'sin sortear'}
                  </span>
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => send('/api/bracket/quarterfinals', { body: { level }, key })}
                    disabled={!d.groupsDone || busy === key}
                    title={d.groupsDone ? undefined : 'Termina la fase de grupos primero'}
                    className="h-8 rounded-lg bg-accent px-3 text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
                  >
                    {busy === key ? 'Sorteando…' : d.quartersDrawn ? 'Volver a sortear' : 'Sortear cuartos'}
                  </button>
                  {d.quartersDrawn && d.quartersPlayed === 0 && (
                    <button
                      onClick={() => send(`/api/bracket/quarterfinals?level=${level}`, { method: 'DELETE', key: `del-${level}` })}
                      disabled={busy === `del-${level}`}
                      className="h-8 rounded-lg px-2.5 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Step>

      {/* ── Step 2: form the squads ── */}
      <Step
        n="2"
        title="Formar los equipos"
        note="Las cuatro supervivientes de cada división se ordenan y se agrupan por rango."
        done={squadsFormed}
      >
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="mb-3 grid gap-1.5 sm:grid-cols-2">
            {LEVELS.map(level => {
              const d = divisions[level]
              const ok = d.quartersPlayed === CATEGORY_RULES[level].quarterfinals
              return (
                <div key={level} className="flex items-center gap-2 text-[12px]">
                  <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-accent' : 'bg-hairline-strong')} />
                  <span className="text-fg-muted">{CATEGORY_META[level].name}</span>
                  <span className={cn('tabular ml-auto font-mono text-[11px]', ok ? 'text-accent' : 'text-fg-subtle')}>
                    {d.survivors}/4 vivas
                  </span>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => send('/api/bracket/form-squads', { key: 'squads' })}
            disabled={!allQuartersDone || busy === 'squads'}
            title={allQuartersDone ? undefined : 'Faltan cuartos por jugar'}
            className="h-9 rounded-lg bg-accent px-4 text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
          >
            {busy === 'squads'
              ? 'Formando…'
              : squadsFormed ? 'Rehacer equipos y semifinales' : 'Formar equipos y sortear semifinales'}
          </button>

          {squadsFormed && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {squads.map(squad => (
                <div key={squad.id} className="rounded-lg border border-hairline bg-surface-2/50 p-3">
                  <p className="mb-1.5 font-display text-base text-fg">{squad.name}</p>
                  <ul className="space-y-0.5">
                    {LEVELS.map(level => (
                      <li key={level} className="flex items-center gap-1.5">
                        <span className={cn('h-1 w-1 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)} />
                        <span className="w-4 shrink-0 font-display text-[10px] text-fg-subtle">
                          {CATEGORY_META[level].short}
                        </span>
                        <span className="truncate text-[11px] text-fg-muted">
                          {squad.membersByCategory?.[level]?.name ?? '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Step>

      {/* ── Step 3: the final ── */}
      <Step
        n="3"
        title="Montar la final"
        note="Con los dos equipos ganadores de las semifinales."
        done={!!final?.squad1_id}
        last
      >
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="mb-3 space-y-1.5">
            {semis.length > 0 ? semis.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-[12px]">
                <span className={cn('h-1.5 w-1.5 rounded-full', s.resolution.winnerSquadId ? 'bg-accent' : 'bg-hairline-strong')} />
                <span className="text-fg-muted">
                  {ROUNDS.semifinal.short} {s.position}: {s.squad1?.name ?? '—'} vs {s.squad2?.name ?? '—'}
                </span>
                <span className="tabular ml-auto font-mono text-[11px] text-fg-subtle">
                  {s.resolution.score.squad1.matches}–{s.resolution.score.squad2.matches}
                </span>
              </div>
            )) : (
              <p className="text-[12px] text-fg-subtle">Las semifinales aún no están sorteadas.</p>
            )}
          </div>

          <button
            onClick={() => send('/api/bracket/final', { key: 'final' })}
            disabled={!semisResolved || busy === 'final'}
            title={semisResolved ? undefined : 'Ambas semifinales deben estar resueltas'}
            className="h-9 rounded-lg bg-sand-500 px-4 text-xs font-medium text-sand-950 transition-all hover:brightness-105 disabled:opacity-40"
          >
            {busy === 'final' ? 'Montando…' : 'Montar la final'}
          </button>
        </div>
      </Step>
    </div>
  )
}

function Step({ n, title, note, children, done = false, last = false }) {
  return (
    <section className={cn('relative pl-9', !last && 'pb-8')}>
      {!last && <span className="absolute left-3.5 top-8 bottom-0 w-px bg-hairline" aria-hidden="true" />}
      <span
        className={cn(
          'tabular absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[11px]',
          done ? 'bg-accent text-accent-fg' : 'border border-hairline bg-surface text-fg-muted',
        )}
      >
        {done ? '✓' : n}
      </span>
      <h3 className="font-display text-xl text-fg">{title.toUpperCase()}</h3>
      <p className="mb-3.5 mt-0.5 text-[11.5px] text-fg-subtle">{note}</p>
      {children}
    </section>
  )
}
