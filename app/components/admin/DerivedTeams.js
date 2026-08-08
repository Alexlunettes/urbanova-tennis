'use client'

import { LEVELS, CATEGORY_META, CATEGORY_COLOR } from '@/lib/tournament'
import Badge from '../ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The four teams, as derived from the quarterfinal results.
 *
 * Nothing here is editable: the ranking comes out of how convincingly each pair
 * won its quarterfinal, and the composition matrix does the rest. This panel
 * only shows the organisers what the results imply and lets them commit it,
 * which also seeds the semifinals.
 */
export default function DerivedTeams({ rankings, teams, ready, squads, busy, onSave, onClear }) {
  const saved = squads.length > 0

  return (
    <div className="space-y-4">
      {/* ── How each division ranks its four survivors ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map(level => {
          const r = rankings[level]
          return (
            <div key={level} className="rounded-xl border border-hairline bg-surface p-4">
              <div className="mb-2.5 flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', CATEGORY_COLOR[level].dot)} />
                <span className="mr-auto font-display text-base text-fg">
                  {CATEGORY_META[level].name}
                </span>
                <Badge tone={r?.complete ? 'accent' : 'neutral'} size="xs">
                  {r?.played ?? 0}/{r?.total ?? 0} cuartos
                </Badge>
              </div>

              <ol className="space-y-1">
                {(r?.ranked ?? []).map(entry => (
                  <li key={entry.team_id} className="flex items-baseline gap-2 text-[12px]">
                    <span className="tabular w-4 shrink-0 font-mono text-[11px] text-fg-subtle">
                      {entry.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-fg">{entry.team_name}</span>
                    {entry.viaBye ? (
                      <Badge tone="sand" size="xs">directa</Badge>
                    ) : (
                      <span className="tabular shrink-0 font-mono text-[10.5px] text-fg-subtle">
                        {entry.setsWon}–{entry.setsLost} · {fmt(entry.gameDiff)}
                      </span>
                    )}
                  </li>
                ))}
                {(r?.ranked?.length ?? 0) === 0 && (
                  <li className="text-[12px] text-fg-subtle">Sin cuartos jugados.</li>
                )}
              </ol>
            </div>
          )
        })}
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-fg-subtle">
        Las supervivientes se ordenan por diferencia de sets (un 2–0 pasa por delante de un 2–1) y,
        si empatan, por diferencia de juegos. En la 1ª y la 2ª división la pareja que pasó directa
        es la nº 1 sin jugar.
      </p>

      {/* ── The resulting teams ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map(team => (
          <div
            key={team.key}
            className={cn(
              'rounded-xl border bg-surface p-4',
              team.complete ? 'border-hairline' : 'border-dashed border-hairline-strong',
            )}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft font-display text-[13px] text-accent">
                {team.key}
              </span>
              <span className="mr-auto font-display text-base text-fg">{team.name}</span>
            </div>
            <ul className="space-y-1">
              {LEVELS.map(level => {
                const member = team.members[level]
                return (
                  <li key={level} className="flex items-baseline gap-2 text-[12px]">
                    <span className={cn('h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full', CATEGORY_COLOR[level].dot)} />
                    <span className="w-6 shrink-0 font-mono text-[10.5px] text-fg-subtle">
                      {CATEGORY_META[level].short}
                    </span>
                    <span className={cn('min-w-0 flex-1 truncate', member ? 'text-fg' : 'text-fg-subtle')}>
                      {member?.team_name ?? 'Pendiente de los cuartos'}
                    </span>
                    {member && (
                      <span className="tabular shrink-0 font-mono text-[10.5px] text-fg-subtle">
                        #{member.rank}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onSave}
          disabled={!ready || busy === 'teams'}
          title={ready ? undefined : 'Faltan cuartos por jugar'}
          className="h-9 rounded-lg bg-accent px-4 text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
        >
          {busy === 'teams'
            ? 'Formando…'
            : saved ? 'Rehacer equipos y semifinales' : 'Formar equipos y montar semifinales'}
        </button>

        {saved && (
          <button
            onClick={onClear}
            disabled={busy === 'clear-teams'}
            className="h-9 rounded-lg px-3 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
          >
            Deshacer
          </button>
        )}

        <span className="text-[11px] text-fg-subtle">
          Semifinales: A vs D y B vs C.
        </span>
      </div>
    </div>
  )
}

function fmt(diff) {
  if (diff === null || diff === undefined) return '—'
  return diff > 0 ? `+${diff}` : String(diff)
}
