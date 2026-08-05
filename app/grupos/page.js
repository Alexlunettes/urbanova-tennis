import { supabase } from '@/lib/supabase'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { CATEGORY_META, CATEGORY_RULES, CATEGORY_COLOR, formatFor } from '@/lib/tournament'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import CategoryTabs, { parseCategory } from '@/app/components/ui/CategoryTabs'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

export const revalidate = 0 // Standings must never be served stale.

export const metadata = { title: 'Clasificación' }

/** Row treatment per qualification zone. */
const ZONE = {
  semifinal:    { bar: 'bg-sand-600 dark:bg-sand-400', tint: 'bg-sand-50/60 dark:bg-sand-400/[0.07]'   },
  quarterfinal: { bar: 'bg-brand-500',                 tint: 'bg-brand-50/50 dark:bg-brand-500/[0.06]' },
  eliminated:   { bar: 'bg-transparent',               tint: ''                                        },
}

export default async function GruposPage({ searchParams }) {
  const params = await searchParams
  const cat    = parseCategory(params)
  const rules  = CATEGORY_RULES[cat]

  const [{ data: teams }, { data: matches }, { data: groups }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, player1:player1_id(name), player2:player2_id(name)')
      .eq('level', cat)
      .order('name'),

    supabase
      .from('matches')
      .select('id, team1_id, team2_id, group_id, completed, sets(team1_score, team2_score)')
      .eq('stage', 'group_stage')
      .eq('level', cat),

    supabase
      .from('tournament_groups')
      .select('id, name, group_entries(team_id)')
      .eq('level', cat)
      .order('name'),
  ])

  const toRow = t => ({
    team_id:   t.id,
    team_name: t.name,
    players:   [t.player1?.name, t.player2?.name].filter(Boolean),
  })

  const isSplit = rules.groups > 1 && (groups ?? []).length > 1

  // Divisions 1, 2 and 4 are one table; division 3 is three groups of four.
  const single  = isSplit ? null : calculateCategoryStandings(cat, (teams ?? []).map(toRow), matches ?? [])
  const grouped = isSplit
    ? calculateGroupedStandings(
        cat,
        (groups ?? []).map(g => ({
          id:   g.id,
          name: g.name,
          teams: (g.group_entries ?? [])
            .map(e => (teams ?? []).find(t => t.id === e.team_id))
            .filter(Boolean)
            .map(toRow),
        })),
        matches ?? [],
      )
    : null

  const played = (matches ?? []).filter(m => m.completed).length
  const total  = (matches ?? []).length
  const hasAny = (teams ?? []).length > 0

  return (
    <PageShell>
      <RealtimeRefresher tables={['matches', 'sets']} />

      <PageHeader
        eyebrow="Fase de grupos"
        title="CLASIFICACIÓN"
        description="Los partidos de grupo se juegan a un set. Se ordena por partidos ganados y, en caso de empate, por juegos."
      />

      <CategoryTabs basePath="/grupos" active={cat} />

      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="font-display text-3xl text-fg">{CATEGORY_META[cat].name}</p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {rules.teams} parejas ·{' '}
            {rules.groups > 1 ? `${rules.groups} grupos de 4 · ` : ''}
            {rules.byes > 0
              ? `1ª a semifinales, ${rules.qualifiers} a cuartos`
              : `Top ${rules.qualifiers} a cuartos`}
            {' · '}{formatFor('group_stage').label}
          </p>
        </div>
        {total > 0 && (
          <Badge tone={played === total ? 'accent' : 'neutral'} size="md" className="ml-auto">
            {played} / {total} partidos jugados
          </Badge>
        )}
      </div>

      {!hasAny ? (
        <EmptyState
          className="mt-8"
          icon={<TableIcon />}
          title="Clasificación no disponible"
          description={`Las parejas de la ${CATEGORY_META[cat].name} aparecerán aquí en cuanto se cargue el sorteo.`}
        />
      ) : isSplit ? (
        <>
          <div className="mt-6 space-y-8">
            {grouped.tables.map(table => (
              <section key={table.id}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={cn('h-2 w-2 rounded-full', CATEGORY_COLOR[cat].dot)} />
                  <h2 className="font-display text-xl text-fg">{table.name}</h2>
                  <span className="h-px flex-1 bg-hairline" />
                </div>
                <StandingsTable standings={table.standings} showGroupRank />
              </section>
            ))}
          </div>
          <GroupedLegend grouped={grouped} />
        </>
      ) : (
        <>
          <StandingsTable standings={single} />
          <Legend rules={rules} />
        </>
      )}

      {rules.fourMatchPair && (
        <FourMatchNote pair={rules.fourMatchPair} />
      )}
    </PageShell>
  )
}

