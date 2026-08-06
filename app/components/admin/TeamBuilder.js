'use client'

import { useState } from 'react'
import { LEVELS, CATEGORY_META, CATEGORY_COLOR } from '@/lib/tournament'
import { cn } from '@/lib/cn'

/**
 * Hand-picks the four semifinal teams.
 *
 * The draw is made by the organisers, not by the site — players have real
 * availability constraints that only they know about, so nothing here is
 * generated or randomised in code. The component's only job is to make an
 * offline decision easy to record correctly: pick one surviving pair per
 * division for each of the four teams, and it refuses to let the same pair
 * appear twice.
 *
 * Saving hands the whole composition to the API in one request, which stores
 * it and seeds the semifinals.
 */
export default function TeamBuilder({ survivors, squads, onSave, onClear, busy }) {
  // Start from whatever is already saved, so reopening the panel shows the
  // current draw rather than four blank cards.
  const [teams, setTeams] = useState(() =>
    Array.from({ length: 4 }, (_, i) => {
      const existing = squads.find(s => s.seed === i + 1)
      return {
        name: existing?.name ?? `Equipo ${i + 1}`,
        members: Object.fromEntries(
          LEVELS.map(l => [l, existing?.membersByCategory?.[l]?.id ?? '']),
        ),
      }
    }),
  )

  function setMember(teamIndex, level, teamId) {
    setTeams(prev => prev.map((t, i) =>
      i === teamIndex ? { ...t, members: { ...t.members, [level]: teamId } } : t,
    ))
  }

  function setName(teamIndex, name) {
    setTeams(prev => prev.map((t, i) => (i === teamIndex ? { ...t, name } : t)))
  }

  /** teamId -> index of the team already using it, for the disabled state. */
  const claimed = {}
  teams.forEach((t, i) => {
    for (const level of LEVELS) {
      if (t.members[level]) claimed[t.members[level]] = i
    }
  })

  const filled   = teams.every(t => LEVELS.every(l => t.members[l]))
  const assigned = Object.keys(claimed).length

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <p className="mb-4 text-[12px] leading-relaxed text-fg-muted">
        Reparte las <span className="font-medium text-fg">16 parejas supervivientes</span> en
        cuatro equipos, una por división. El sorteo lo hacéis vosotros: la web no
        genera nada automáticamente. Las semifinales se montan solas al guardar —
        Equipo 1 contra Equipo 2, y Equipo 3 contra Equipo 4.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {teams.map((team, i) => {
          const complete = LEVELS.every(l => team.members[l])
          return (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-3.5 transition-colors',
                complete ? 'border-accent/30 bg-accent-soft/40' : 'border-hairline bg-surface-2/40',
              )}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface font-mono text-[11px] text-fg-muted ring-1 ring-hairline">
                  {i + 1}
                </span>
                <input
                  value={team.name}
                  onChange={e => setName(i, e.target.value)}
                  maxLength={60}
                  aria-label={`Nombre del equipo ${i + 1}`}
                  className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 font-display text-base text-fg focus:border-accent focus:outline-none"
                />
                <span className={cn('tabular font-mono text-[11px]', complete ? 'text-accent' : 'text-fg-subtle')}>
                  {LEVELS.filter(l => team.members[l]).length}/4
                </span>
              </div>

              <div className="space-y-1.5">
                {LEVELS.map(level => {
                  const options = survivors[level] ?? []
                  const current = team.members[level]
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span
                        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)}
                        aria-hidden="true"
                      />
                      <span
                        className="w-5 shrink-0 font-display text-[11px] text-fg-subtle"
                        title={CATEGORY_META[level].name}
                      >
                        {CATEGORY_META[level].short}
                      </span>
                      <select
                        value={current}
                        onChange={e => setMember(i, level, e.target.value)}
                        aria-label={`${CATEGORY_META[level].name} — equipo ${i + 1}`}
                        className={cn(
                          'h-8 min-w-0 flex-1 rounded-lg border bg-surface px-2 text-[12.5px] text-fg',
                          'focus:border-accent focus:outline-none',
                          current ? 'border-hairline' : 'border-dashed border-hairline-strong text-fg-subtle',
                        )}
                      >
                        <option value="">— Sin asignar —</option>
                        {options.map(o => {
                          const owner = claimed[o.id]
                          const mine  = current === o.id
                          return (
                            <option key={o.id} value={o.id} disabled={owner !== undefined && !mine}>
                              {o.name}{owner !== undefined && !mine ? ` — ya en Equipo ${owner + 1}` : ''}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSave(teams)}
          disabled={!filled || busy === 'teams'}
          title={filled ? undefined : 'Asigna las 16 parejas primero'}
          className="h-9 rounded-lg bg-accent px-4 text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
        >
          {busy === 'teams'
            ? 'Guardando…'
            : squads.length > 0 ? 'Actualizar equipos y semifinales' : 'Guardar equipos y montar semifinales'}
        </button>

        {squads.length > 0 && (
          <button
            onClick={onClear}
            disabled={busy === 'clear-teams'}
            className="h-9 rounded-lg px-3 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
          >
            {busy === 'clear-teams' ? 'Borrando…' : 'Deshacer sorteo'}
          </button>
        )}

        <span className="tabular ml-auto font-mono text-[11px] text-fg-subtle">
          {assigned}/16 parejas asignadas
        </span>
      </div>
    </div>
  )
}
