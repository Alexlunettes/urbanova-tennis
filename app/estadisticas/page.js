import { getPairStats } from '@/lib/pair-stats'
import { LEVELS, CATEGORY_META, CATEGORY_COLOR, CATEGORY_RULES } from '@/lib/tournament'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import CategoryTabs, { parseCategory } from '@/app/components/ui/CategoryTabs'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import Button from '@/app/components/ui/Button'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import { cn } from '@/lib/cn'

export const revalidate = 0

export const metadata = { title: 'Estadísticas' }

export default async function EstadisticasPage({ searchParams }) {
  const params = await searchParams
  const cat    = parseCategory(params)

  const byDivision = await getPairStats()
  const rows       = byDivision[cat] ?? []
  const hasAny     = LEVELS.some(l => byDivision[l].some(r => r.MP > 0))
  const played     = rows.filter(r => r.MP > 0)

  return (
    <PageShell>
      <RealtimeRefresher tables={['matches', 'sets']} />

      <PageHeader
        eyebrow="Rendimiento por pareja"
        title="ESTADÍSTICAS"
        description="Los números se acumulan por pareja, no por jugador — las parejas no cambian en todo el torneo. Incluye la fase de grupos y las eliminatorias."
      />

      <CategoryTabs basePath="/estadisticas" active={cat} />

      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('h-2.5 w-2.5 rounded-full', CATEGORY_COLOR[cat].dot)} />
          <div>
            <p className="font-display text-3xl text-fg">{CATEGORY_META[cat].name}</p>
            <p className="mt-0.5 text-xs text-fg-subtle">
              {CATEGORY_RULES[cat].teams} parejas · {played.length} con partidos jugados
            </p>
          </div>
        </div>
        {played.length > 0 && (
          <Badge tone="accent" size="md" className="ml-auto">
            {/* Each match contributes an MP to both of its pairs, so halve the
                sum to get the number of matches actually played. */}
            {played.reduce((s, r) => s + r.MP, 0) / 2} partidos contabilizados
          </Badge>
        )}
      </div>

      {!hasAny ? (
        <EmptyState
          className="mt-8"
          icon={<ChartIcon />}
          title="Todavía sin resultados"
          description="Las estadísticas se calculan automáticamente en cuanto se registra el primer partido."
          action={<Button href="/partidos" variant="secondary">Ver calendario</Button>}
        />
      ) : played.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<ChartIcon />}
          title={`Sin partidos en ${CATEGORY_META[cat].name}`}
          description="Esta división aún no ha disputado ningún partido."
        />
      ) : (
        <>
          <Leaders rows={played} />
          <StatsTable rows={played} />
          <p className="mt-3 px-1 text-[11px] text-fg-subtle">
            PJ partidos jugados · G ganados · P perdidos · Dif. diferencia de juegos ·
            Forma: últimos cinco partidos, el más reciente a la izquierda
          </p>
        </>
      )}
    </PageShell>
  )
}

/** Three headline cards above the table — the story before the spreadsheet. */
function Leaders({ rows }) {
  const mostWins = rows[0]
  const bestDiff = [...rows].sort((a, b) => b.diff - a.diff)[0]
  const bestRate = [...rows].filter(r => r.MP >= 2).sort((a, b) => b.winRate - a.winRate)[0]

  const cards = [
    { label: 'Más victorias',      pair: mostWins, value: `${mostWins?.W ?? 0}`,                 unit: 'ganados' },
    { label: 'Mejor diferencia',   pair: bestDiff, value: bestDiff ? (bestDiff.diff > 0 ? `+${bestDiff.diff}` : `${bestDiff.diff}`) : '—', unit: 'juegos' },
    { label: 'Mejor porcentaje',   pair: bestRate, value: bestRate ? `${Math.round(bestRate.winRate * 100)}%` : '—', unit: 'victorias' },
  ]

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {cards.map(({ label, pair, value, unit }) => (
        <div key={label} className="rounded-2xl border border-hairline bg-surface p-4 shadow-xs">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
          <p className="tabular mt-1.5 font-display text-3xl text-fg">
            {value} <span className="font-sans text-[11px] font-normal text-fg-subtle">{unit}</span>
          </p>
          <p className="mt-1 truncate text-[12px] text-fg-muted">{pair?.name ?? '—'}</p>
        </div>
      ))}
    </div>
  )
}

function StatsTable({ rows }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <Th className="w-12 pl-5 text-left">#</Th>
              <Th className="text-left">Pareja</Th>
              <Th className="w-12" title="Partidos jugados">PJ</Th>
              <Th className="w-12" title="Ganados">G</Th>
              <Th className="w-12" title="Perdidos">P</Th>
              <Th className="w-14" title="Porcentaje de victorias">%</Th>
              <Th className="w-20">Sets</Th>
              <Th className="w-24">Juegos</Th>
              <Th className="w-14" title="Diferencia de juegos">Dif.</Th>
              <Th className="w-24 pr-5">Forma</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className="border-b border-hairline last:border-0 transition-colors hover:bg-surface-2/70"
              >
                <td className="py-3.5 pl-5">
                  <span className="tabular font-mono text-[13px] text-fg-subtle">{i + 1}</span>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="flex items-center gap-1.5">
                    {i === 0 && <span title="Líder de la división" aria-label="Líder">🏆</span>}
                    <span className={cn('truncate text-[13.5px]', i === 0 ? 'font-medium text-fg' : 'text-fg')}>
                      {r.name}
                    </span>
                  </p>
                  {r.players.length > 0 && (
                    <p className="mt-0.5 truncate text-[11px] text-fg-subtle">{r.players.join(' · ')}</p>
                  )}
                </td>
                <Td muted>{r.MP}</Td>
                <Td strong>{r.W}</Td>
                <Td muted>{r.L}</Td>
                <td className="px-2 py-3.5 text-center">
                  <span
                    className={cn(
                      'tabular font-mono text-[13px]',
                      r.winRate >= 0.5 ? 'text-brand-600 dark:text-brand-400' : 'text-fg-subtle',
                    )}
                  >
                    {Math.round(r.winRate * 100)}%
                  </span>
                </td>
                <Td muted>{r.SW}–{r.SL}</Td>
                <Td muted>{r.GW}–{r.GL}</Td>
                <td className="px-2 py-3.5 text-center">
                  <span
                    className={cn(
                      'tabular font-mono text-[13px]',
                      r.diff > 0 ? 'text-brand-600 dark:text-brand-400'
                      : r.diff < 0 ? 'text-fg-subtle'
                      : 'text-fg-muted',
                    )}
                  >
                    {r.diff > 0 ? `+${r.diff}` : r.diff}
                  </span>
                </td>
                <td className="py-3.5 pr-5">
                  <span className="flex items-center justify-center gap-1" aria-label={`Forma: ${r.streak.map(w => (w ? 'victoria' : 'derrota')).join(', ')}`}>
                    {r.streak.length === 0
                      ? <span className="text-[11px] text-fg-subtle">—</span>
                      : r.streak.map((won, k) => (
                          <span
                            key={k}
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              won ? 'bg-accent' : 'bg-hairline-strong',
                            )}
                          />
                        ))}
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

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" />
      <path d="M7 15l3.5-4 3 2.5L18 8" />
    </svg>
  )
}