function StandingsTable({ standings, showGroupRank = false }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-140 text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <Th className="w-14 pl-5 text-left">#</Th>
              <Th className="text-left">Pareja</Th>
              <Th className="w-12" title="Partidos que cuentan">PJ</Th>
              <Th className="w-12" title="Ganados">G</Th>
              <Th className="w-12" title="Perdidos">P</Th>
              <Th className="w-24" title="Juegos ganados y perdidos">Juegos</Th>
              <Th className="w-16 pr-5" title="Diferencia de juegos">Dif.</Th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const zone = ZONE[row.qualification] ?? ZONE.eliminated
              const diff = row.GW - row.GL
              const rank = showGroupRank ? row.groupRank : row.rank
              const isCut = i > 0 && standings[i - 1].qualification !== row.qualification

              return (
                <tr
                  key={row.team_id}
                  className={cn(
                    'border-b border-hairline last:border-0 transition-colors hover:bg-surface-2/80',
                    zone.tint,
                    isCut && 'border-t-2 border-t-hairline-strong',
                  )}
                >
                  <td className="relative py-3.5 pl-5">
                    <span className={cn('absolute left-0 top-0 h-full w-0.75', zone.bar)} />
                    <span
                      className={cn(
                        'tabular font-mono text-[13px]',
                        row.qualification === 'eliminated' ? 'text-fg-subtle' : 'font-medium text-fg',
                      )}
                    >
                      {rank}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4">
                    <p className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate text-[13.5px] font-medium',
                          row.qualification === 'eliminated' ? 'text-fg-muted' : 'text-fg',
                        )}
                      >
                        {row.team_name}
                      </span>
                      {row.isBestThird && (
                        <Badge tone="accent" size="xs">Mejor 3º</Badge>
                      )}
                      {row.dropped > 0 && (
                        <Badge tone="neutral" size="xs" title="Juega un partido de más; se descarta su tercer mejor resultado">
                          {row.played} jugados
                        </Badge>
                      )}
                    </p>
                    {row.players.length > 0 && (
                      <p className="mt-0.5 truncate text-[11px] text-fg-subtle">
                        {row.players.join(' · ')}
                      </p>
                    )}
                  </td>

                  <Td muted>{row.MP}</Td>
                  <Td strong>{row.W}</Td>
                  <Td muted>{row.L}</Td>
                  <Td muted>{row.GW}–{row.GL}</Td>
                  <td className="py-3.5 pr-5 text-center">
                    <span
                      className={cn(
                        'tabular font-mono text-[13px]',
                        diff > 0 ? 'text-brand-600 dark:text-brand-400'
                        : diff < 0 ? 'text-fg-subtle'
                        : 'text-fg-muted',
                      )}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Legend({ rules }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
      {rules.byes > 0 && (
        <LegendItem bar="bg-sand-600 dark:bg-sand-400" label="Pasa directa a semifinales" />
      )}
      <LegendItem bar="bg-brand-500" label="Clasifica a cuartos de final" />
      <LegendItem bar="bg-ink-300 dark:bg-ink-700" label="Eliminada" />
      <p className="ml-auto text-[11px] text-fg-subtle">
        Desempate: partidos ganados → derrotas → diferencia de juegos
      </p>
    </div>
  )
}

function GroupedLegend({ grouped }) {
  const thirds = grouped.qualifiedThirds.length
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
      <LegendItem bar="bg-brand-500" label="Clasifica a cuartos de final" />
      <LegendItem bar="bg-ink-300 dark:bg-ink-700" label="Eliminada" />
      <p className="ml-auto text-[11px] text-fg-subtle">
        Pasan los dos primeros de cada grupo y {thirds > 0 ? `los ${thirds} mejores terceros` : 'los mejores terceros'}
      </p>
    </div>
  )
}

function FourMatchNote({ pair }) {
  return (
    <aside className="mt-6 rounded-2xl border border-sand-200 bg-sand-50/70 p-5 dark:border-sand-400/25 dark:bg-sand-400/[0.07]">
      <div className="flex gap-3.5">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
          className="mt-0.5 shrink-0 text-sand-600 dark:text-sand-300"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9.2" />
          <path d="M12 16.5v-5M12 8h.01" />
        </svg>
        <p className="text-[12.5px] leading-relaxed text-fg-muted">
          <span className="font-medium text-fg">{pair}</span> juega cuatro
          partidos en lugar de tres. Para igualar la comparación solo cuentan
          tres de sus resultados: los <span className="font-medium text-fg">dos
          mejores y el peor</span>. El tercer mejor se descarta.
        </p>
      </div>
    </aside>
  )
}

function LegendItem({ bar, label }) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-fg-muted">
      <span className={cn('h-3 w-0.75 rounded-full', bar)} />
      {label}
    </span>
  )
}

function Th({ children, className, ...props }) {
  return (
    <th
      className={cn('px-2 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle', className)}
      {...props}
    >
      {children}
    </th>
  )
}

function Td({ children, strong = false, muted = false }) {
  return (
    <td className="px-2 py-3.5 text-center">
      <span className={cn('tabular font-mono text-[13px]', strong && 'font-medium text-fg', muted && 'text-fg-muted')}>
        {children}
      </span>
    </td>
  )
}

function TableIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M9 10v10" />
    </svg>
  )
}
