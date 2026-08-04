import { supabase } from '@/lib/supabase'
import { buildBracket } from '@/lib/squads'
import { ROUNDS } from '@/lib/tournament'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import SquadEncounterCard from '@/app/components/SquadEncounterCard'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import Button from '@/app/components/ui/Button'

export const revalidate = 0

export const metadata = { title: 'Cuadro final' }

const ROUND_ORDER = ['quarterfinal', 'semifinal', 'final']

/**
 * Attaches each squad's registered pairs, indexed by category, so a tie can
 * still show who is in a squad before its matches have been created.
 */
function indexSquads(squads = []) {
  const map = {}
  for (const squad of squads) {
    const membersByCategory = {}
    for (const m of squad.squad_members ?? []) {
      if (m.teams) membersByCategory[m.category] = m.teams
    }
    map[squad.id] = { ...squad, membersByCategory }
  }
  return map
}

export default async function CuadroPage() {
  const [{ data: encounters }, { data: squads }, { data: matches }] = await Promise.all([
    supabase
      .from('squad_encounters')
      .select('id, round, position, squad1_id, squad2_id, is_reduced, scheduled_at, court')
      .order('position'),

    supabase
      .from('squads')
      .select('id, name, seed, squad_members(category, teams(id, name))'),

    supabase
      .from('matches')
      .select(`
        id, level, stage, squad_encounter_id, completed, winner_id, team1_id, team2_id,
        team1:team1_id(id, name),
        team2:team2_id(id, name),
        sets(set_number, team1_score, team2_score, is_super_tiebreak)
      `)
      .not('squad_encounter_id', 'is', null),
  ])

  const squadIndex = indexSquads(squads ?? [])

  // Expand the squad relations before resolving, so each tie carries its rosters.
  const enriched = (encounters ?? []).map(e => ({
    ...e,
    squad1: squadIndex[e.squad1_id] ?? null,
    squad2: squadIndex[e.squad2_id] ?? null,
  }))

  const bracket = buildBracket(enriched, matches ?? [])
  const hasBracket = bracket.length > 0

  return (
    <PageShell width="wide">
      <RealtimeRefresher
        tables={['squad_encounters', 'squads', 'squad_members', 'matches', 'sets']}
      />

      <PageHeader
        eyebrow="Fase eliminatoria"
        title="CUADRO FINAL"
        description="Desde cuartos se compite por escuadras: una pareja de cada categoría por bando y cuatro partidos por eliminatoria. Gana la escuadra que se lleve la mayoría."
      />

      {!hasBracket ? (
        <EmptyState
          icon={<TrophyIcon />}
          title="El cuadro aún no está formado"
          description="Las escuadras se componen cuando termina la fase de grupos. Mientras tanto, sigue la carrera por clasificarse en la tabla de cada categoría."
          action={<Button href="/grupos" variant="secondary">Ver clasificación</Button>}
        />
      ) : (
        <div className="space-y-14">
          {ROUND_ORDER.map(round => {
            const ties = bracket.filter(b => b.round === round)
            if (ties.length === 0) return null
            const meta    = ROUNDS[round]
            const isFinal = round === 'final'
            const done    = ties.filter(t => t.resolution.isComplete).length

            return (
              <section key={round}>
                <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
                  <h2 className="font-display text-3xl text-fg">{meta.label.toUpperCase()}</h2>
                  <Badge tone={isFinal ? 'sand' : 'neutral'} size="md">
                    {ties.length} {ties.length === 1 ? 'eliminatoria' : 'eliminatorias'}
                  </Badge>
                  {done > 0 && (
                    <Badge tone="accent" size="md" className="ml-auto">
                      {done} resuelta{done === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>

                <div
                  className={
                    isFinal
                      ? 'mx-auto max-w-2xl'
                      : 'grid gap-4 lg:grid-cols-2'
                  }
                >
                  {ties.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {entry.is_reduced && (
                        <div className="mb-2 flex items-center gap-2">
                          <Badge tone="court" size="xs">Eliminatoria especial</Badge>
                          <span className="text-[11px] text-fg-subtle">
                            Solo Categorías 3 y 4 · 2 partidos
                          </span>
                        </div>
                      )}
                      <SquadEncounterCard entry={entry} isFinal={isFinal} />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}

          <SpecialCaseNote />
        </div>
      )}
    </PageShell>
  )
}

/** Explains the 7-team quirk in plain language, on the page where it bites. */
function SpecialCaseNote() {
  return (
    <aside className="rounded-2xl border border-court-200/70 bg-court-50/50 p-5 dark:border-court-400/20 dark:bg-court-400/5">
      <div className="flex gap-3.5">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
          className="mt-0.5 shrink-0 text-court-600 dark:text-court-300"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9.2" />
          <path d="M12 16.5v-5M12 8h.01" />
        </svg>
        <div>
          <p className="text-[13px] font-medium text-fg">
            Por qué unos cuartos se juegan a solo dos partidos
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-muted">
            Las Categorías 1 y 2 tienen siete parejas, y su primera clasificada
            pasa directamente a semifinales. Eso deja seis parejas de cada una
            para los cuartos, frente a las ocho de las Categorías 3 y 4. Por
            tanto una de las cuatro eliminatorias de cuartos la disputan
            únicamente las parejas de Categoría 3 y 4. La escuadra que la gane
            recibe sus parejas de Categoría 1 y 2 al llegar a semifinales.
          </p>
        </div>
      </div>
    </aside>
  )
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4M9 20h6M12 14v6" />
    </svg>
  )
}
