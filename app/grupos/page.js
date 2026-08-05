import { supabase } from '@/lib/supabase'
import { calculateCategoryStandings } from '@/lib/standings'
import { CATEGORY_META, CATEGORY_RULES } from '@/lib/tournament'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import CategoryTabs, { parseCategory } from '@/app/components/ui/CategoryTabs'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

export const revalidate = 0 // Standings must never be served stale.

export const metadata = { title: 'Clasificación' }

/**
 * Row treatment per qualification zone.
 * The bars use the 500/600 steps rather than 400: at 400 the orange only
 * reaches 2.5:1 against white, below the 3:1 WCAG needs for a non-text
 * indicator that carries meaning on its own.
 */
const ZONE = {
  semifinal:    { bar: 'bg-sand-600 dark:bg-sand-400',  tint: 'bg-sand-50/60 dark:bg-sand-400/[0.07]',   label: 'Semifinales' },
  quarterfinal: { bar: 'bg-brand-500',                  tint: 'bg-brand-50/50 dark:bg-brand-500/[0.06]', label: 'Cuartos'     },
  eliminated:   { bar: 'bg-transparent',                tint: '',                                        label: 'Eliminada'   },
}

export default async function GruposPage({ searchParams }) {
  const params = await searchParams
  const cat    = parseCategory(params)

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, player1:player1_id(name), player2:player2_id(name)')
      .eq('level', cat)
      .order('name'),

    supabase
      .from('matches')
      .select('id, team1_id, team2_id, completed, sets(team1_score, team2_score)')
      .eq('stage', 'group_stage')
      .eq('level', cat),
  ])

  const standings = calculateCategoryStandings(
    cat,
    (teams ?? []).map(t => ({
      team_id:   t.id,
      team_name: t.name,
      players:   [t.player1?.name, t.player2?.name].filter(Boolean),
    })),
    matches ?? [],
  )

  const rules       = CATEGORY_RULES[cat]
  const played      = (matches ?? []).filter(m => m.completed).length
  const totalGames  = (matches ?? []).length

  return (
    <PageShell>
      <RealtimeRefresher tables={['matches', 'sets']} />

      <PageHeader
        eyebrow="Fase de grupos"
        title="CLASIFICACIÓN"
        description="Formato Champions: cada pareja juega solo contra algunos rivales de su categoría. La posición final decide quién entra en el cuadro."
      />

      <CategoryTabs basePath="/grupos" active={cat} />

      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="font-display text-3xl text-fg">{CATEGORY_META[cat].name}</p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {rules.teams} parejas ·{' '}
            {rules.directToSemis > 0
              ? `1ª a semifinales, 2ª–${rules.teams} a cuartos`
              : `Top ${rules.toQuarters} a cuartos, ${rules.teams - rules.toQuarters} eliminadas`}
          </p>
        </div>
        {totalGames > 0 && (
          <Badge tone={played === totalGames ? 'accent' : 'neutral'} size="md" className="ml-auto">
            {played} / {totalGames} partidos jugados
          </Badge>
        )}
      </div>

      {standings.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<TableIcon />}
          title="Clasificación no disponible"
          description={`Las parejas de ${CATEGORY_META[cat].name} aparecerán aquí en cuanto se cargue el sorteo.`}
        />
      ) : (
        <>
          <StandingsTable standings={standings} />
          <Legend rules={rules} />
        </>
      )}
    </PageShell>
  )
}

function StandingsTable({ standings }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-155 text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <Th className="w-14 pl-5 text-left">#</Th>
              <Th className="text-left">Pareja</Th>
              <Th className="w-12" title="Partidos jugados">PJ</Th>
              <Th className="w-12" title="Ganados">G</Th>
              <Th className="w-12" title="Perdidos">P</Th>
              <Th className="w-20">Sets</Th>
              <Th className="w-20">Juegos</Th>
              <Th className="w-16 pr-5" title="Diferencia de juegos">Dif.</Th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const zone   = ZONE[row.qualification]
              const diff   = row.GW - row.GL
              const isCut  = i > 0 && standings[i - 1].qualification !== row.qualification

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
                        row.qualification === 'eliminated'
                          ? 'text-fg-subtle'
                          : 'font-medium text-fg',
                      )}
                    >
                      {row.rank}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4">
                    <p
                      className={cn(
                        'truncate text-[13.5px] font-medium',
                        row.qualification === 'eliminated' ? 'text-fg-muted' : 'text-fg',
                      )}
                    >
                      {row.team_name}
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
                  <Td muted>{row.SW}–{row.SL}</Td>
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
      {rules.directToSemis > 0 && (
        <LegendItem bar="bg-sand-600 dark:bg-sand-400" label="Clasifica directamente a semifinales" />
      )}
      <LegendItem bar="bg-brand-500" label="Clasifica a cuartos de final" />
      <LegendItem bar="bg-ink-300 dark:bg-ink-700" label="Eliminada" />
      <p className="ml-auto text-[11px] text-fg-subtle">
        Desempate: victorias → derrotas → diferencia de sets → diferencia de juegos
      </p>
    </div>
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
      className={cn(
        'px-2 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

function Td({ children, strong = false, muted = false }) {
  return (
    <td className="px-2 py-3.5 text-center">
      <span
        className={cn(
          'tabular font-mono text-[13px]',
          strong && 'font-medium text-fg',
          muted && 'text-fg-muted',
        )}
      >
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
