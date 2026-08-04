import { getPlayerStats } from '@/lib/player-stats'
import { LEVELS, CATEGORY_META } from '@/lib/tournament'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import Button from '@/app/components/ui/Button'
import { cn } from '@/lib/cn'

export const revalidate = 30

export const metadata = { title: 'Estadísticas' }

export default async function EstadisticasPage() {
  const statsByCategory = await getPlayerStats()
  const hasData = LEVELS.some(l => statsByCategory[l].length > 0)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Rendimiento individual"
        title="ESTADÍSTICAS"
        description="Números acumulados de cada jugador a lo largo del torneo, ordenados por victorias y diferencia de juegos."
      />

      {!hasData ? (
        <EmptyState
          icon={<ChartIcon />}
          title="Todavía sin resultados"
          description="Las estadísticas se calculan automáticamente en cuanto se registra el primer partido."
          action={<Button href="/partidos" variant="secondary">Ver calendario</Button>}
        />
      ) : (
        <div className="space-y-14">
          {LEVELS.map(level => {
            const players = statsByCategory[level]
            if (players.length === 0) return null
            return (
              <section key={level}>
                <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
                  <span className="font-display text-4xl text-accent/30">
                    {CATEGORY_META[level].short}
                  </span>
                  <h2 className="mr-auto font-display text-2xl text-fg">
                    {CATEGORY_META[level].name}
                  </h2>
                  <Badge tone="neutral" size="md">{players.length} jugadores</Badge>
                </div>
                <StatsTable players={players} />
              </section>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}

function StatsTable({ players }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-155 text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <Th className="w-12 pl-5 text-left">#</Th>
              <Th className="text-left">Jugador</Th>
              <Th className="w-12" title="Partidos jugados">PJ</Th>
              <Th className="w-12" title="Partidos ganados">PG</Th>
              <Th className="w-12" title="Partidos perdidos">PP</Th>
              <Th className="w-16" title="Porcentaje de victorias">%</Th>
              <Th className="w-20">Sets</Th>
              <Th className="w-20 pr-5">Juegos</Th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={p.id}
                className="border-b border-hairline last:border-0 transition-colors hover:bg-surface-2/70"
              >
                <td className="py-3.5 pl-5">
                  <span className="tabular font-mono text-[13px] text-fg-subtle">{i + 1}</span>
                </td>
                <td className="py-3.5 pr-4">
                  <span className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="text-[13px]" title="Líder de la categoría" aria-label="Líder">🏆</span>
                    )}
                    <span className={cn('truncate text-[13.5px]', i === 0 ? 'font-medium text-fg' : 'text-fg-muted')}>
                      {p.name}
                    </span>
                  </span>
                </td>
                <Td muted>{p.matchesPlayed}</Td>
                <Td strong>{p.matchesWon}</Td>
                <Td muted>{p.matchesPlayed - p.matchesWon}</Td>
                <td className="px-2 py-3.5 text-center">
                  <span
                    className={cn(
                      'tabular font-mono text-[13px]',
                      p.winRate >= 0.5 ? 'text-brand-600 dark:text-brand-400' : 'text-fg-subtle',
                    )}
                  >
                    {Math.round(p.winRate * 100)}%
                  </span>
                </td>
                <Td muted>{p.setsWon}–{p.setsLost}</Td>
                <td className="px-2 py-3.5 pr-5 text-center">
                  <span className="tabular font-mono text-[13px] text-fg-muted">
                    {p.gamesWon}–{p.gamesLost}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" />
      <path d="M7 15l3.5-4 3 2.5L18 8" />
    </svg>
  )
}
