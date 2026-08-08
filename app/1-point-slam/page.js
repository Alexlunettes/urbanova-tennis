import { supabase } from '@/lib/supabase'
import { buildSlamBracket, SLAM_SCHEDULE, participantLabel, halfOf } from '@/lib/slam'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import SlamBracket, { SlamSummary } from '@/app/components/SlamBracket'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Card from '@/app/components/ui/Card'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

export const revalidate = 0

export const metadata = {
  title: '1 Point Slam',
  description: 'El cuadro individual del 1 Point Slam: 16 jugadores, un solo punto por partido.',
}

export default async function SlamPage() {
  const [{ data: participants }, { data: matches }] = await Promise.all([
    supabase.from('slam_participants')
      .select('id, seed, label, player:player_id(id, name)')
      .order('seed'),
    supabase.from('slam_matches')
      .select('id, round, position, winner_slot, score, completed, scheduled_at, court'),
  ])

  // `null` means migration 0006 has not been run yet; an empty array means it
  // has, but the draw has not been set up in the admin panel.
  const needsMigration = participants === null
  const ready = (participants?.length ?? 0) > 0

  const { rounds, champion } = buildSlamBracket(participants ?? [], matches ?? [])

  return (
    <PageShell width="wide">
      <RealtimeRefresher tables={['slam_matches', 'slam_participants']} />

      <PageHeader
        eyebrow="Competición individual · domingo 9 de agosto"
        title="1 POINT SLAM"
        description="Una competición aparte del torneo de dobles: aquí se juega individual y a muerte súbita. Dieciséis jugadores, un punto por partido, eliminación directa hasta que solo queda uno."
        actions={ready ? <SlamSummary rounds={rounds} champion={champion} /> : null}
      />

      {/* ── What this is, and what it is not ── */}
      <Card className="mb-8 bg-accent-soft p-5" accent>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div className="min-w-56 flex-1">
            <p className="font-display text-base text-fg">CÓMO FUNCIONA</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
              Competición <span className="font-medium text-fg">individual</span>, no por
              equipos ni por parejas: no cuenta para el cuadro del torneo ni para las
              divisiones. Se juega a eliminación directa —{' '}
              <span className="font-medium text-fg">octavos, cuartos, semifinales y final</span>{' '}
              — y el ganador de cada partido pasa automáticamente a la ronda siguiente.
            </p>
          </div>
          <div className="min-w-44">
            <p className="font-display text-base text-fg">HORARIO</p>
            <ul className="mt-1.5 space-y-1 text-[13px] text-fg-muted">
              <li className="flex gap-2.5">
                <span className="tabular font-mono text-fg">{SLAM_SCHEDULE.round_of_16.time}</span>
                <span>Octavos de final</span>
              </li>
              <li className="flex gap-2.5">
                <span className="tabular font-mono text-fg">{SLAM_SCHEDULE.quarterfinal.time}</span>
                <span>Cuartos, semis y final</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {needsMigration ? (
        <EmptyState
          title="El 1 Point Slam aún no está activo"
          description="Falta ejecutar la migración 0006 en Supabase."
        />
      ) : !ready ? (
        <EmptyState
          title="Cuadro por sortear"
          description="Los dieciséis participantes se publicarán aquí en cuanto la organización prepare el cuadro."
        />
      ) : (
        <>
          <section className="mb-10">
            <SlamBracket rounds={rounds} champion={champion} />
          </section>

          <ParticipantList participants={participants} />
        </>
      )}
    </PageShell>
  )
}

/** The sixteen entrants, by half of the draw. */
function ParticipantList({ participants }) {
  const halves = [
    { key: 'top',    label: 'Parte alta del cuadro' },
    { key: 'bottom', label: 'Parte baja del cuadro' },
  ]

  return (
    <section>
      <h2 className="mb-1 font-display text-2xl text-fg">LOS 16 PARTICIPANTES</h2>
      <p className="mb-5 text-[13px] text-fg-muted">
        Dos jugadores de la misma mitad solo pueden cruzarse antes de la final.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {halves.map(half => (
          <div key={half.key} className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
            <div className="border-b border-hairline bg-surface-2/50 px-4 py-2.5">
              <span className="font-display text-base text-fg">{half.label}</span>
            </div>
            <ul className="divide-y divide-hairline">
              {participants
                .filter(p => halfOf(p.seed) === half.key)
                .map(p => (
                  <li key={p.seed} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="tabular w-5 shrink-0 font-mono text-[11px] text-fg-subtle">
                      {p.seed}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-[13px]',
                        p.player ? 'text-fg' : 'italic text-fg-subtle',
                      )}
                    >
                      {participantLabel(p)}
                    </span>
                    {!p.player && <Badge tone="neutral" size="xs">Pendiente</Badge>}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
